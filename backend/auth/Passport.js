import passport from "passport";
import { Strategy as GitHubStrategy} from "passport-github2";
import dotenv from "dotenv";
import fs from "fs";
import {Employee} from '../models/employees.model.js';
import { envpath } from "../config.js";

dotenv.config({ path: envpath });

/**
 * Called on every authenticated request.
 * Takes the user ID from the session and retrieves the full user object from the database.
 * The result is attached to req.user.
 */
passport.serializeUser((employee, done) => {
  done(null, employee.id); // 'employee.id' is the MongoDB document _id
});

passport.deserializeUser(async (id, done) => {
  try {
    const employee = await Employee.findById(id);
    done(null, employee); // Attaches the full employee object to req.user
  } catch (err) {
    done(err, null);
  }
});

/**
 * Called only once during the login process.
 * Determines what data to store in the session. We only store the employee's unique MongoDB _id.
 */



passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || "http://localhost:5100"}/auth/github/callback`,
      scope: ["user:email", "read:org"],
    },
    /**
     * This function is the core of the authentication check.
     * It's called after a user successfully authenticates with GitHub.
     */
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        // 1. Check if an employee with this GitHub ID already exists in your database
        const githubIdAsNumber = Number(profile.id);

        const existingEmployee = await Employee.findOne({ githubId: githubIdAsNumber });

        if (existingEmployee) {
          // 2. If they exist, authentication is successful.
          // Let's check if their details need updating.
          let hasChanges = false;

          // Check if the name from GitHub is different from the one in our database.
          if (profile.displayName && existingEmployee.name !== profile.displayName) {
            existingEmployee.name = profile.displayName;
            hasChanges = true;
          }

          // Check for an email from GitHub. It's an array, so we'll take the first one.
          const githubEmail = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          if (githubEmail && existingEmployee.email !== githubEmail) {
            existingEmployee.email = githubEmail;
            hasChanges = true;
          }

          // If there were any changes, save the employee document.
          if (hasChanges) {
            await existingEmployee.save();
            console.log(`Updated details for employee: ${existingEmployee.name}`);
          }

          console.log(`Authenticated existing employee: ${existingEmployee.name}`);
          return done(null, existingEmployee);

        } else {
          // 3. If they DO NOT exist, they are not an authorized user. Deny access.
          console.log(`Login failed: User with GitHub ID ${profile.id} (${profile.username}) is not a registered employee.`);
          return done(null, false, { message: "You are not an authorized employee." });
        }
      } catch (err) {
        console.error("Error during GitHub strategy execution:", err);
        return done(err, false);
      }
    }
  )
);

export default passport;