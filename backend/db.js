import mongoose from "mongoose";
import { db } from "./db/dbConnect.js";
import { Employee } from "./models/employees.model.js";

async function setReportsTo() {
    try {
        // 1. Connect to the database
        await db.DBconnect('mongodb://localhost:27017/github-dashboard');
        console.log("Database connected successfully.");

        // 2. Find the employee who will be the manager to get their ObjectId
        const manager = await Employee.findOne({ githubId: 6465652 }).select('_id');

        if (!manager) {
            console.error("Error: Could not find the manager with githubId: 6465652. Aborting update.");
            await mongoose.disconnect();
            return;
        }

        const managerObjectId = manager._id;
        console.log(`Found manager's ObjectId: ${managerObjectId}`);

        // 3. Perform the update using the found ObjectId
        const updateResult = await Employee.updateMany(
            { 
               "githubId": { "$ne": 6465652 }, // Filter: not the manager
               "reportsTo": null              // Filter: reportsTo is currently null
            },
            { 
               // Action: Set the reportsTo field to the manager's actual _id
               "$set": { "reportsTo": managerObjectId } 
            }
        );

        console.log("Update operation completed.");
        console.log(`Documents matched: ${updateResult.matchedCount}`);
        console.log(`Documents modified: ${updateResult.modifiedCount}`);

    } catch (error) {
        console.error("An error occurred during the migration:", error);
    } finally {
        // 4. Disconnect from the database
        await mongoose.disconnect();
        console.log("Database disconnected.");
    }
}
  
setReportsTo();