import { Router } from "express";
import passport from "./passport.js";
import path from "path";
import fs from "fs";
import { isAuthenticated, validateGithubUser } from "../middleware/auth.js";

const router = Router();

// Helper function to render HTML template with variables
const renderTemplate = (templatePath, variables = {}) => {
  let content = fs.readFileSync(templatePath, 'utf8');
  
  // Simple template variable replacement
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    
    // Handle nested objects
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
};

// Login page route
router.get("/login", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/auth/status');
  }
  
  const templatePath = path.join(process.cwd(), 'views', 'login.html');
  const renderedHtml = renderTemplate(templatePath);
  res.send(renderedHtml);
});

// Authentication status page
router.get("/status", isAuthenticated, (req, res) => {
  const templatePath = path.join(process.cwd(), 'views', 'authenticated.html');
  const renderedHtml = renderTemplate(templatePath, {
    user: req.user
  });
  res.send(renderedHtml);
});

// Start GitHub OAuth login
router.get("/github", passport.authenticate("github"));

// Handle GitHub callback
router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/auth/login" }),
  (req, res) => {
    // Get allowlist of GitHub IDs from environment variable
    const allowedGitHubIds = process.env.ALLOWED_GITHUB_IDS 
      ? process.env.ALLOWED_GITHUB_IDS.split(',') 
      : [];
    
    // If we have an allowlist and the user is not on it, log them out
    if (allowedGitHubIds.length > 0 && !allowedGitHubIds.includes(req.user.id)) {
      req.logout(() => {
        const templatePath = path.join(process.cwd(), 'views', 'unauthorized.html');
        const renderedHtml = renderTemplate(templatePath, {
          message: "Your GitHub account is not authorized to use this application."
        });
        res.send(renderedHtml);
      });
      return;
    }
    
    // Successful authentication
    res.redirect("/auth/status");
  }
);

// Logout route
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/auth/login");
  });
});

// Check current user session (for API use)
router.get("/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

// Auth check endpoint for frontend to verify authentication
router.get("/check", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ 
      authenticated: true, 
      user: {
        id: req.user.id,
        username: req.user.username,
        displayName: req.user.displayName || req.user.username
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Auth verification URL - redirects to login if not authenticated
// Frontend can use this to verify auth status
router.get("/verify", (req, res) => {
  if (req.isAuthenticated()) {
    // User is authenticated, redirect to the frontend app
    res.redirect(process.env.FRONTEND_URL || "http://localhost:5173");
  } else {
    // User is not authenticated, redirect to login
    res.redirect("/auth/login");
  }
});

router.get('/switch', (req, res) => {
    // Destroy the session
    req.logout(() => {
      req.session.destroy(() => {
        // Redirect to GitHub's logout (not officially supported, but this works)
        // Then send them back to your OAuth login route
        res.redirect(
          'https://github.com/logout?return_to=' +
          encodeURIComponent('https://github.com/login?return_to=' + encodeURIComponent('http://localhost:5100/auth/github'))
        );
      });
    });
  });

export default router;