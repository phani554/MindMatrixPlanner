import { Issue } from "../models/issue.model.js";
import { SyncConfig } from "../models/syncConfig.model.js";
import { octokit as gitclient } from "../controller/getOctokit.js";
import { checkTokenValidity } from "../controller/getOctokit.js";
import { 
  ORG,
  REPO,
  logger,
  syncUtility

} from "../utils/syncUtility.js";



const formatDate = syncUtility.formatDate;
const mapIssueToDocument = syncUtility.mapIssueToDocument;

async function _processIssueBatch(batch) {
  try {
    const bulkOps = batch.map(issue => ({
      updateOne: {
        filter: { githubId: issue.githubId },
        update: { $set: issue },
        upsert: true
      }
    }));
    await Issue.bulkWrite(bulkOps);
    logger.debug(`Bulk write result: Matched ${bulkOps.length} issues for processing.`);
  } catch (error) {
    logger.error(`Error processing batch: ${error.message}`);
    throw error;
  }
}

// In githubSyncService.js

async function _getIncrementalSyncDate() {
  // CORRECTED: Use dot notation to query the nested field.
  const latestSync = await SyncConfig.findOne()
      .sort({ 'issueSync.lastUpdatedAt': -1 }) // Correct sort key
      .select('issueSync.lastUpdatedAt');      // Correct select key
  
  // CORRECTED: Check the nested path for the date.
  if (latestSync && latestSync.issueSync && latestSync.issueSync.lastUpdatedAt) {
      // Subtract 1 hour to account for any potential clock drift or race conditions
      const sinceDate = new Date(latestSync.issueSync.lastUpdatedAt.getTime() - 60 * 60 * 1000);
      logger.info(`Incremental sync: Fetching issues updated since ${formatDate(sinceDate)}`);
      return sinceDate;
  }
  
  // This part is now correct: it only runs if no valid sync date is found.
  logger.info("No existing sync config found. Performing full sync.");
  return null;
}

export async function runSync(options = {}) {
  const {
    batchSize = 100,
    state = "all",
    labels = null,
    syncLimit = 100000,
    fullSync = false,
    expiration_date
  } = options;

  const octokit = await gitclient.getforPat();
  let issueCount = 0;
  let batchCount = 0;
  let batch = [];

  // --- REFACTORED 'since' LOGIC ---
  let since = null; // Default to null for a full sync

  if (options.since) {
      // Priority 1: Use the date passed directly in the options.
      logger.info(`Sync triggered with a specific 'since' date: ${options.since}`);
      since = options.since;
  } else if (!fullSync) {
      // Priority 2: If no date is passed and it's not a forced full sync, try for incremental.
      since = await _getIncrementalSyncDate();
  }
  // Priority 3 (Default): If options.since is not provided and fullSync is true, 'since' remains null.

  const requestParams = {
    owner: ORG,
    repo: REPO,
    state,
    per_page: batchSize,
    ...(since && { since: since instanceof Date ? since.toISOString() : since }),
    ...(labels && { labels: Array.isArray(labels) ? labels.join(',') : labels }),
  };

  logger.info(`📁 Fetching issues from ${ORG}/${REPO} with params:`, { state, since: requestParams.since, labels });

  try {
    for await (const page of octokit.paginate.iterator(octokit.rest.issues.listForRepo, requestParams)) {
      if (issueCount >= syncLimit) break;
      const expiration_date = new Date(page.headers['github-authentication-token-expiration']).toUTCString();

      
      for (const issue of page.data) {
        if (issueCount >= syncLimit) break;

        batch.push(mapIssueToDocument(issue));
        issueCount++;

        if (batch.length >= batchSize) {
          await _processIssueBatch(batch);
          batchCount++;
          logger.info(`✅ Processed batch #${batchCount} (${batch.length} issues)`);
          batch = [];
        }
      }
    }

    if (batch.length > 0) {
      await _processIssueBatch(batch);
      batchCount++;
      logger.info(`✅ Processed final batch #${batchCount} (${batch.length} issues)`);
    }

    // await mapSyncConfig();
    logger.info(`🎉 Synced ${issueCount} issues in ${batchCount} batches.`);
    const totalIssuesLog   = await Issue.countDocuments();
    const totalPr          = await Issue.countDocuments({ pull_request: true });
    const totalPrMerged    = await Issue.countDocuments({
      pull_request: true,
      merged_at:     { $exists: true, $nin: ["", null] }
    });
    const totalIssueClosed = await Issue.countDocuments({ state: "closed" });
    // const result = [issueCount, expiration_date];
    return {
      issueCount,            // number you were already returning
      expiration_date,
      totalIssuesLog,
      totalPr,
      totalPrMerged,
      totalIssueClosed
    };

  } catch (error) {
    let descriptiveError;

    if (error && error.status) {
      switch (error.status) {
        case 401:
          const expiration_date = new Date(parseInt(error.headers['github-authentication-token-expiration']));
          descriptiveError = new Error(`GitHub API Authentication Failed (401). The Personal Access Token (PAT) is likely invalid, expired, or has been revoked. Current Github Token Expires on ${expiration_date}`);
          break;
        case 403:
          if (error.headers && error.headers['x-ratelimit-remaining'] === '0') {
            const resetTime = new Date(parseInt(error.headers['x-ratelimit-reset']) * 1000);
            descriptiveError = new Error(`RATE LIMIT EXCEEDED (403). The API limit has been reached. The limit will reset at ${resetTime.toISOString()}.`);
          } else {
            descriptiveError = new Error('GitHub API Permission Denied (403). The PAT is valid but lacks the required scopes (e.g., `repo` access) for this repository.');
          }
          break;
        default:
          descriptiveError = new Error(`An unexpected GitHub API error occurred. Status: ${error.status}, Message: ${error.message}`);
      }
    } else {
      descriptiveError = new Error(`An unexpected error occurred during the sync process: ${error.message}`);
    }
    
    logger.error(`❌ ${descriptiveError.message}`);
    throw descriptiveError;
  }
}

