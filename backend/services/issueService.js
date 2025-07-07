import { Issue } from '../models/issue.model.js'; // Adjust the path as needed

/**
 * Builds a MongoDB query object from a set of filter parameters.
 * @param {object} [filters={}] - The filter criteria from the request query.
 * @param {object} [options={}] - Options to control the query building logic.
 * @param {boolean} [options.defaultToOpen=true] - If true, defaults the state to 'open' if not specified.
 * @returns {object} A MongoDB query object.
 * @private
 */
const _buildIssuesQuery = (filters = {}, options = {}) => {
    const { defaultToOpen = true } = options;
    const query = {};

    const buildDateQuery = (startDate, endDate) => {
        const dateQuery = {};
        if (startDate) dateQuery.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setUTCHours(23, 59, 59, 999);
            dateQuery.$lte = end;
        }
        return dateQuery;
    };

    const dateFields = {
        createdAt: buildDateQuery(filters.createdStartDate, filters.createdEndDate),
        updatedAt: buildDateQuery(filters.updatedStartDate, filters.updatedEndDate),
        closedAt: buildDateQuery(filters.closedStartDate, filters.closedEndDate),
    };

    for (const field in dateFields) {
        if (Object.keys(dateFields[field]).length > 0) {
            query[field] = dateFields[field];
        }
    }

    // --- Revised State Logic ---
    if (filters.state && filters.state !== 'all') {
        // Highest precedence: an explicit state filter from the user.
        query.state = filters.state;
    } else if (filters.closedById || query.closedAt) {
        // Second precedence: filters that imply a 'closed' state.
        query.state = 'closed';
    } else if (defaultToOpen && filters.state !== 'all') {
        // Lowest precedence: default to 'open' only if allowed and 'all' wasn't specified.
        query.state = 'open';
    }
    
    // Ensure closedAt has a value if it's part of the query
    if (query.closedAt) {
        query.closedAt = { ...query.closedAt, $ne: null };
    }
    // --- End of Revised State Logic ---

    if (filters.pull_request !== undefined) {
        query.pull_request = filters.pull_request === 'true';
    }
    if (filters.user) query['user.login'] = filters.user;
    if (filters.createdById) query['user.id'] = parseInt(filters.createdById, 10);
    if (filters.assignees) query['assignees.login'] = { $in: filters.assignees.split(',') };
    if (filters.assignee_ids) query['assignees.id'] = { $in: filters.assignee_ids.split(',').map(id => parseInt(id.trim(), 10)) };
    if (filters.labels) query.labels = { $all: filters.labels.split(',').map(label => new RegExp(label.trim(), 'i')) };
    if (filters.issueType) query.issueType = filters.issueType;

    return query;
};

/**
 * Service object encapsulating all complex issue-related business logic.
 */
