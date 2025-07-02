import mongoose, {Schema} from "mongoose";

const issueSchema = new mongoose.Schema({
    githubId: { type: Number, required: true, unique: true, index: true },
    number: { type: Number, required: true },
    title: { type: String },
    // body: { type: String },
    state: { type: String, index: true },
    createdAt: { type: Date, required: true, index: true },
    updatedAt: { type: Date, required: true, index: true },
    closedAt: { type: Date, index: true },
    user: {
      login: { type: String, required: true, index: true },
      id: { type: Number, required: true },
      name: { 
        type: Schema.Types.ObjectId,
        ref: "Employee",
        default: null  // Set to null initially
      }
    },
    assignees: [{
      login: { type: String, required: true, index: true },
      id: { type: Number, required: true },
      name: { 
        type: Schema.Types.ObjectId,
        ref: "Employee",
        default: null  // Set to null initially
      }
    }],
    labels: [{ type: String, index: true }],
    closedBy: [{
      login: { type: String },
      id: { type: Number },
      name: { 
        type: Schema.Types.ObjectId,
        ref: "Employee",
        default: null  // Set to null initially
      }
    }],
    issueType: { type: String, index: true },
    hasSubIssues: { type: Boolean, default: false },
    htmlUrl: { type: String },
    // parentId: {
    //   type: Schema.Types.ObjectId,
    //   ref: "Issue",
    //   default: null,
    // },
    pull_request: { type: Boolean, default: false },
    // sub_issue: { type: Boolean, default: false },
    merged_at: { type: Date, default: null },
    
    
  });
  
  // Create indexes for better query performance
  issueSchema.index({ number: 1, state: 1 });
  issueSchema.index({ 'user.login': 1, createdAt: -1 });
  
  // ==================== BARE MINIMUM METHODS FOR IMMEDIATE USE ====================
  
  // 1. Find my assigned issues (works with login only)
  issueSchema.statics.findByAssignee = function(login) {
    return this.find({ 'assignees.login': login })
      .sort({ updatedAt: -1 });
  };
  
  // 2. Find issues I created (works with login only)
  issueSchema.statics.findByUser = function(login) {
    return this.find({ 'user.login': login })
      .sort({ createdAt: -1 });
  };
  
  // 3. Find open issues
  issueSchema.statics.findOpenIssues = function() {
    return this.find({ state: 'open' }).sort({ updatedAt: -1 });
  };

    // Macro method to find issues based on the given filter

  /**
 * Finds issues based on a flexible set of criteria.
 * Now intelligently handles the relationship between closed dates and state.
 * @param {object} [filters={}] - The filter criteria from the request query. If not provided, returns all issues.
 * @param {number} [filters.staleDays=30] - The number of days of inactivity to consider an issue stale.
 * @returns {Query} A Mongoose query object.
 */
  issueSchema.statics.findIssues = async function(filters = {}) {
    const query = {};

    // Helper function to build a date range query
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

    // Apply multiple date filters
    const dateFields = {
      createdAt: buildDateQuery(filters.createdStartDate, filters.createdEndDate),
      updatedAt: buildDateQuery(filters.updatedStartDate, filters.updatedEndDate),
      closedAt: buildDateQuery(filters.closedStartDate, filters.closedEndDate),
    };

    for (const field in dateFields) {
      const dateQuery = dateFields[field];
      if (Object.keys(dateQuery).length > 0) {
        query[field] = dateQuery;
      }
    }

    // Enforce state based on other filters, but allow 'all' if no state is specified.
    if (query.closedAt) {
      query.state = 'closed';
      query.closedAt.$ne = null; 
    } else if (filters.state) {
      query.state = filters.state;
    }

    // Filter by 'pull_request' status
    if (filters.pull_request !== undefined) {
      query.pull_request = filters.pull_request === 'true';
    }

    // Filter by the user who created the issue (by login)
    if (filters.user) {
      query['user.login'] = filters.user;
    }

    // Filter by the user who created the issue (by ID)
    if (filters.createdById) {
      query['user.id'] = parseInt(filters.createdById, 10);
    }

    // Filter by one or more assignees using login
    if (filters.assignees) {
      const assigneeList = filters.assignees.split(',');
      query['assignees.login'] = { $in: assigneeList };
    }

    // Filter by one or more assignees using GitHub ID
    if (filters.assignee_ids) {
        const assigneeIdList = filters.assignee_ids.split(',').map(id => parseInt(id.trim(), 10));
        query['assignees.id'] = { $in: assigneeIdList };
    }

    // Filter by the user who closed the issue (by ID)
    if (filters.closedById) {
      query['closedBy.id'] = parseInt(filters.closedById, 10);
      // If filtering by who closed it, the state must be 'closed'.
      query.state = 'closed';
    }

    // Filter by labels
    if (filters.labels) {
      const labelList = filters.labels.split(',');
      const labelRegexList = labelList.map(label => new RegExp(label.trim(), 'i'));
      query.labels = { $all: labelRegexList };
    }

    // Filter by issue type
    if (filters.issueType) {
      query.issueType = filters.issueType;
    }

    // --- DATA FETCHING AND CALCULATION ---

    const issues = await this.find(query).sort({ updatedAt: -1 });
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

    const countsByStateAndLabel = await this.aggregate([
        { $match: query },
        { $unwind: "$labels" },
        {
            $group: {
                _id: { state: "$state", label: "$labels" },
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: "$_id.state",
                labels: { $push: { label: "$_id.label", count: "$count" } },
                stateCount: { $sum: "$count" }
            }
        },
        {
            $project: {
                _id: 0,
                state: "$_id",
                stateCount: "$stateCount",
                labels: "$labels"
            }
        }
    ]);

    // --- RESPONSE ASSEMBLY ---

    // Build the final object in the desired order
    const result = {
        totalCount,
        staleCount,
        ...(averageAgeInDays !== undefined && { averageAgeInDays }),
        ...(averageResolutionTimeInDays !== undefined && { averageResolutionTimeInDays }),
        countsByStateAndLabel,
        issues,
    };

    return result;
  };


  
  // 4. Issue age in days (for prioritization)
  issueSchema.virtual('ageInDays').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
  });
  
  // 5. Resolution time (for performance tracking)
  issueSchema.virtual('resolutionTimeInDays').get(function() {
    if (this.closedAt && this.createdAt) {
      return Math.floor((this.closedAt - this.createdAt) / (1000 * 60 * 60 * 24));
    }
    return null;
  });
  
  // 6. Check if issue is stale
  issueSchema.methods.isStale = function(days = 30) {
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - days);
    return this.updatedAt < staleDate && this.state === 'open';
  };
  
  // Include virtuals in JSON output
  issueSchema.set('toJSON', { virtuals: true });
  
  export const Issue = mongoose.model('Issue', issueSchema);