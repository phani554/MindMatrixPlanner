import { Employee } from "../models/employees.model.js";
import { octokit as gitclient } from "../controller/getOctokit.js";
import { ORG, logger } from "../utils/syncUtility.js";
import mongoose from "mongoose";

/**
 * [NEW] Centralizes the mapping from a GitHub team slug to a DB role enum.
 * @param {string} teamSlug - The slug from GitHub (e.g., 'developers').
 * @returns {string} The corresponding role for the DB (e.g., 'developer').
 */
function mapTeamSlugToRole(teamSlug) {
    switch (teamSlug.toLowerCase()) {
        case 'developers':
            return 'developer';
        case 'testers':
            return 'tester';
        case 'admins': // Example for future expansion
            return 'admin';
        default:
            logger.warn(`Unknown team slug '${teamSlug}' received. Defaulting role to slug name.`);
            return teamSlug;
    }
}

/**
 * Maps a GitHub member object to our MongoDB document structure.
 * @param {Object} member - GitHub member object.
 * @param {string} role - The standardized role (e.g., 'developer').
 * @param {string|null} displayName - The member's public display name.
 * @returns {Object} Document ready for MongoDB.
 */
function mapEmployeeToDocument(member, role, displayName) {
    const employeeDoc = {
        githubId: member.id,
        username: member.login,
        role: role,
    };
    if (displayName) {
        employeeDoc.name = displayName;
    }
    return employeeDoc;
}


/**
 * Fetches the display name for a given GitHub username.
 * Handles errors gracefully.
 * @param {Octokit} octokit - The authenticated Octokit client.
 * @param {string} username - The GitHub login/username.
 * @returns {Promise<string|null>} The display name or null.
 */
async function _getDisplayName(octokit, username) {
    try {
        const { data: user } = await octokit.rest.users.getByUsername({ username });
        return user.name || null;
    } catch (error) {
        logger.warn(`Could not fetch display name for '${username}' (Error: ${error.status || 'N/A'}). Will proceed without it.`);
        return null; // Return null to not block the sync
    }
}

/**
* [HELPER FUNCTION] Performs the sync for a single team and returns a detailed report.
* @param {string} teamSlug - The slug of the team to sync.
* @param {Octokit} octokit - The authenticated Octokit client.
* @returns {Promise<Object>} A detailed report object for the team's sync.
*/
async function _syncSingleTeam(teamSlug, octokit) {
   const role = mapTeamSlugToRole(teamSlug);
   logger.info(`-- Starting sync for team: '${teamSlug}' (Role: '${role}') --`);

   // Initialize a report object to gather all actions and logs
   const report = {
       updated: [],
       inserted: [],
       deleted: [],
       skippedDeletions: [],
       unenriched: [],
       logs: []
   };

   const existingEmployees = await Employee.find({ role: role });
   const existingGithubIds = new Set(existingEmployees.map(emp => emp.githubId).filter(id => id != null));

   const incomingGithubIds = new Set();
   const requestParams = { org: ORG, team_slug: teamSlug, per_page: 100 };

   for await (const page of octokit.paginate.iterator(octokit.rest.teams.listMembersInOrg, requestParams)) {
       for (const member of page.data) {
           incomingGithubIds.add(member.id);

           try {
               const apiDisplayName = await _getDisplayName(octokit, member.login);
               let existingDoc = await Employee.findOne({ githubId: member.id });
               if (!existingDoc) existingDoc = await Employee.findOne({ username: member.login });
               if (!existingDoc && apiDisplayName) existingDoc = await Employee.findOne({ name: apiDisplayName });

               if (existingDoc) {
                   const updatePayload = { githubId: member.id, username: member.login, role: role };
                   if (apiDisplayName) updatePayload.name = apiDisplayName;
                   await Employee.updateOne({ _id: existingDoc._id }, { $set: updatePayload });
                   report.updated.push(existingDoc.name);
               } else {
                   const finalDisplayName = apiDisplayName || member.login;
                   const employeeDocument = mapEmployeeToDocument(member, role, finalDisplayName);
                   const newEmp = await Employee.create(employeeDocument);
                   report.inserted.push(newEmp.name);
                   report.logs.push({ level: 'info', message: `Created new employee record for username: '${member.login}'` });
               }
           } catch (err) {
               const errorMessage = `Could not process '${member.login}'. Error: ${err.message}`;
               report.logs.push({ level: 'error', message: errorMessage });
           }
       }
   }

   // [NEW] Identify and report unenriched employees
   const unenrichedDocs = await Employee.find({ role: role, githubId: null });
   if (unenrichedDocs.length > 0) {
       report.unenriched = unenrichedDocs.map(emp => ({ name: emp.name, _id: emp._id }));
   }

   // [NEW] Safe deletion logic that reports sensitive skips
   const idsToDelete = [...existingGithubIds].filter(id => !incomingGithubIds.has(id));
   if (idsToDelete.length > 0) {
       const employeesToDelete = await Employee.find({ githubId: { $in: idsToDelete } });
       const safeToDeleteIds = [];

       for (const emp of employeesToDelete) {
           // Find who reports to this employee using their ObjectId
           const subordinates = await Employee.find({ reportsTo: emp._id }, 'name');
           if (subordinates.length > 0) {
               // This is a sensitive record; add it to the skipped list
               report.skippedDeletions.push({
                   name: emp.name,
                   githubId: emp.githubId,
                   username: emp.username,
                   referencedBy: subordinates.map(sub => sub.name)
               });
           } else {
               safeToDeleteIds.push(emp._id);
               report.deleted.push(emp.name);
           }
       }

       if (safeToDeleteIds.length > 0) {
           await Employee.deleteMany({ _id: { $in: safeToDeleteIds } });
       }
   }

   return report;
}

