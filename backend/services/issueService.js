import { Issue } from '../models/issue.model.js'; // Adjust the path as needed
import mongoose from 'mongoose';
// Ensure this path is correct for your project structure
import { Employee } from '../models/employees.model.js'; 

/**
 * Pre-queries the Employee collection to get a list of assignee GitHub IDs
 * based on module or team lead filters.
 * @param {object} [filters={}] - The filter criteria.
 * @returns {Promise<number[]|null>} An array of GitHub IDs, or null if no filters were applied.
 * @private
 */
const _getEmployeeFilteredIds = async (filters = {}) => {
  const { module, teamLeadGithubId, includeIndirectReports } = filters;
  if (!module && !teamLeadGithubId) {
      return null; // No employee-specific filters to apply
  }

  const employeeQuery = {};

  if (module && Array.isArray(module) && module.length > 0) {
    employeeQuery.modules = { $all: module };
  }

  // 2. Handle Team Lead filter (with new hierarchical logic)
  if (teamLeadGithubId) {
      let teamMemberIds;
      if (includeIndirectReports === true || includeIndirectReports === 'true') {
          // --- HIERARCHY PATH ---
          // Use the new static method to get the entire reporting chain.
          teamMemberIds = await Employee.getReportingHierarchyIds(teamLeadGithubId);
      } else {
        // --- DIRECT REPORTS PATH ---
        // Find the lead's _id.
        const lead = await Employee.findOne({ githubId: teamLeadGithubId }).select('_id').lean();
        if (lead) {
            // Find direct reports and get their GitHub IDs.
            const directReports = await Employee.find({ reportsTo: lead._id }).select('githubId').lean();
            teamMemberIds = directReports.map(e => e.githubId);
        } else {
            teamMemberIds = []; // Lead not found, so no reports.
        }
      }
      
    // If team members were found, add a condition to the main employeeQuery.
    // This will AND with the module filter if it's also active.
    employeeQuery.githubId = { $in: teamMemberIds.length > 0 ? teamMemberIds : [-1] };
  }

  // 3. Execute the final combined query and return the list of matching GitHub IDs.
  const employees = await Employee.find(employeeQuery).select('githubId').lean();
  return employees.map(e => e.githubId);
};


/**
 * Builds a MongoDB query object from a set of filter parameters.
 * @param {object} [filters={}] - The filter criteria from the request query.
 * @param {object} [options={}] - Options to control the query building logic.
 * @returns {Promise<object>} A MongoDB query object.
 * @private
 */
const _buildIssuesQuery = async (filters = {}, options = {}) => {
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

    if (filters.state && filters.state !== 'all') {
        query.state = filters.state;
    } else if (filters.closedById || query.closedAt) {
        query.state = 'closed';
    } else if (defaultToOpen && filters.state !== 'all') {
        query.state = 'open';
    }
    
    if (query.closedAt) {
        query.closedAt = { ...query.closedAt, $ne: null };
    }
    
    // --- Centralized Assignee ID Filtering Logic ---
    const employeeFilteredIds = await _getEmployeeFilteredIds(filters);
    let explicitAssigneeIds = null;
    if (filters.assignee_ids) {
        explicitAssigneeIds = filters.assignee_ids.split(',').map(id => parseInt(id.trim(), 10));
    }

    let finalAssigneeIds = null;
    if (employeeFilteredIds !== null && explicitAssigneeIds !== null) {
        const setA = new Set(employeeFilteredIds);
        const setB = new Set(explicitAssigneeIds);
        finalAssigneeIds = [...setA].filter(id => setB.has(id));
    } else if (employeeFilteredIds !== null) {
        finalAssigneeIds = employeeFilteredIds;
    } else if (explicitAssigneeIds !== null) {
        finalAssigneeIds = explicitAssigneeIds;
    }

    if (finalAssigneeIds !== null) {
        // Use the final list of IDs to filter assignees
        query['assignees.id'] = { $in: finalAssigneeIds.length > 0 ? finalAssigneeIds : [-1] };
    }
    // --- End of Centralized Logic ---

    if (filters.pull_request !== undefined) {
        query.pull_request = filters.pull_request === 'true';
    }
    if (filters.user) query['user.login'] = filters.user;
    if (filters.createdById) query['user.id'] = parseInt(filters.createdById, 10);
    // The 'assignees' filter (for login names) is correctly handled here
    if (filters.assignees) query['assignees.login'] = { $in: filters.assignees.split(',') };
    if (filters.labels) query.labels = { $all: filters.labels.split(',').map(label => new RegExp(label.trim(), 'i')) };
    if (filters.issueType) query.issueType = filters.issueType;

    // DELETED: This line is redundant as its logic is now part of the centralized block above.
    // if (filters.assignee_ids) query['assignees.id'] = { ... }; 

    return query;
};

