import { getLastSyncStatus, runSync } from '../services/githubSyncService.js';
import { syncTeamMembers } from '../services/githubEmployeeFetchService.js';
import { logger } from '../utils/syncUtility.js';
import { syncUtility } from '../utils/syncUtility.js';
import { broadcastSyncComplete, broadcastSyncError } from '../utils/eventutil.js'; // Assuming you might add an error broadcast
import { handleAsync } from '../utils/handleAsync.js';


const mapSyncConfig = syncUtility.mapSyncConfig;

// --- Advanced Consideration: Prevent concurrent syncs ---
// This is a simple in-memory lock. For a multi-server environment,
// you would need a distributed lock (e.g., using Redis).
let isSyncing = false;

/**
 * The long-running background task.
 * This function is NOT an Express handler; it's a self-contained service function.
 * It's designed to be called without being awaited ("fire-and-forget").
 *
 * @param {object} syncOptions - The options for the sync, taken from the original request body.
 */
const performBackgroundSync = async (syncOptions) => {
    // Destructure all the options needed for the sync
    const {
        triggeredBy,
        teamSlug,
        fullSync,
        since,
        labels,
        batchSize,
        syncLimit,
        state
    } = syncOptions;

    // Set the lock
    isSyncing = true;
    logger.info('Background sync process started.');

    try {
        // 2️⃣ Prepare and invoke employee sync
        const teamOptions = teamSlug ? { teamSlug } : {};
        logger.info('↳ Syncing team members with options:', teamOptions);
        const empReport = await syncTeamMembers(teamOptions);
        const employeeStats = {
            updated: empReport.stats.updated,
            inserted: empReport.stats.inserted,
            deleted: empReport.stats.deleted,
            deletionsSkipped: empReport.stats.deletionsSkipped
        };

        // 3️⃣ Prepare and invoke issue sync
        const issueOptions = { fullSync, since, labels, batchSize, syncLimit, state };
        // Clean up undefined properties so they don't override defaults
        Object.keys(issueOptions).forEach(key => issueOptions[key] === undefined && delete issueOptions[key]);
        logger.info('↳ Syncing issues with options:', issueOptions);
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
            message: `🎉 Sync triggered by ${triggeredBy} completed.`,
            employeeStats,
            issueStats,
            expiration_date
        };

        // 5️⃣ Broadcast the SUCCESS result to all SSE clients
        logger.info('✅ Sync complete. Broadcasting success payload.');
        broadcastSyncComplete(payload);

    } catch (error) {
        logger.error('❌ Background sync process failed:', error);
        
        // Optional but recommended: Broadcast an error event to the frontend
        // This allows the UI to show a failure state.
        const errorPayload = {
            message: `Sync failed: ${error.message || 'An unknown error occurred.'}`
        };
        // You would need to create this broadcastSyncError function and a listener on the frontend.
        broadcastSyncError(errorPayload);

    } finally {
        // 6️⃣ Release the lock regardless of success or failure
        isSyncing = false;
        logger.info('Background sync process finished.');
    }
};


/*
 * The Express.js route handler.
 * Its only job is to validate the request, trigger the background task,
 * and respond immediately.
 * This function now expects to run AFTER the validateToken middleware.
*/

export const triggerFullSync = (req, res, next) => {
    if (isSyncing) {
        logger.warn('Sync request rejected: another sync is already in progress.');
        return res.status(409).json({
            success: false,
            message: "A synchronization process is already running. Please try again later."
        });
    }

    const { triggeredBy, triggeredAt, ...syncOptions } = req.body;
    const effectiveTriggeredBy = triggeredBy || 'Unknown';
    const effectiveTriggeredAt = triggeredAt || new Date().toISOString();

    logger.info(`🚀 Sync request received from '${effectiveTriggeredBy}' at ${effectiveTriggeredAt}. Triggering background process.`);

    performBackgroundSync({
        ...syncOptions,
        triggeredBy: effectiveTriggeredBy
    });

    // Access the expiration_date passed from the validateToken middleware
    const { tokenExpirationDate } = res.locals;

    // Immediately respond with 202 Accepted and include the expiration date.
    return res.status(202).json({
        success: true,
        message: "Sync process initiated. You will be notified via SSE upon completion.",
        expiration_date: tokenExpirationDate // Include the expiration date here
    });
};

/**
 * Gets the status of the last sync.
 * This function also expects to run AFTER the validateToken middleware.
 */
export const getStatus = handleAsync(async (req, res) => {
    const status = await getLastSyncStatus();
    if (!status) {
        return res.status(404).json({ status: 'fail', message: 'Sync status has not been recorded yet.' });
    }

    // You can also include the token expiration here if desired for frontend updates
    const { tokenExpirationDate } = res.locals;

    res.status(200).json({
        status: 'success',
        data: {
            ...status,
            expiration_date: tokenExpirationDate // Optionally add to status payload
        },
    });
});