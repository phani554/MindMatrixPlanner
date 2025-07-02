import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import fs from "fs";
import dotenv from "dotenv";
import mongoose, {Schema} from "mongoose";
import { Issue } from "../models/issue.model.js";
import { exit } from "process";
import { db } from "../db/dbConnect.js";
import { octokit as gitclient } from "../controller/getOctokit.js";
import { SyncConfig } from "../models/syncConfig.model.js";
dotenv.config({ path: "C:/Users/admin/Documents/planner/MindMatrixPlanner/backend/.env" });

const {ORG,REPO,MONGODB_URI, LOG_LEVEL = "info"} = process.env;
// console.log({ ORG, REPO, MONGODB_URI }); // Sanity check

// Configure logging based on LOG_LEVEL
const logger = {
  error: (...args) => console.error(...args),
  warn: (...args) => ["warn", "info", "debug"].includes(LOG_LEVEL) && console.warn(...args),
  info: (...args) => ["info", "debug"].includes(LOG_LEVEL) && console.log(...args),
  debug: (...args) => LOG_LEVEL === "debug" && console.log(...args)
};




/**
 * Helper function to format dates for logging
 * @param {string|Date} isoString - ISO date string or Date object
 * @returns {string|null} Formatted date string or null
 */
function formatDate(isoString) {
  if (!isoString) return null;
  const dateObj = isoString instanceof Date ? isoString : new Date(isoString);
  
  if (isNaN(dateObj.getTime())) return null;
  
  return dateObj.toISOString()
    .replace('T', ' ')
    .replace(/\.\d+Z$/, '');
}

/**
 * Maps a GitHub issue to our MongoDB document structure
 * @param {Object} issue - GitHub issue object
 * @returns {Object} Document ready for MongoDB
 */
function mapIssueToDocument(issue) {
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
}

async function mapSyncConfig() {
  try {
    const data = new SyncConfig( {
      lastUpdatedAt: new Date(),
      totalIssuesLog: await Issue.countDocuments(),
      totalPrMerged: await Issue.countDocuments({pull_request: true, merged_at: { $exists: true, $nin: ["", null] }}),
      totalIssueClosed: await Issue.countDocuments({state: 'closed'}),
      totalPr: await Issue.countDocuments({pull_request: true})
    });
    return await data.save();    
  } catch (error) {
    logger.error("Error updating the Sync Config: ", error);
  }
  
}

/**
 * Log issue details based on current log level
 * @param {Object} issueDoc - Issue document
 */
function logIssueDetails(issueDoc) {
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
}


const sinceDate = '2025-01-01T00:00:00Z';
/**
 * Fetch issues from GitHub and sync them to MongoDB
 * @param {Object} options - Options for fetching issues
 * @returns {Promise<number>} Number of issues synced
 */
async function fetchAndSyncIssues(options = {}) {
  const {
    batchSize = 100,         // Number of issues to process at once
    since = null,           // Only fetch issues updated after this date
    state = "all",          // Issue state (open, closed, all)
    labels = null,          // Filter by labels
    syncLimit = Infinity    // Maximum number of issues to sync
  } = options;

  const octokit = await gitclient.getforPat();
  let issueCount = 0;
  let batchCount = 0;
  let batch = [];

  logger.info(`📁 Fetching issues from ${ORG}/${REPO} with state: ${state}`);
  
  // Prepare the request parameters
  const requestParams = {
    owner: ORG,
    repo: REPO,
    state,
    per_page: 100, // Maximum allowed by GitHub API
  };

  if (since) {
    requestParams.since = since instanceof Date ? since.toISOString() : since;
  }
  
  if (labels) {
    requestParams.labels = Array.isArray(labels) ? labels.join(',') : labels;
  }

  // function mapSubIssueToDocument(issue){
  //   return{
  //     parentId: 
  //   }    
  // }

  try {
    // Use GitHub pagination to process issues in batches
    for await (const page of octokit.paginate.iterator(
      octokit.rest.issues.listForRepo,
      requestParams
    )) {
      for (const issue of page.data) {
        // Skip PRs
        // if (issue.pull_request) continue;
        
        // Stop processing if we've reached the sync limit
        if (issueCount >= syncLimit) {
          logger.info(`🛑 Reached sync limit of ${syncLimit} issues`);
          break;
        }

        const issueDoc = mapIssueToDocument(issue);
        batch.push(issueDoc);
        issueCount++;

        // Debug-level logging for individual issues
        logIssueDetails(issueDoc);

        // Process batch when it reaches the batch size
        if (batch.length >= batchSize) {
          await processIssueBatch(batch);
          batchCount++;
          logger.info(`✅ Processed batch #${batchCount} (${batch.length} issues)`);
          batch = [];
        }
      }
      
      if (issueCount >= syncLimit) break;
    }

    // Process any remaining issues in the last batch
    if (batch.length > 0) {
      await processIssueBatch(batch);
      batchCount++;
      logger.info(`✅ Processed final batch #${batchCount} (${batch.length} issues)`);
    }

    logger.info(`🎉 Synced ${issueCount} issues in ${batchCount} batches`);
    return issueCount;
  } catch (error) {
    logger.error(`Error fetching issues: ${error.message}`);
    if (error.status === 403 && error.headers && error.headers['x-ratelimit-remaining'] === '0') {
      const resetTime = new Date(parseInt(error.headers['x-ratelimit-reset']) * 1000);
      logger.error(`Rate limit exceeded. Resets at ${resetTime.toISOString()}`);
    }
    throw error;
  }
}