/**
 * Service object encapsulating all complex issue-related business logic.
 */
export const issueService = {
   async getSummaryStats(filters = {}) {
    const query = await _buildIssuesQuery(filters, { defaultToOpen: false });
    
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
        $project: { _id: 0, totalIssues: 1, openIssues: 1, closedIssues: 1 }
      }
    ];

    const result = await Issue.aggregate(pipeline);
    return result[0] || { totalIssues: 0, openIssues: 0, closedIssues: 0 };
  },

  async getAssigneeStats(filters = {}, sortOptions = {}, pagination = {}) {
    const { page = 1, limit = 15 } = pagination;
    const skip = (page - 1) * limit;

    const query = await _buildIssuesQuery(filters, { defaultToOpen: false });
     // --- ADDED START: Create the Post-Unwind Filter ---
    // This is the key to the solution. We create a second filter to be
    // applied AFTER the unwind stage to remove co-assigned members who
    // are not part of the original filter criteria.
    const postUnwindFilter = {};
    if (query['assignees.id']) {
        // If the main query was filtering by assignee IDs (from any source:
        // team lead, module, or direct IDs), we reuse that same filter logic here.
        postUnwindFilter['assignees.id'] = query['assignees.id'];
    }
    // --- ADDED END ---

    const validSortFields = {
        openIssues: 'openIssues',
        closedIssues: 'closedIssues',
        totalIssues: 'totalIssues',
        name: 'employee.name'
    };
    const sortBy = validSortFields[sortOptions.sortBy] || 'totalIssues';
    const sortOrder = sortOptions.order === 'asc' ? 1 : -1;

    const baseAggregationStages = [
      { $match: query },
      { $unwind: "$assignees" },
      // DELETED: The corresponding $match stage for assigneePostFilters is also removed.
      // --- ADDED START: The Accuracy Filter ---
      // Stage 3: Apply the post-unwind filter. This crucial step removes the
      // leaked assignees, ensuring only members of the filtered group remain.
      // This is added conditionally ONLY if an assignee filter was active.
      ...(Object.keys(postUnwindFilter).length > 0 ? [{ $match: postUnwindFilter }] : []),
      // --- ADDED END ---

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

    const countPipeline = [ ...baseAggregationStages, { $count: "totalCount" } ];
    const dataPipeline = [ ...baseAggregationStages, { $skip: skip }, { $limit: limit } ];

    try {
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

  async findIssues(filters = {}, pagination = {}) {
    const { page = 1, limit = 15 } = pagination;
    const skip = (page - 1) * limit;
    const { sortBy = 'updatedAt', order = 'desc' } = filters;

    // Correctly awaiting the async query builder function
    const query = await _buildIssuesQuery(filters);
    
    const validSortFields = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',  
      closedAt: 'closedAt',    
      title: 'title',          
      number: 'number',        
      state: 'state'           
    };

    const sortField = validSortFields[sortBy] || 'updatedAt';
    const sortDirection = order === 'asc' ? 1 : -1;

    const [totalCount, issues] = await Promise.all([
      Issue.countDocuments(query),
      Issue.find(query)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit)
    ]);
    const totalPages = Math.ceil(totalCount / limit);
    
    // Note: Assuming 'isStale', 'ageInDays', and 'resolutionTimeInDays' are virtuals on your Issue model
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