export async function getLastSyncStatus() {
  try {
    // Step 1: Fetch the single configuration document. Since there's only one,
    // a simple findOne() is all that's needed.
    const syncConfig = await SyncConfig.findOne();

    if (!syncConfig) {
      // This case handles when the collection is empty.
      return { message: "Sync has not been run yet.", timestamp: null };
    }

    // Step 2: Safely access the nested lastUpdatedAt dates.
    const employeeSyncDate = syncConfig.employeeSync?.lastUpdatedAt;
    const issueSyncDate = syncConfig.issueSync?.lastUpdatedAt;

    // Step 3: Intelligently determine the most recent sync date.
    let mostRecentDate = null;
    if (employeeSyncDate && issueSyncDate) {
      // If both dates exist, pick the later one.
      mostRecentDate = employeeSyncDate > issueSyncDate ? employeeSyncDate : issueSyncDate;
    } else {
      // Otherwise, use whichever one is not null.
      mostRecentDate = employeeSyncDate || issueSyncDate;
    }

    // Step 4: Handle the case where the sync has run but no dates were recorded.
    if (!mostRecentDate) {
      return { message: "Sync has been configured, but a successful date is not recorded.", timestamp: null };
    }

    // Step 5: Format the user-friendly message based on the most recent date.
    // This part contains the fix for the toISOString/toLocaleString error.
    let lastSyncedDateMessage = "";
    const lastSyncedDate = new Date(mostRecentDate);
    const today = new Date();

    const isToday = lastSyncedDate.getFullYear() === today.getFullYear() &&
                    lastSyncedDate.getMonth() === today.getMonth() &&
                    lastSyncedDate.getDate() === today.getDate();

    if (isToday) {
      // Correctly use toLocaleTimeString for today's date.
      const lastSyncedTime = lastSyncedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      lastSyncedDateMessage = `Last synced today at ${lastSyncedTime}`;
    } else {
      // Use a clear date format for previous days.
      const lastSyncedFormattedDate = lastSyncedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      lastSyncedDateMessage = `Last synced on ${lastSyncedFormattedDate}`;
    }

    // Step 6: Return a consistent and useful payload for the API.
    return {
      message: lastSyncedDateMessage,
      timestamp: mostRecentDate.toISOString(), // Provide the raw ISO timestamp for the frontend
    };

  } catch (error) {
    logger.error(`❌ Error fetching last sync status: ${error.message}`);
    // Return a structured error response
    return {
      message: "An error occurred while retrieving sync status.",
      timestamp: null,
      error: error.message,
    };
  }
}