export const issueService = {
   // Fast summary endpoint for doughnut chart
   async getSummaryStats(filters = {}) {
    const query = _buildIssuesQuery(filters, { defaultToOpen: false });
    
    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: null,
          totalIssues: { $sum: 1 },
          openIssues: { $sum: { $cond: [{ $eq: ["$state", "open"] }, 1, 0] } },
          closedIssues: { $sum: { $cond: [{ $eq: ["$state", "closed"] }, 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          totalIssues: 1,
          openIssues: 1,
          closedIssues: 1
        }
      }
    ];

    const result = await Issue.aggregate(pipeline);
    return result[0] || { 
      totalIssues: 0, 
      openIssues: 0, 
      closedIssues: 0 
    };
  },
  // This function and its pipeline are correct based on our last revision.
  async getAssigneeStats(filters = {}, sortOptions = {}, pagination = {}) {
    const { page = 1, limit = 15 } = pagination;
    const skip = (page - 1) * limit;
    // Calls the builder with defaultToOpen: false, correctly getting all states by default.
    const query = _buildIssuesQuery(filters, { defaultToOpen: false });
     // Extract assignee-specific filters for post-unwind filtering
    const assigneePostFilters = {};
    if (filters.assignees) {
      assigneePostFilters['assignees.login'] = { $in: filters.assignees.split(',') };
    }

    if (filters.assignee_ids) {
      assigneePostFilters['assignees.id'] = { $in: filters.assignee_ids.split(',').map(id => parseInt(id.trim(), 10)) };
    }

    const validSortFields = {
        openIssues: 'openIssues',
        closedIssues: 'closedIssues',
        totalIssues: 'totalIssues',
        name: 'employee.name'
    };
    const sortBy = validSortFields[sortOptions.sortBy] || 'totalIssues';
    const sortOrder = sortOptions.order === 'asc' ? 1 : -1;

    // Base aggregation stages (shared between count and data queries)
    const baseAggregationStages = [
      { $match: query },
      { $unwind: "$assignees" },
      ...(Object.keys(assigneePostFilters).length > 0 ? [{ $match: assigneePostFilters }] : []),
      {
        $group: {
          _id: { id: "$assignees.id", login: "$assignees.login" },
          openIssues: { $sum: { $cond: [{ $eq: ["$state", "open"] }, 1, 0] } },
          closedIssues: { $sum: { $cond: [{ $eq: ["$state", "closed"] }, 1, 0] } },
          issues: { $push: { state: "$state", labels: "$labels" } }
        }
      },
      { $unwind: "$issues" },
      { $unwind: { path: "$issues.labels", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            assigneeId: "$_id.id",
            assigneeLogin: "$_id.login",
            state: "$issues.state",
            label: "$issues.labels"
          },
          labelCount: { $sum: 1 },
          openIssues: { $first: "$openIssues" },
          closedIssues: { $first: "$closedIssues" }
        }
      },
      {
        $group: {
          _id: {
            assigneeId: "$_id.assigneeId",
            assigneeLogin: "$_id.assigneeLogin",
            state: "$_id.state"
          },
          labels: { $push: { label: "$_id.label", count: "$labelCount" } },
          openIssues: { $first: "$openIssues" },
          closedIssues: { $first: "$closedIssues" }
        }
      },
      {
        $group: {
          _id: { id: "$_id.assigneeId", login: "$_id.assigneeLogin" },
          countsByStateAndLabel: {
            $push: {
              state: "$_id.state",
              stateCount: { $sum: "$labels.count" },
              labels: "$labels"
            }
          },
          openIssues: { $first: "$openIssues" },
          closedIssues: { $first: "$closedIssues" }
        }
      },
      {
        $lookup: {
          from: "employees",
          localField: "_id.id",
          foreignField: "githubId",
          as: "employeeInfo"
        }
      },
      { $unwind: { path: "$employeeInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          employee: {
            githubId: "$_id.id",
            login: "$_id.login",
            name: { $ifNull: ["$employeeInfo.name", "$_id.login"] },
            countsByStateAndLabel: "$countsByStateAndLabel"
          },
          openIssues: "$openIssues",
          closedIssues: "$closedIssues",
          totalIssues: { $add: ["$openIssues", "$closedIssues"] }
        }
      },
      { $sort: { [sortBy]: sortOrder } }
    ];

    // Pipeline for counting total records
    const countPipeline = [
      ...baseAggregationStages,
      { $count: "totalCount" }
    ];

    // Pipeline for getting paginated data
    const dataPipeline = [
      ...baseAggregationStages,
      { $skip: skip },
      { $limit: limit }
    ];

    try {
      // Execute both aggregations in parallel
      const [totalCountResult, paginatedResults] = await Promise.all([
        Issue.aggregate(countPipeline),
        Issue.aggregate(dataPipeline)
      ]);

      const totalCount = totalCountResult[0]?.totalCount || 0;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: paginatedResults,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error in getAssigneeStats aggregation:', error);
      throw error;
    }
  },

  // Enhanced findIssues with pagination  
  async findIssues(filters = {}, pagination = {}) {
    const { page = 1, limit = 15 } = pagination;
    const skip = (page - 1) * limit;
    // Calls the builder with defaultToOpen: true, correctly defaulting to 'open' issues.
    const query = _buildIssuesQuery(filters);
    // Valid sort fields for individual issues
    const validSortFields = {
      createdAt: 'createdAt',           // When issue was created
      updatedAt: 'updatedAt',           // When issue was last updated  
      closedAt: 'closedAt',             // When issue was closed
      title: 'title',                   // Issue title alphabetically
      number: 'number',                 // GitHub issue number
      state: 'state'                    // open/closed
    };

    const sortField = validSortFields[sortBy] || 'updatedAt';
    const sortDirection = order === 'asc' ? 1 : -1;

    // Get total count and paginated results in parallel
    const [totalCount, issues] = await Promise.all([
      Issue.countDocuments(query),
      Issue.find(query)
        .sort({ [sortField]: sortDirection })  // ✅ Dynamic sorting instead of hardcoded
        .skip(skip)
        .limit(limit)
    ]);
    const totalPages = Math.ceil(totalCount / limit);
    const staleCount = issues.filter(issue => issue.isStale(filters.staleDays)).length;

    let averageAgeInDays;
    if (query.state !== 'closed') {
        const openIssues = issues.filter(issue => issue.state === 'open');
        const totalAgeInDays = openIssues.reduce((sum, issue) => sum + issue.ageInDays, 0);
        averageAgeInDays = openIssues.length > 0 ? Math.round(totalAgeInDays / openIssues.length) : 0;
    }

    let averageResolutionTimeInDays;
    if (query.state !== 'open') {
        const resolvedIssues = issues.filter(issue => issue.resolutionTimeInDays !== null);
        const totalResolutionTimeInDays = resolvedIssues.reduce((sum, issue) => sum + issue.resolutionTimeInDays, 0);
        averageResolutionTimeInDays = resolvedIssues.length > 0 ? Math.round(totalResolutionTimeInDays / resolvedIssues.length) : 0;
    }
    
    const countsByStateAndLabel = await Issue.aggregate([
        { $match: query },
        { $unwind: { path: "$labels", preserveNullAndEmptyArrays: true } },
        { $group: { _id: { state: "$state", label: "$labels" }, count: { $sum: 1 } } },
        { $group: { _id: "$_id.state", labels: { $push: { label: "$_id.label", count: "$count" } }, stateCount: { $sum: "$count" } } },
        { $project: { _id: 0, state: "$_id", stateCount: "$stateCount", labels: "$labels" } }
    ]);

    return {
      data: issues,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      metrics: {
        totalCount,
        staleCount,
        ...(averageAgeInDays !== undefined && { averageAgeInDays }),
        ...(averageResolutionTimeInDays !== undefined && { averageResolutionTimeInDays }),
        countsByStateAndLabel
      }
    };
  }
};