// migrate-legacy-data.js

import mongoose from 'mongoose';
// Adjust the path to your Employee model as needed
import { Employee } from './models/employees.model.js'; 

async function runMigration() {
    console.log('--- Starting One-Time Data Migration for Modules ---');
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/github-dashboard';
    if (MONGO_URI === 'your_mongodb_connection_string') {
        console.error("❌ ERROR: Please configure your MONGO_URI in the script or as an environment variable.");
        return;
    }
    
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Database connected.');

        // Find all documents that still have the old 'module' field (as a string)
        const filter = {
            module: { $exists: true, $type: 'string' }
        };
        const legacyEmployees = await Employee.find(filter);

        if (legacyEmployees.length === 0) {
            console.log('✅ No legacy documents found to migrate. Your data is likely up to date!');
            return;
        }

        console.log(`Found ${legacyEmployees.length} legacy documents to migrate...`);
        let successCount = 0;

        for (const emp of legacyEmployees) {
            const moduleString = emp.module || "";
            const moduleArray = moduleString.split(',').map(m => m.trim()).filter(Boolean); // filter(Boolean) removes empty strings
            
            // Update the document: set the new 'modules' field and UNSET the old 'module' field.
            // isModuleOwner will be set correctly by the main import script later.
            await Employee.updateOne(
                { _id: emp._id },
                {
                    $set: { modules: moduleArray },
                    $unset: { module: "" }
                }
            );
            successCount++;
            console.log(`  -> Migrated: ${emp.name}`);
        }
        
        console.log(`\n--- Migration Complete: ${successCount} documents updated. ---`);

    } catch (error) {
        console.error('\n❌ A critical error occurred during migration:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Database disconnected.');
    }
}

runMigration();