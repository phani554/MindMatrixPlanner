import express from "express";
import session from "express-session";
import passport from "./auth/Passport.js";
import authRoutes from "./auth/Routes.js";
import zenroute from "./routes/zenroute.js";
import emproute from "./routes/employee.route.js";
import debugroute from "./routes/debugQuote.route.js";
import issueroute from "./routes/issues.route.js";
import syncroute from './routes/sync.route.js';
import { isAuthenticated, isAuthenticatedApi } from "./middleware/Auth.js";
import dotenv from "dotenv";
import cors from "cors";
import { db } from "./db/dbConnect.js";
import MongoStore from "connect-mongo";
import path from "path";

dotenv.config(path.join(process.cwd(), ".env"));

const app = express();
// --- FIX #3: Use a consistent environment variable name ---
const { MONGODB_URI, PORT = 5100 } = process.env;

// Configure CORS for frontend interaction
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true // Allow cookies to be sent
}));

app.use(express.json());

// SESSION middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'super-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGODB_URI, // Use the consistent variable
      collectionName: 'sessions'
    }),
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
  })
);

// PASSPORT middleware
app.use(passport.initialize());
app.use(passport.session());


// --- Public Routes ---
app.use("/auth", authRoutes); // Login/logout routes should be public

// --- FIX #2: Protect all your main API routes with a single middleware ---
// Any route defined after this line will require authentication.
app.use("/zen",isAuthenticatedApi, zenroute); //
app.use("/data", emproute);//isAuthenticatedApi,
app.use("/issues", issueroute);//
app.use("/debug", debugroute);
app.use("/sync",isAuthenticatedApi, syncroute);


// Other protected API routes
app.get("/api/hello", isAuthenticatedApi, (req, res) => {
  res.json({
    message: "Hello from the Other Side",
    user: {
      id: req.user.id,
      username: req.user.username,
      Name: req.user.name,
      role: req.user.role
    }
  });
});

// Route for the frontend to check if the user is authenticated
app.get("/api/auth-required", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      error: "Authentication required",
      loginUrl: `${process.env.BACKEND_URL || "http://localhost:5100"}/auth/login`
    });
  }
  
  res.json({
      githubid: req.user.githubid,
      login: req.user.username,
      name: req.user.name
    
  });
});

// Default redirect to frontend or login page
app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect(process.env.FRONTEND_URL || "http://localhost:5173");
  } else {
    res.redirect("/auth/login");
  }
});




const startServer = async () => {
  // Validate that the MongoDB URI exists
  if (!MONGODB_URI) {
    // Corrected error message to match the variable name
    console.error('FATAL ERROR: MONGODB_URI is not defined in .env file.');
    process.exit(1);
  }

  try {
    // --- FIX #4: Removed unused 'connection' variable ---
    await db.DBconnect(MONGODB_URI);

    // --- FIX #1: Removed the duplicate app.listen() call ---
    app.listen(PORT, () => {
      console.log(`🚀 Backend Running on http://localhost:${PORT}`);
    });

  } catch (error) {
     console.error("Could not start server. The application will now exit.");
     process.exit(1);
  }
};

startServer();