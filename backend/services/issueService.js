import { Issue } from '../models/issue.model.js'; // Adjust the path as needed

/**
 * Builds a MongoDB query object from a set of filter parameters.
 * This internal function is used by other service methods to ensure consistent filtering.
 * @param {object} [filters={}] - The filter criteria from the request query.
 * @returns {object} A MongoDB query object.
 * @private
 */
const _buildIssuesQuery = (filters = {}) => {
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

    if (filters.closedById) {
        query['closedBy.id'] = parseInt(filters.closedById, 10);
        query.state = 'closed';
    }

    if (query.closedAt) {
        query.state = 'closed';
        query.closedAt = { ...query.closedAt, $ne: null };
    } else if (filters.state && filters.state !== 'all') {
        query.state = filters.state;
    } else if (!query.state) {
        // Default to 'open' if no state was specified or inferred.
        query.state = 'open';
    }

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
  /**
   * Aggregates issue data to provide statistics for each assignee, with filtering and sorting.
   * @param {object} [filters={}] - An object containing filter criteria (see findIssues).
   * @param {object} [sortOptions={}] - An object for sorting the results.
   * @param {string} [sortOptions.sortBy='totalIssues'] - Field to sort by: 'openIssues', 'closedIssues', 'totalIssues', 'name'.
   * @param {string} [sortOptions.order='desc'] - Sort order: 'asc' or 'desc'.
   * @returns {Promise<Array>} A promise that resolves to an array of employee stats.
   */
  async getAssigneeStats(filters = {}, sortOptions = {}) {
    const query = _buildIssuesQuery(filters);

    // Define the valid sort fields and their corresponding paths in the aggregation.
    const validSortFields = {
        openIssues: 'openIssues',
        closedIssues: 'closedIssues',
        totalIssues: 'totalIssues',
        name: 'employee.name'
    };

    const sortBy = validSortFields[sortOptions.sortBy] || 'totalIssues';
    const sortOrder = sortOptions.order === 'asc' ? 1 : -1;

    const pipeline = [
      // Stage 1: Filter issues based on the provided criteria FIRST.
      { $match: query },
      // Stage 2: Unwind assignees to process them individually.
      { $unwind: "$assignees" },
      // Stage 3: Group by assignee and count open/closed issues.
      {
        $group: {
          _id: { id: "$assignees.id", login: "$assignees.login" },
          openCount: { $sum: { $cond: [{ $eq: ["$state", "open"] }, 1, 0] } },
          closedCount: { $sum: { $cond: [{ $eq: ["$state", "closed"] }, 1, 0] } }
        }
      },
      // Stage 4: Join with the employees collection.
      {
        $lookup: {
          from: "employees",
          localField: "_id.id",
          foreignField: "githubId",
          as: "employeeInfo"
        }
      },
      { $unwind: { path: "$employeeInfo", preserveNullAndEmptyArrays: true } },
      // Stage 5: Reshape the output document.
      {
        $project: {
          _id: 0,
          employee: {
            githubId: "$_id.id",
            login: "$_id.login",
            name: { $ifNull: ["$employeeInfo.name", "$_id.login"] }
          },
          openIssues: "$openCount",
          closedIssues: "$closedCount",
          totalIssues: { $add: ["$openCount", "$closedCount"] }
        }
      },
      // Stage 6: Apply dynamic sorting.
      { $sort: { [sortBy]: sortOrder } }
    ];

    return Issue.aggregate(pipeline);
  },

  /**
   * Finds issues based on a flexible set of criteria and returns calculated stats.
   * @param {object} [filters={}] - The filter criteria from the request query.
   * @returns {Promise<object>} A promise resolving to an object with counts, stats, and the list of issues.
   */
  async findIssues(filters = {}) {
    // Re-use the private query builder to get the query object.
    const query = _buildIssuesQuery(filters);

    // Now proceed with the rest of the logic as before.
    const issues = await Issue.find(query).sort({ updatedAt: -1 });

    const totalCount = issues.length;
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
        totalCount,
        staleCount,
        ...(averageAgeInDays !== undefined && { averageAgeInDays }),
        ...(averageResolutionTimeInDays !== undefined && { averageResolutionTimeInDays }),
        countsByStateAndLabel,
        issues,
    };
  }
};