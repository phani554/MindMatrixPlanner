import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import fs from "fs";
import dotenv from "dotenv";
import { ORG } from "../utils/syncUtility.js";


dotenv.config({ path: "C:/Users/phane/Documents/Projects/Web Development/MindMatrixPlanner/backend/.env" });

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

async function getGithubDisplayName(githubUrl) {
  try {
    // Extract the username from the URL
    const urlParts = githubUrl.split('/');
    const username = urlParts[urlParts.length - 1]; // Assuming username is the last part

    // Construct the API endpoint URL
    const apiUrl = `https://api.github.com/users/${username}`;

    // Make a GET request to the API
    const response = await fetch(apiUrl);

    // Check for errors
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse the JSON response
    const userData = await response.json();

    // Get the display name
    const displayName = userData.name;
    console.log(displayName);

    return displayName;

  } catch (error) {
    return githubUrl
;
  }
}

const octokitclient = await octokit.getforPat();

const response = await octokitclient.rest.teams.listMembersInOrg({
  org: ORG,
  team_slug: 'testers',
  per_page: 100
});
export const expiration_date = new Date(response.headers['github-authentication-token-expiration']).toUTCString();
// const developer_member_list = [];
// for (const member of response.data) {
//   developer_member_list.push(`username: ${member.login}, githubId: ${member.id}, html_url: ${await getGithubDisplayName(member.html_url)}`);
// }
// console.log(developer_member_list);
// console.log(developer_member_list.length);
export {octokit};