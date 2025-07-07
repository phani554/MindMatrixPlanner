import { Router } from "express";
import path from "path";
import fs from "fs";
// Import the passport configuration for GitHub OAuth
import passport from "./Passport.js";
import { isAuthenticated } from "../middleware/Auth.js";

const router = Router();

// Define frontend and backend URLs from environment variables for consistency
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5100";

// --- HELPER FUNCTION (Restored) ---

/**
 * Helper function to read an HTML file and replace placeholder variables.
 * This is necessary for serving your login and status pages.
 */
const renderTemplate = (templatePath, variables = {}) => {
  try {
    let content = fs.readFileSync(templatePath, 'utf8');
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      if (typeof variables[key] === 'object' && variables[key] !== null) {
        Object.keys(variables[key]).forEach(nestedKey => {
          const nestedRegex = new RegExp(`{{${key}.${nestedKey}}}`, 'g');
          content = content.replace(nestedRegex, variables[key][nestedKey] || '');
        });
      } else {
        content = content.replace(regex, variables[key] || '');
      }
    });
    return content;
  } catch (error) {
    console.error("Error rendering template:", error);
    return "<p>Sorry, there was an error loading this page.</p>";
  }
};


// --- SERVER-SIDE RENDERED PAGES (Restored and Kept) ---

/**
 * @route   GET /auth/login
 * @desc    Serves the HTML login page. THIS IS THE FIX for your error.
 */
router.get("/login", (req, res) => {
  if (req.isAuthenticated()) {
    // If user is already logged in, send them to the status page.
    return res.redirect('/auth/status');
  }
  const templatePath = path.join(process.cwd(), 'views', 'Login.html');
  const renderedHtml = renderTemplate(templatePath);
  res.send(renderedHtml);
});

/**
 * @route   GET /auth/status
 * @desc    Serves a simple "You are logged in" page for non-SPA flows.
 */
router.get("/status", isAuthenticated, (req, res) => {
  const templatePath = path.join(process.cwd(), 'views', 'Authenticated.html');
  const renderedHtml = renderTemplate(templatePath, {
    user: req.user,
    // Add a link to get to the main frontend app
    frontend_url: FRONTEND_URL 
  });
  res.send(renderedHtml);
});
// --- GitHub OAuth Flow ---

// 1. Start GitHub OAuth login
// No changes needed here, this is standard.
router.get("/github", passport.authenticate("github"));

// 2. Handle GitHub callback
router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: `${BACKEND_URL}/auth/login-failed`, // Redirect to a dedicated failure route
    failureMessage: true,
  }),
  (req, res) => {
    // SUCCESS: User is authenticated and req.user is populated.
    // Redirect to the frontend application's main page or dashboard.
    console.log(`Successfully authenticated user: ${req.user.name} (ID: ${req.user.githubId})`);
    res.redirect(FRONTEND_URL);
  }
);

// --- Session Management API for Frontend ---

/**
 * @route   POST /auth/logout
 * @desc    Logs the user out by destroying the session.
 * @access  Private
 * @improvement   Changed to POST to prevent CSRF. This is a critical security fix.
 */
router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout Error:", err);
      return res.status(500).json({ message: 'Logout failed.' });
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error("Session Destruction Error:", err);
        // Even if session destruction fails, we can still tell the client it's okay.
        // The main goal (logout) was achieved.
      }
      res.clearCookie('connect.sid'); // The default session cookie name
      return res.status(200).json({ message: 'Logged out successfully' });
    });
  });
});

/**
 * @route   GET /auth/me
 * @desc    Get the current authenticated user's session data.
 * @access  Private (implicitly, as it returns 401 if not authenticated)
 * @improvement   Replaces `/user` and `/check` with a single, consistent RESTful endpoint.
 *                This is the ONLY endpoint your frontend needs to check auth status.
 */
router.get("/me", (req, res) => {
  if (req.isAuthenticated()) {
    // Send a consistent user object. Only include fields the frontend needs.
    res.json({
      githubid: req.user.githubId.toString(), // Assuming your model has this
      login: req.user.username,
      name: req.user.name,    
    });
  } else {
    // Use the correct HTTP status code for "unauthorized".
    res.status(401).json({ error: "Not authenticated" });
  }
});


// --- Server-Side Pages (Optional Fallbacks) ---
// These are useful if you want to provide non-JS fallbacks or simple status pages.

// A page to inform the user that their login attempt failed.
router.get("/login-failed", (req, res) => {
  // You can get the failure message from the session if you configured it.
  const errorMessage = req.session.messages ? req.session.messages[0] : "Login failed. Please try again.";
  res.status(401).send(`<h1>Authentication Failed</h1><p>${errorMessage}</p><a href="${FRONTEND_URL}">Try again</a>`);
});

/**
 * @route   GET /auth/switch-account
 * @desc    A clear way for users to switch accounts.
 * @improvement   Replaces the brittle `/switch` redirect chain with a standard logout
 *                that redirects back to the login flow. This is more reliable.
 */
router.get('/switch-account', (req, res) => {
    req.logout((err) => {
        if (err) { console.error(err); }
        req.session.destroy(() => {
            // After destroying the session, redirect to the start of the GitHub login flow.
            res.redirect('/auth/github');
        });
    });
});


export default router;