/**
* Fetches and syncs team members from GitHub, returning a comprehensive report.
* @param {Object} [options={}] - Configuration options.
* @returns {Promise<Object>} The final aggregated report object.
*/
export async function syncTeamMembers(options = {}) {
   const { teamSlug } = options;
   const defaultTeams = ['developers', 'testers'];
   const teamsToSync = teamSlug ? [teamSlug] : defaultTeams;
   logger.info(`🚀 Starting sync for team(s): [${teamsToSync.join(', ')}]`);

   // Initialize the final aggregated report
   const finalReport = {
       updated: [], inserted: [], deleted: [],
       discrepancies: { skippedDeletions: [], unenrichedEmployees: [] },
       logs: []
   };

   try {
       const octokit = await gitclient.getforPat();
       await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/github-dashboard');
       logger.info("Database connected successfully.\n");

       for (const team of teamsToSync) {
           const teamReport = await _syncSingleTeam(team, octokit);
           // Aggregate results from each team into the final report
           finalReport.updated.push(...teamReport.updated);
           finalReport.inserted.push(...teamReport.inserted);
           finalReport.deleted.push(...teamReport.deleted);
           finalReport.discrepancies.skippedDeletions.push(...teamReport.skippedDeletions);
           finalReport.discrepancies.unenrichedEmployees.push(...teamReport.unenriched);
           finalReport.logs.push(...teamReport.logs);
       }

       const totalProcessed = finalReport.updated.length + finalReport.inserted.length;
       logger.info(`🎉 Successfully completed sync. Total employees processed: ${totalProcessed}.`);
       
       const report =  {
           status: 'success',
           stats: {
               teamsSynced: teamsToSync,
               totalProcessed: totalProcessed,
               updated: finalReport.updated.length,
               inserted: finalReport.inserted.length,
               deleted: finalReport.deleted.length,
               deletionsSkipped: finalReport.discrepancies.skippedDeletions.length
           },
           discrepancies: finalReport.discrepancies,
           logs: finalReport.logs
       };
       console.log(report);
       return report;
    } catch (error) {
        let descriptiveError = new Error(`An unexpected error occurred during the employee sync process: ${error.message}`);
        if (error && error.status) {
            switch (error.status) {
                case 401:
                    descriptiveError = new Error('GitHub API Authentication Failed (401). The PAT is likely invalid or expired.');
                    break;
                case 403:
                    descriptiveError = new Error('GitHub API Permission Denied (403). The PAT lacks required scopes (e.g., `read:org`).');
                    break;
                case 404:
                    descriptiveError = new Error(`A team in the sync list was not found in organization '${ORG}' (404). Check if teams [${teamsToSync.join(', ')}] exist.`);
                    break;
                default:
                    descriptiveError = new Error(`GitHub API error. Status: ${error.status}, Message: ${error.message}`);
            }
        }
        logger.error(`❌ ${descriptiveError.message}`);
        return {
            status: 'error',
            message: descriptiveError.message,
            stats: {},
            discrepancies: {},
            logs: finalReport.logs.concat({ level: 'error', message: descriptiveError.message })
        };
    }
    finally{
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            logger.info("\nDatabase connection closed.");    
        }
    }
}
// To run this script directly for testing:
syncTeamMembers();