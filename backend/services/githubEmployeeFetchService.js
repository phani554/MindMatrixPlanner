import { Employee } from "../models/employees.model.js";
import { octokit as gitclient } from "../controller/getOctokit.js";
import { ORG, logger } from "../utils/syncUtility.js";

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

  const report = {
    updated: [], inserted: [], deleted: [],
    skippedDeletions: [], unenriched: [], logs: []
  };

  const existingEmps = await Employee.find({ role });
  const existingGithubIds = new Set(existingEmps.map(e => e.githubId).filter(Boolean));
  const incomingGithubIds = new Set();

  const params = { org: ORG, team_slug: teamSlug, per_page: 100 };
  for await (const page of octokit.paginate.iterator(octokit.rest.teams.listMembersInOrg, params)) {
    for (const member of page.data) {
      incomingGithubIds.add(member.id);
      const apiDisplayName = await _getDisplayName(octokit, member.login);

      let existingDoc =
        await Employee.findOne({ githubId: member.id }) ||
        await Employee.findOne({ username: member.login }) ||
        (apiDisplayName && apiDisplayName.trim().split(' ').length === 2
          ? await Employee.findOne({ name: apiDisplayName })
          : null);

      const newName = (apiDisplayName?.trim().split(' ').length === 2)
        ? apiDisplayName
        : member.login;

      if (existingDoc) {
        // ✅ Only update if fields actually differ
        const payload = {
          githubId: member.id,
          username: member.login,
          role
        };
        if (apiDisplayName?.trim().split(' ').length === 2) {
          payload.name = apiDisplayName;
        }

        const needsUpdate = Object.entries(payload).some(
          ([key, value]) => existingDoc[key] !== value
        );

        if (needsUpdate) {
          await Employee.updateOne({ _id: existingDoc._id }, { $set: payload });
          if (!report.updated.includes(existingDoc.name)) {
            report.updated.push(existingDoc.name);
          }
          report.logs.push({
            level: 'info',
            message: `Updated employee: '${existingDoc.username}'`
          });
        }

      } else {
        const doc = mapEmployeeToDocument(member, role, newName);
        const created = await Employee.create(doc);
        report.inserted.push(created.name);
        report.logs.push({
          level: 'info',
          message: `Created new employee record for username: '${member.login}'`
        });
      }
    }
  }

  // 🔥 Safe deletion logic
  const toDeleteIds = [...existingGithubIds].filter(id => !incomingGithubIds.has(id));
  if (toDeleteIds.length) {
    const candidates = await Employee.find({ githubId: { $in: toDeleteIds } });

    const safeDelete = [];
    for (const emp of candidates) {
      const subs = await Employee.find({ reportsTo: emp._id }, 'name');
      if (subs.length) {
        const warning = `⚠️ Skipped deletion of '${emp.name}' — still referenced by [${subs.map(s => s.name).join(', ')}]`;
        console.warn(warning);
        report.skippedDeletions.push({
          name: emp.name,
          githubId: emp.githubId,
          username: emp.username,
          referencedBy: subs.map(s => s.name)
        });
        report.logs.push({ level: 'warn', message: warning });
      } else {
        safeDelete.push(emp._id);
        report.deleted.push(emp.name);
        report.logs.push({ level: 'info', message: `Deleted employee: '${emp.name}'` });
      }
    }

    if (safeDelete.length) {
      await Employee.deleteMany({ _id: { $in: safeDelete } });
      console.log(`🗑 Deleted employees: ${report.deleted.join(', ')}`);
    }
  }

  // 🧹 Unenriched employees
  const unenriched = await Employee.find({ role, githubId: null }, 'name');
  report.unenriched = unenriched.map(e => e.name);
  if (unenriched.length) {
    report.logs.push({
      level: 'warn',
      message: `Found ${unenriched.length} unenriched employees.`
    });
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

}
// To run this script directly for testing:
