import { Issue } from "../models/issue.model.js";
import { SyncConfig } from "../models/syncConfig.model.js";
import { octokit as gitclient } from "../controller/getOctokit.js";
import { 
  ORG,
  REPO,
  logger,
  syncUtility

} from "../utils/syncUtility.js";

const formatDate = syncUtility.formatDate;
const mapIssueToDocument = syncUtility.mapIssueToDocument;
const mapSyncConfig = syncUtility.mapSyncConfig;

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

async function _getIncrementalSyncDate() {
    // Using await here makes the async nature explicit and satisfies linters.
    const latestSync = await SyncConfig.findOne().sort({ lastUpdatedAt: -1 }).select('lastUpdatedAt');
    
    if (latestSync && latestSync.lastUpdatedAt) {
        const sinceDate = new Date(latestSync.lastUpdatedAt.getTime() - 60 * 60 * 1000);
        logger.info(`Incremental sync: Fetching issues updated since ${formatDate(sinceDate)}`);
        return sinceDate;
    }
    
    logger.info("No existing sync config found. Performing full sync.");
    return null;
}

export async function runSync(options = {}) {
  const {
    batchSize = 100,
    state = "all",
    labels = null,
    syncLimit = 100000,
    fullSync = false
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

    await mapSyncConfig();
    logger.info(`🎉 Synced ${issueCount} issues in ${batchCount} batches.`);
    return issueCount;

  } catch (error) {
    let descriptiveError;

    if (error && error.status) {
      switch (error.status) {
        case 401:
          descriptiveError = new Error('GitHub API Authentication Failed (401). The Personal Access Token (PAT) is likely invalid, expired, or has been revoked. Please generate a new token.');
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