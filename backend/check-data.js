import mongoose from "mongoose";
import { Employee } from "./models/employees.model.js";

// A helper function to print results neatly
function printSection(title) {
    console.log(`\n\n==================== ${title.toUpperCase()} ====================\n`);
}

async function main() {
    console.log('--- Starting Data Verification Script ---');
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/github-dashboard';
    if (MONGO_URI === 'your_mongodb_connection_string') {
        console.error("❌ ERROR: Please configure your MONGO_URI.");
        return;
    }
    
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Database connected.');

        // --- VERIFICATION 1: CHECK MODULE OWNERS ---
        printSection("All Module Owners");
        const moduleOwners = await Employee.find({ isModuleOwner: true }).select('name modules');
        if (moduleOwners.length > 0) {
            console.table(moduleOwners.map(o => ({ Name: o.name, Modules: o.modules.join(', ') })));
        } else {
            console.log('No module owners found.');
        }

        // --- VERIFICATION 2: CHECK TEAM LEADS (THIS IS NOW SAFE) ---
        printSection("All Team Leads and Their Team Size");
        const teamLeads = await Employee.find({ isTeamLead: true }).select('name modules').lean();
        const teamLeadReport = [];
        for (const lead of teamLeads) {
            const reportCount = await Employee.countDocuments({ reportsTo: lead._id });
            teamLeadReport.push({
                "Team Lead": lead.name,
                "Overseen Modules": lead.modules.length,
                "Direct Reports": reportCount,
            });
        }
        if (teamLeadReport.length > 0) {
            console.table(teamLeadReport);
        } else {
            console.log('No team leads found.');
        }

        // --- VERIFICATION 3: DRILL-DOWN ON A SPECIFIC MANAGER ---
        const leadNameToInspect = 'Yogesh Gharat';
        printSection(`Org Chart Drill-Down for: ${leadNameToInspect}`);
        try {
            const furquanChart = await Employee.getOrgChart(leadNameToInspect);
            // Print a summary instead of the raw object
            console.log(`EMPLOYEE: ${furquanChart.employee.name}`);
            console.log(` - Is Module Owner: ${furquanChart.employee.isModuleOwner}`);
            console.log(` - Is Team Lead: ${furquanChart.employee.isTeamLead}`);
            console.log(` - Modules: ${furquanChart.employee.modules.join(', ')}`);
            console.log(`MANAGER: ${furquanChart.manager?.name || 'None'}`);
            console.log(`DIRECT REPORTS (${furquanChart.directReports.length}):`);
            furquanChart.directReports.forEach(r => console.log(`  - ${r.name}`));
        } catch(e) { console.error(`Could not get org chart for ${leadNameToInspect}: ${e.message}`); }

    } catch (error) {
        console.error('\n❌ An error occurred during verification:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDatabase disconnected.');
    }
}

main();