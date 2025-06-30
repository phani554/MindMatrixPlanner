import passport from "passport";
import { Strategy as GitHubStrategy} from "passport-github2";
import dotenv from "dotenv";

dotenv.config();

// Serialize user info into the session
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || "http://localhost:5100"}/auth/github/callback`,
      scope: ["user:email", "read:org"],
    },
    (accessToken, _refreshToken, profile, done) => {
      const user = {
        id: profile.id,
        username: profile.username,
        displayName: profile.displayName || profile.username,
        emails: profile.emails,
        photos: profile.photos,
        accessToken,
      };
      
      // Log authentication details for debugging
      console.log(`Authentication successful for GitHub user: ${user.username} (ID: ${user.id})`);
      
      done(null, user);
    }
  )
);

export default passport;