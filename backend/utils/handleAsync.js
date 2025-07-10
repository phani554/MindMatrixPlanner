/**
 * A higher-order function to wrap async route handlers.
 * It catches errors and passes them to the next middleware in the Express chain.
 * This prevents the server from crashing due to unhandled promise rejections.
 *
 * @param {Function} fn The async function to be executed (your controller logic).
 * @returns {Function} An Express middleware function with error handling.
 */
export const handleAsync = (fn) => {
    return (req, res, next) => {
      // Make sure to catch any errors and pass them along to the next()
      // middleware in the Express pipeline
      Promise.resolve(fn(req, res, next)).catch(next);
    };
};