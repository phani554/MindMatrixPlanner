import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import fs from "fs";
import dotenv from "dotenv";


dotenv.config();

const octokit = {

  getforPat : async() => {
    try {
      return new Octokit({
        auth: process.env.SENSITIVE_TOKEN,
        request: {
          timeout: 30000, // 30 seconds timeout for requests
        }
      });
    } catch (error) {
      console.error(`Failed to authenticate with GitHub: ${error.message}`);
      throw error;
    }
  },

  getPrivateKey: () => {
    const {PRIVATE_KEY,PRIVATE_KEY_PATH} = process.env;
    if (PRIVATE_KEY) {
      return PRIVATE_KEY.replace(/\\n/g, '\n');
    } else if (PRIVATE_KEY_PATH) {
      try {
        return fs.readFileSync(PRIVATE_KEY_PATH, "utf8");
      } catch (error) {
        console.error(`Failed to read private key from file: ${error.message}`);
        exit(1);
      }
    } else {
      console.error("❌ No private key provided. Set either PRIVATE_KEY or PRIVATE_KEY_PATH");
      exit(1);
    }
  },

  getforApp: async () => {
    const {APP_ID, INSTALLATION_ID} = process.env;

    try {
      const auth = createAppAuth({
        appId: APP_ID,
        privateKey: getPrivateKey(),
        installationId: INSTALLATION_ID,
      });
  
      const installationAuthentication = await auth({ type: "installation" });
  
      return new Octokit({
        auth: installationAuthentication.token,
        request: {
          timeout: 30000, // 30 seconds timeout for requests
        }
      });
    } catch (error) {
      console.error(`Failed to authenticate with GitHub: ${error.message}`);
      throw error; // Re-throw to be handled by the caller
    }
  },
  

};


export {octokit};