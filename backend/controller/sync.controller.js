import { runSync } from '../services/githubSyncService.js';
import { logger } from '../utils/syncUtility.js';

/**
 * Controller to trigger the GitHub issue synchronization.
 * Responds to an API request.
 */
export async function triggerSync(req, res) {
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
      issueCount: issuesSynced,
    });
  } catch (error) {
    // The error is already logged with details by the service layer.
    // We now use the descriptive message from the error for the API response.
    res.status(500).json({
      success: false,
      message: error.message || 'An unknown error occurred during synchronization.',
    });
  }
}