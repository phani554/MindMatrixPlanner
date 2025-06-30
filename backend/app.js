import express from "express";
import session from "express-session";
import passport from "./auth/Passport.js";
import authRoutes from "./auth/Routes.js";
import zenroute from "./routes/zenroute.js";
import { isAuthenticated, isAuthenticatedApi } from "./middleware/Auth.js";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";

dotenv.config();

const app = express();

// Configure CORS for frontend interaction
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true // Allow cookies to be sent
}));

app.use(express.json());

// SESSION middleware: enables user sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'super-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production', // Set to true if using HTTPS in production
      sameSite: 'lax', // Helps with CSRF protection
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
  })
);

// PASSPORT middleware: handles authentication
app.use(passport.initialize());
app.use(passport.session());

// Create views directory if it doesn't exist
const viewsDir = path.join(process.cwd(), 'views');
if (!fs.existsSync(viewsDir)){
  fs.mkdirSync(viewsDir, { recursive: true });
}

// Auth routes
app.use("/auth", authRoutes);
app.use("/zen", zenroute);

// Protected API routes
app.get("/api/hello", isAuthenticatedApi, (req, res) => {
  res.json({
    message: "Hello from the Other Side",
    user: {
      id: req.user.id,
      username: req.user.username,
      displayName: req.user.displayName
    }
  });
});

// Route to enforce authentication for the frontend
app.get("/api/auth-required", (req, res) => {
  if (!req.isAuthenticated()) {
    // Not authenticated, return a 401 status that the frontend can check
    return res.status(401).json({ 
      error: "Authentication required",
      loginUrl: `${process.env.BACKEND_URL || "http://localhost:5100"}/auth/login`
    });
  }
  
  // User is authenticated, return their info
  res.json({
    authenticated: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      displayName: req.user.displayName || req.user.username
    }
  });
});

// Frontend app protection middleware
app.get("/protect-frontend", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/auth/login");
  }
  res.redirect(process.env.FRONTEND_URL || "http://localhost:5173");
});

// Default redirect to login page
app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect(process.env.FRONTEND_URL || "http://localhost:5173");
  } else {
    res.redirect("/auth/login");
  }
});

const PORT = process.env.PORT || 5100;
app.listen(PORT, () => {
  console.log(`Backend Running on http://localhost:${PORT}`);
});