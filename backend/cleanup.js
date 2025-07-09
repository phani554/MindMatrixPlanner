import mongoose from "mongoose";
import { Employee } from "./models/employees.model.js";

async function findAndLogDuplicates() {
  

    try {
        const mongoURI =  'mongodb://localhost:27017/github-dashboard';

        console.log("Connecting to the database to find duplicates...");
        await mongoose.connect(mongoURI);
        console.log("Database connected successfully.\n");

        // The Aggregation Pipeline to find duplicates
        const pipeline = [
            // Stage 1: Filter out documents where githubId is null, as we only care about actual ID duplicates.
            {
                $match: {
                    githubId: { $ne: null }
                }
            },
            // Stage 2: Group documents by githubId and count them.
            {
                $group: {
                    _id: "$githubId", // Group by the githubId field
                    count: { $sum: 1 }, // Count how many documents are in each group
                    documents: { $push: { _id: "$_id", name: "$name", username: "$username", role: "$role" } } // Collect the details of each document
                }
            },
            // Stage 3: Filter for groups where the count is greater than 1 (i.e., duplicates).
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ];

        const duplicates = await Employee.aggregate(pipeline);

        if (duplicates.length === 0) {
            console.log("✅ No employees with duplicate githubIds found. Your data looks clean in this regard.");
        } else {
            console.log(`🔥 Found ${duplicates.length} githubId(s) with duplicate records. Details below:\n`);
            
            duplicates.forEach(dupGroup => {
                console.log(`--- Duplicate Found for githubId: ${dupGroup._id} (${dupGroup.count} records) ---`);
                dupGroup.documents.forEach(doc => {
                    console.log(`  - _id: ${doc._id}, Name: "${doc.name}", Username: "${doc.username}", Role: "${doc.role}"`);
                });
                console.log('---');
            });
        }

    } catch (error) {
        console.error("An error occurred during the analysis:", error);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            console.log("\nDatabase connection closed.");
        }
    }
}

// Run the analysis
findAndLogDuplicates();