import dotenv from "dotenv";
import { Issue } from "../models/issue.model.js";
import { SyncConfig } from "../models/syncConfig.model.js";

dotenv.config({ path: "MindMatrixPlanner/backend/.env" });
export const {ORG,REPO,MONGODB_URI, LOG_LEVEL = "info"} = process.env;

// Configure logging based on LOG_LEVEL
export const logger = {
    error: (...args) => console.error(...args),
    warn: (...args) => ["warn", "info", "debug"].includes(LOG_LEVEL) && console.warn(...args),
    info: (...args) => ["info", "debug"].includes(LOG_LEVEL) && console.log(...args),
    debug: (...args) => LOG_LEVEL === "debug" && console.log(...args)
};

export const syncUtility = {
    /**
     * Helper function to format dates for logging
     * @param {string|Date} isoString - ISO date string or Date object
     * @returns {string|null} Formatted date string or null
    */
    formatDate: function(isoString) {
        if (!isoString) return null;
        const dateObj = isoString instanceof Date ? isoString : new Date(isoString);
        
        if (isNaN(dateObj.getTime())) return null;
        
        return dateObj.toISOString()
        .replace('T', ' ')
        .replace(/\.\d+Z$/, '');
    }, 
    
    /**
     * Maps a GitHub issue to our MongoDB document structure
     * @param {Object} issue - GitHub issue object
     * @returns {Object} Document ready for MongoDB
    */
    mapIssueToDocument: function (issue) {
        const isPullRequest = !!(
        issue.pull_request || 
        issue.draft !== undefined || 
        (issue.html_url && issue.html_url.includes('/pull/'))
        );
        const subIssuesInfo = issue.sub_issues_summary || null;
        const hasSubIssuesFlag = !!(subIssuesInfo && subIssuesInfo.total > 0);
    
        return {
        githubId: issue.id,
        number: issue.number,
        title: issue.title,
        state: issue.state,
        createdAt: issue.created_at ? new Date(issue.created_at) : null,
        updatedAt: issue.updated_at ? new Date(issue.updated_at) : null,
        closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
        user: issue.user ? {
            login: issue.user.login,
            id: issue.user.id,
            name: null,
            // name: issue.user.name || null
        } : null,
        assignees: Array.isArray(issue.assignees)
            ? issue.assignees.map(a => ({
                login: a.login,
                id: a.id,
                name: null
                // name: a.name || null
            }))
            : [],
        labels: Array.isArray(issue.labels)
            ? issue.labels.map(l => typeof l === "string" ? l : l.name)
            : [],
        closedBy: issue.closed_by
            ? [{
                login: issue.closed_by.login,
                id: issue.closed_by.id,
                name: issue.closed_by.name || null
            }]
            : [],
        issueType: issue.type && issue.type.name ? issue.type.name : null,
        hasSubIssues: !!issue.sub_issues_summary,// !! converts any value to a boolean
        htmlUrl: issue.html_url,
        pull_request: isPullRequest,
        merged_at: isPullRequest && issue.pull_request && issue.pull_request.merged_at ? new Date(issue.pull_request.merged_at) : null,
    
        // lastSynced: new Date()
        };
    },
    
    mapSyncConfig: async ({ employeeStats, issueStats }) => {
        try {
          const update = {
            employeeSync: {
              lastUpdatedAt:   new Date(),
              updated:         employeeStats.updated,
              inserted:        employeeStats.inserted,
              deleted:         employeeStats.deleted,
              deletionsSkipped:employeeStats.deletionsSkipped
            },
            issueSync: {
              lastUpdatedAt:    new Date(),
              totalIssuesLog:   issueStats.totalIssuesLog,
              totalPr:          issueStats.totalPr,
              totalPrMerged:    issueStats.totalPrMerged,
              totalIssueClosed: issueStats.totalIssueClosed
            }
          };
      
          const result = await SyncConfig.findOneAndUpdate(
            {},
            { $set: update },
            { upsert: true, new: true }
          );
      
          logger.info("✅ SyncConfig updated for full sync.");
          return result;
      
        } catch (error) {
          logger.error("❌ Error updating SyncConfig:", error);
          throw error;
        }
    },
    
    /**
     * Log issue details based on current log level
     * @param {Object} issueDoc - Issue document
    */
    logIssueDetails: function (issueDoc) {
        logger.debug(`----- Issue #${issueDoc.number} Details -----`);
        logger.debug(`id: ${issueDoc.githubId}`);
        logger.debug(`Title: ${issueDoc.title}`);
        logger.debug(`Created By: ${issueDoc.user ? issueDoc.user.login : 'N/A'}`);
        logger.debug(`Assignees: ${issueDoc.assignees.map(a => a.login).join(', ') || 'None'}`);
        logger.debug(`Labels: ${issueDoc.labels.join(', ') || 'None'}`);
        logger.debug(`State: ${issueDoc.state}`);
        logger.debug(`Created At: ${formatDate(issueDoc.createdAt)}`);
        logger.debug(`Last Updated At: ${formatDate(issueDoc.updatedAt)}`);
        logger.debug(`Closed At: ${formatDate(issueDoc.closedAt) || 'N/A'}`);
        logger.debug(`Issue Type: ${issueDoc.issueType || 'N/A'}`);
        logger.debug(`Has Sub Issues: ${issueDoc.hasSubIssues}`);
        logger.debug(`HTML url: ${issueDoc.htmlUrl}`);
        logger.debug('---------------------------------');
    },
    /**
     * Generate stats about the issues in the database
     * @returns {Promise<Object>} Stats object
    */
    generateStats: async function () {
        try {
            const [
                totalCount,
                openCount,
                closedCount,
                recentlyUpdated,
                oldestIssue,
                newestIssue,
                prongoing,
                prfailed,
                prs,
                labelCounts,
                assigneeCounts
            ] = await Promise.all([
                Issue.countDocuments(),
                Issue.countDocuments({ state: 'open' }),
                Issue.countDocuments({ state: 'closed' }),
                Issue.countDocuments({ updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
                Issue.findOne().sort({ createdAt: 1 }).select('number createdAt'),
                Issue.findOne().sort({ createdAt: -1 }).select('number createdAt'),
                Issue.countDocuments({ pull_request: true, merged_at: null}),
                Issue.countDocuments({ pull_request: true, merged_at: null, state: 'closed'}),
                Issue.countDocuments({ pull_request: true}),
                Issue.aggregate([
                { $unwind: '$labels' },
                { $group: { _id: '$labels', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 20 }
                ]),
                Issue.aggregate([
                { $unwind: '$assignees' },
                { $group: { _id: '$assignees.login', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 20 }
                ])
            ]);
        
            return {
                totalCount,
                openCount,
                closedCount,
                recentlyUpdated,
                oldestIssue: oldestIssue ? { number: oldestIssue.number, createdAt: formatDate(oldestIssue.createdAt) } : null,
                newestIssue: newestIssue ? { number: newestIssue.number, createdAt: formatDate(newestIssue.createdAt) } : null,
                prfailed,
                prongoing,
                prs,
                topLabels: labelCounts,
                topAssignees: assigneeCounts
            };
        } catch (error) {
        logger.error(`Error generating stats: ${error.message}`);
        throw error;
        }
    },  
};