import { Employee } from "../models/employees.model.js";
import { octokit as gitclient } from "../controller/getOctokit.js";
import { ORG, logger } from "../utils/syncUtility.js";

/**
 * Maps a GitHub team member object to our MongoDB document structure.
 * @param {Object} member - GitHub member object from the teams.listMembersInOrg call.
 * @param {string} teamSlug - The slug of the team the member belongs to.
 * @param {string|null} displayName - The member's public display name.
 * @returns {Object} Document ready for MongoDB.
 */
function mapEmployeeToDocument(member, teamSlug, displayName) {
    return {
        githubId: member.id,
        username: member.login,
        name: displayName,
        role: teamSlug,
    };
}

/**
 * Fetches the display name for a given GitHub username.
 * @param {Octokit} octokit - The authenticated Octokit client.
 * @param {string} username - The GitHub login/username.
 * @returns {Promise<string|null>} The display name or null if not found/errored.
 */
async function _getDisplayName(octokit, username) {
    try {
        const { data: user } = await octokit.rest.users.getByUsername({ username });
        console.log(user);
        return user.name || null;
    } catch (error) {
        logger.warn(`Could not fetch display name for ${username}. Error: ${error.message}`);
        return null; // Return null to not block the entire sync
    }
}

/**
 * [HELPER FUNCTION] Contains the core logic to sync a single team.
 * @param {string} teamSlug - The slug of the team to sync.
 * @param {Octokit} octokit - The authenticated Octokit client.
 * @returns {Promise<number>} The number of employees upserted for this team.
*/
async function _syncSingleTeam(teamSlug, octokit) {
    logger.info(`-- Starting sync for individual team: '${teamSlug}' --`);

    // 1. Fetch current DB state for the team
    const existingEmployees = await Employee.find({ role: teamSlug });
    const existingNameMap = new Map(existingEmployees.map(emp => [emp.username, emp.name]));
    const existingUsernames = new Set(existingEmployees.map(emp => emp.username));

    // 2. Fetch members and perform upserts
    const incomingUsernames = new Set();
    let upsertedCount = 0;
    const requestParams = { org: ORG, team_slug: teamSlug, per_page: 100 };

    for await (const page of octokit.paginate.iterator(octokit.rest.teams.listMembersInOrg, requestParams)) {
        for (const member of page.data) {
            incomingUsernames.add(member.login);

            // Step A: Determine the final, correct display name using your existing logic
            let finalDisplayName = await _getDisplayName(octokit, member.login);
            if ((!finalDisplayName || finalDisplayName.trim() === "") && existingNameMap.has(member.login)) {
                finalDisplayName = existingNameMap.get(member.login);
                logger.info(`Using existing DB name '${finalDisplayName}' for GitHub user '${member.login}'.`);
            }

            // Step B: Use your utility function to create the document payload
            const employeeDocument = mapEmployeeToDocument(member, teamSlug, finalDisplayName);

            // Step C: Sanitize the document. This is CRUCIAL. If a name couldn't be found,
            // we remove the 'name' key to prevent $set from overwriting an existing name with null.
            if (!employeeDocument.name) {
                delete employeeDocument.name;
            }

            // Step D: Build the flexible filter to find the employee by ID or by name
            const filterConditions = [{ githubId: member.id }];
            // Only add the name to the filter if we actually found a valid one.
            if (finalDisplayName) {
                filterConditions.push({ name: finalDisplayName });
            }
            const filter = { $or: filterConditions };

            // Step E: Execute the upsert operation with the cleaned document
            await Employee.findOneAndUpdate(
                filter,
                { $set: employeeDocument }, // $set uses our cleaned document
                { upsert: true, runValidators: true, new: true }
            );
            upsertedCount++;
        }
    }
    logger.info(`Successfully upserted ${upsertedCount} members for team '${teamSlug}'.`);

    // 3. Identify and delete stale records (Remains unchanged)
    const usernamesToDelete = [...existingUsernames].filter(username => !incomingUsernames.has(username));
    if (usernamesToDelete.length > 0) {
        logger.info(`Removing ${usernamesToDelete.length} stale records for team '${teamSlug}'.`);
        const deleteResult = await Employee.deleteMany({ role: teamSlug, username: { $in: usernamesToDelete } });
        logger.info(`Deleted ${deleteResult.deletedCount} stale records for team '${teamSlug}'.`);
    }
    return upsertedCount;
}


/**
 * Fetches and syncs team members from GitHub.
 * If a teamSlug is provided, syncs only that team.
 * If no teamSlug is provided, syncs a default list of teams (developers, testers).
 * @param {Object} [options={}] - Configuration options for the sync.
 * @param {string} [options.teamSlug] - The slug of a specific team to sync.
*/
export async function syncTeamMembers(options = {}) {
    const { teamSlug } = options;

    // Define the list of teams to be processed
    const defaultTeams = ['developers', 'testers'];
    const teamsToSync = teamSlug ? [teamSlug] : defaultTeams;

    logger.info(`🚀 Starting sync for team(s): [${teamsToSync.join(', ')}]`);

    const octokit = await gitclient.getforPat();
    let totalSyncedCount = 0;

    try {
        // Loop through the list of teams and sync each one
        for (const team of teamsToSync) {
            const countForTeam = await _syncSingleTeam(team, octokit);
            totalSyncedCount += countForTeam;
        }

        logger.info(`🎉 Successfully completed sync for all specified teams. Total employees synced: ${totalSyncedCount}.`);
        return {
            syncedTeams: teamsToSync,
            totalSyncedEmployees: totalSyncedCount,
        };

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
                    // Make the error message more specific
                    descriptiveError = new Error(`A team in the sync list was not found in organization '${ORG}' (404). Check if teams [${teamsToSync.join(', ')}] exist.`);
                    break;
                default:
                    descriptiveError = new Error(`GitHub API error. Status: ${error.status}, Message: ${error.message}`);
            }
        }
        logger.error(`❌ ${descriptiveError.message}`);
        throw descriptiveError;
    }
}

