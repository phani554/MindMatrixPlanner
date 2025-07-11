import { checkTokenValidity } from '../controller/getOctokit.js'; 
import { logger } from '../utils/syncUtility.js';

/**
 * Middleware to check for a valid token before proceeding to the controller.
 */
export const validateToken = async (req, res, next) => {
    logger.info('Performing token validity check...');

    try {
        const tokenStatus = await checkTokenValidity();

        if (!tokenStatus.success) {
            // If the token is not valid, send a 401 Unauthorized response
            logger.warn(`Token validation failed: ${tokenStatus.message}`);
            return res.status(401).json({
                success: false,
                message: `Authentication failed: ${tokenStatus.message}`
            });
        }

        // If the token is valid, attach the expiration date to the response locals
        // so it can be accessed in the next controller.
        res.locals.tokenExpirationDate = tokenStatus.expiration_date;
        logger.info(`Token is valid. Expiration: ${tokenStatus.expiration_date}`);

        // Proceed to the next function in the chain (the main controller)
        next();

    } catch (error) {
        logger.error('Error during token validation:', error);
        return res.status(500).json({
            success: false,
            message: 'An internal error occurred during token validation.'
        });
    }
};