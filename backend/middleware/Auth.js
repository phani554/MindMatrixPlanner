// Authentication middleware

/**
 * Middleware to check if a user is authenticated
 * Use on protected routes
 */
 export const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    // Redirect to login page if not authenticated
    res.redirect('/auth/login');
  };
  
  /**
   * Middleware to validate if authenticated user matches a specific GitHub ID
   * Use on routes that need specific GitHub user validation
   */
  export const validateGithubUser = (allowedGithubIds) => {
    return (req, res, next) => {
      // First check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.redirect('/auth/login');
      }
  
      // Check if user's GitHub ID is in the allowedGithubIds array
      const userGithubId = req.user.id;
      
      if (Array.isArray(allowedGithubIds)) {
        // If we're checking against multiple allowed IDs
        if (allowedGithubIds.includes(userGithubId)) {
          return next();
        }
      } else {
        // If we're checking against a single ID
        if (userGithubId === allowedGithubIds) {
          return next();
        }
      }
  
      // User is authenticated but not authorized
      return res.status(403).render('unauthorized', {
        message: "You don't have permission to access this resource."
      });
    };
  };
  
  /**
   * API middleware to check authentication status
   * Returns 401 instead of redirecting (for API routes)
   */
  export const isAuthenticatedApi = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ error: "Not authenticated" });
  };