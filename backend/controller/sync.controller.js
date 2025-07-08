import { runSync } from '../services/githubSyncService.js';
import { syncTeamMembers } from '../services/githubEmployeeFetchService.js';
import { logger } from '../utils/syncUtility.js';

/**
 * Controller to trigger the GitHub issue synchronization.
 * Responds to an API request.
 */
export const triggerSync = async function(req, res) {
  // Destructure the request body to separate sync options from the new metadata.
  // The '...syncOptions' rest parameter will collect properties like 'fullSync', 'since', etc.
  const { triggeredBy, triggeredAt, ...syncOptions } = req.body;

  try {
    // Log the metadata for auditing and debugging.
    // Use default values in case the metadata is not provided in the request.
    logger.info(`Received request to trigger issue synchronization by user: '${triggeredBy || 'Unknown'}' at ${triggeredAt || 'N/A'}.`);
    logger.info('Sync options received:', syncOptions);
    
    // Pass ONLY the relevant sync options down to the service layer.
    // The service layer does not need to know who triggered the sync.
    const issuesSynced = await runSync(syncOptions);

    res.status(200).json({
      success: true,
      message: 'Synchronization completed successfully.',
      issueCount: issuesSynced[0],
      expiration_date: issuesSynced[1]
    });
  } catch (error) {
    // The error is already logged with details by the service layer.
    // We now use the descriptive message from the error for the API response.
    res.status(500).json({
      success: false,
      message: error.message || 'An unknown error occurred during synchronization.',
    });
  }
};

export const handleTeamSyncRequest = async (req, res, next) => {
  // teamSlug will be undefined if the route without the parameter is hit
  const { teamSlug } = req.params;
  const options = {};

  // Only add teamSlug to options if it was actually provided in the URL
  if (teamSlug) {
      options.teamSlug = teamSlug;
      logger.info(`Received specific API sync request for team: '${teamSlug}'.`);
  } else {
      logger.info(`Received API request for default sync (developers, testers).`);
  }

  try {
      // Pass the options object to the service. It will be {} for the default case.
      const syncResult = await syncTeamMembers(options);

      res.status(200).json({
          message: `Sync successful.`,
          ...syncResult, // Spreads { syncedTeams: [...], totalSyncedEmployees: ... }
      });

  } catch (error) {
      // Pass any errors to the global error handler
      logger.error(`API controller caught an error during sync. Passing to error handler.`);
      next(error);
  }
};