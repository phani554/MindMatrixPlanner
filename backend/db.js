import { log } from "console";
import { db } from "./db/dbConnect.js";
import { Issue } from "./models/issue.model.js";
import {SyncConfig} from "./models/syncConfig.model.js";
import mongoose from "mongoose";


async function removeField() {
    await db.DBconnect('mongodb://localhost:27017/github-dashboard')
    // let connection = mongoose.connection;
    // await mongoose.connect(MONGODB_URI);
    const syncConfig = new SyncConfig({
        lastUpdatedAt: new Date(),
        totalIssuesLog: 14434,
        totalPrMerged: 2910,
        totalIssueClosed: 11997,
        totalPr: 3923
    });
    await syncConfig.save();

    await mongoose.disconnect();
}
  
removeField().catch(console.error);