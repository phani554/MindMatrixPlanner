import { runSync } from '../services/githubSyncService.js';
import { syncTeamMembers } from '../services/githubEmployeeFetchService.js';
import { logger } from '../utils/syncUtility.js';
import { syncUtility } from '../utils/syncUtility.js';
import { broadcastSyncComplete } from '../routes/sync.route.js';

const mapSyncConfig = syncUtility.mapSyncConfig;


export const triggerFullSync = async (req, res, next) => {
  // 1️⃣ Destructure any frontend-metadata + optional sync options
  const {
    triggeredBy,
    triggeredAt,

    // Employee‑sync option:
    teamSlug,

    // Issue‑sync options:
    fullSync,
    since,
    labels,
    batchSize,
    syncLimit,
    state
  } = req.body;

  logger.info(`🚀 Full sync requested by '${triggeredBy || 'Unknown'}' at ${triggeredAt || new Date().toISOString()}`);

  try {
    // 2️⃣ Prepare and invoke employee sync
    const teamOptions = {};
    if (teamSlug) {
      teamOptions.teamSlug = teamSlug;
      logger.info(`↳ Will sync only team: '${teamSlug}'`);
    } else {
      logger.info(`↳ Will sync default teams`);
    }
    const empReport = await syncTeamMembers(teamOptions);
    const employeeStats = {
      updated:          empReport.stats.updated,
      inserted:         empReport.stats.inserted,
      deleted:          empReport.stats.deleted,
      deletionsSkipped: empReport.stats.deletionsSkipped
    };

    // 3️⃣ Prepare and invoke issue sync
    const issueOptions = {};
    if (fullSync === true) issueOptions.fullSync = fullSync;
    if (since)            issueOptions.since    = since;
    if (labels)           issueOptions.labels   = labels;
    if (batchSize)        issueOptions.batchSize= batchSize;
    if (syncLimit)        issueOptions.syncLimit= syncLimit;
    if (state)            issueOptions.state    = state;

    logger.info('↳ Issue sync options:', issueOptions);
    const {
      issueCount,
      expiration_date,
      totalIssuesLog,
      totalPr,
      totalPrMerged,
      totalIssueClosed
    } = await runSync(issueOptions);

    const issueStats = { totalIssuesLog, totalPr, totalPrMerged, totalIssueClosed };

    // 4️⃣ Persist both sets of stats in SyncConfig
    await mapSyncConfig({ employeeStats, issueStats });

    const payload = {
      employeeStats,
      issueStats,
      expiration_date
    };

    // ① Broadcast to all SSE clients
    broadcastSyncComplete(payload);

    // ② Then respond to the HTTP request too
    return res.status(200).json({
      success: true,
      message: "🎉 Full synchronization completed successfully.",
      ...payload,
      logs: empReport.logs
    });

  } catch (error) {
    logger.error('❌ Full sync failed:', error);
    return next(error);
  }
};