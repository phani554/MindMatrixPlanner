import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import fs from "fs";
import dotenv from "dotenv";
import { log } from "console";

dotenv.config();

const getOctokit =  () => {
    //   const auth = createAppAuth({
    //     appId: APP_ID,
    //     privateKey,
    //     installationId: INSTALLATION_ID,
    //   });
    
    //   const installationAuthentication = await auth({ type: "installation" });
    
      return new Octokit({
        // auth: installationAuthentication.token,
        auth: process.env.SENSITIVE_TOKEN,
      });
};

export default getOctokit;