/**
 * Process a batch of issues by upserting them to MongoDB
 * @param {Array<Object>} batch - Array of issue documents
 * @returns {Promise<void>}
 */
async function processIssueBatch(batch) {
  try {
    const bulkOps = batch.map(issue => ({
      updateOne: {
        filter: { githubId: issue.githubId },
        update: { $set: issue },
        upsert: true
      }
    }));

    const result = await Issue.bulkWrite(bulkOps);
    logger.debug(`Bulk write result: ${result.matchedCount} matched, ${result.modifiedCount} modified, ${result.upsertedCount} upserted`);
  } catch (error) {
    logger.error(`Error processing batch: ${error.message}`);
    throw error;
  }
}

/**
 * Generate stats about the issues in the database
 * @returns {Promise<Object>} Stats object
 */
async function generateStats() {
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
}

/**
 * Main function that coordinates the sync process
 */
async function main() {
  let exitCode = 0;
  let connection = null;
  
  try {
    // Connect to MongoDB
    await db.DBconnect(MONGODB_URI);
    connection = mongoose.connection;
    
    // Parse command line arguments for options
    const args = process.argv.slice(2);
    const options = {
      batchSize: 100,
      syncLimit: Infinity
    };
    
    // Very basic argument parsing
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--since' && i + 1 < args.length) {
        options.since = new Date(args[i + 1]);
        i++;
      } else if (args[i] === '--state' && i + 1 < args.length) {
        options.state = args[i + 1];
        i++;
      } else if (args[i] === '--limit' && i + 1 < args.length) {
        options.syncLimit = parseInt(args[i + 1], 10);
        i++;
      } else if (args[i] === '--labels' && i + 1 < args.length) {
        options.labels = args[i + 1].split(',');
        i++;
      } else if (args[i] === '--stats-only') {
        options.statsOnly = true;
      }
    }
    
    logger.info(`🚀 Starting GitHub issue synchronization with options:`, options);
    
    // If stats-only flag is set, just show stats and exit
    if (options.statsOnly) {
      const stats = await generateStats();
      logger.info('📊 Database Statistics:');
      console.table({
        'Total Issues': stats.totalCount,
        'Open Issues': stats.openCount,
        'Closed Issues': stats.closedCount,
        'Issues Updated Last Week': stats.recentlyUpdated,
        'Oldest Issue': stats.oldestIssue 
          ? `#${stats.oldestIssue.number} (${stats.oldestIssue.createdAt})` 
          : 'No issues',
        'Newest Issue': stats.newestIssue 
          ? `#${stats.newestIssue.number} (${stats.newestIssue.createdAt})` 
          : 'No issues',
        "Total PR Failed": stats.prfailed,
        "Total PRs": stats.prs,
        "Total PRmerged": stats.prs - stats.prfailed,
        "Total PR ongoing" : stats.prongoing
      });
      
      if (stats.topLabels && stats.topLabels.length > 0) {
        logger.info('Top 10 Labels:');
        console.table(stats.topLabels.map(l => ({ Label: l._id, Count: l.count })));
      }
      
      if (stats.topAssignees && stats.topAssignees.length > 0) {
        logger.info('Top 10 Assignees:');
        console.table(stats.topAssignees.map(a => ({ User: a._id, Count: a.count })));
      }
    } else {
      // Get the timestamp of the most recently updated issue if 'since' is not provided
      if (!options.since) {
        const latestIssue = await SyncConfig.findOne().sort({ lastUpdatedAt: -1 }).select('lastUpdatedAt');
        
        // Check if we have any issues and if updatedAt is valid
        if (latestIssue && latestIssue.lastUpdatedAt) {
          // Subtract 1 hour to ensure we don't miss any issues due to timing or timezone issues
          options.since = new Date(latestIssue.lastUpdatedAt.getTime() - 60 * 60 * 1000);
          logger.info(`Incremental sync: Only fetching issues updated since ${formatDate(options.since)}`);
        } else {
          logger.info("No existing issues found or no valid timestamps. Performing full sync.");
        }
      }
      
      // Run the sync
      const issuesSynced = await fetchAndSyncIssues(options);
      await mapSyncConfig();
      
      // Generate and display stats
      const stats = await generateStats();
      logger.info(`📊 Sync complete! ${issuesSynced} issues synced. Current database has ${stats.totalCount} issues (${stats.openCount} open, ${stats.closedCount} closed)`);
    }
  } catch (error) {
    logger.error(`❌ Synchronization failed:`, error);
    exitCode = 1;
  } finally {
    // Close MongoDB connection gracefully
    if (connection) {
      logger.info('Closing database connection...');
      await connection.close();
      logger.info('Database connection closed');
    }
    
    // Exit with appropriate code
    process.exit(exitCode);
  }
}

// Handle process termination signals
process.on('SIGINT', async () => {
  logger.warn('Process interrupted, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.warn('Process terminated, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the main function
main().catch(error => {
  console.error('Unhandled error in main function:', error);
  process.exit(1);
});