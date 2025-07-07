import { Employee } from '../models/employees.model.js';
import { Issue } from '../models/issue.model.js';

/**
 * Populates the 'name' ObjectId reference in the issues collection.
 * This script is designed for maximum scalability by processing both employees
 * and their corresponding issues in manageable batches.
 * @param {object} [options={}] - Options for the batching process.
 * @param {number} [options.employeeBatchSize=500] - The number of employees to process per batch.
 * @param {number} [options.issueBatchSize=1000] - The number of issues to process per batch.
 * @returns {Promise<object>} A promise that resolves to an object with the total update status.
*/

export const populateIssueEmployeeRefs = async ({ employeeBatchSize = 500, issueBatchSize = 1000 } = {}) => {
    let totalUpdatedCount = 0;
    let employeePage = 0;
    let hasMoreEmployees = true;

    console.log(`Starting employee reference population with employeeBatchSize=${employeeBatchSize}, issueBatchSize=${issueBatchSize}`);

    // Outer Loop: Process Employees in Batches
    while (hasMoreEmployees) {
        const employees = await Employee.find({}, 'githubId')
            .sort({ _id: 1 })
            .skip(employeePage * employeeBatchSize)
            .limit(employeeBatchSize)
            .lean();

        if (employees.length === 0) {
            hasMoreEmployees = false;
            continue;
        }

        console.log(`[Employee Batch ${employeePage + 1}] Processing ${employees.length} employees...`);

        const employeeMap = employees.reduce((map, emp) => {
            map[emp.githubId] = emp._id;
            return map;
        }, {});
        const employeeGithubIds = Object.keys(employeeMap).map(Number);

        let issuePage = 0;
        let hasMoreIssues = true;

        // Inner Loop: Process Issues in Batches for the current employee set
        while (hasMoreIssues) {
            const issueQuery = {
                $or: [
                    { 'user.name': null, 'user.id': { $in: employeeGithubIds } },
                    { 'assignees.name': null, 'assignees.id': { $in: employeeGithubIds } },
                    { 'state': 'closed', 'closedBy.name': null, 'closedBy.id': { $in: employeeGithubIds } }
                ]
            };

            const issuesToUpdate = await Issue.find(issueQuery)
                .sort({ _id: 1 })
                .skip(issuePage * issueBatchSize)
                .limit(issueBatchSize);

            if (issuesToUpdate.length === 0) {
                hasMoreIssues = false;
                continue;
            }

            const bulkOps = issuesToUpdate.map(issue => {
                // (Update logic remains the same)
                if (issue.user && !issue.user.name && employeeMap[issue.user.id]) {
                    issue.user.name = employeeMap[issue.user.id];
                }
                if (issue.assignees?.length) {
                    issue.assignees.forEach(assignee => {
                        if (!assignee.name && employeeMap[assignee.id]) {
                            assignee.name = employeeMap[assignee.id];
                        }
                    });
                }
                if (issue.state === 'closed' && issue.closedBy?.length) {
                    issue.closedBy.forEach(closer => {
                        if (!closer.name && employeeMap[closer.id]) {
                            closer.name = employeeMap[closer.id];
                        }
                    });
                }
                return {
                    updateOne: {
                        filter: { _id: issue._id },
                        update: { $set: { user: issue.user, assignees: issue.assignees, closedBy: issue.closedBy } }
                    }
                };
            });

            if (bulkOps.length > 0) {
                const result = await Issue.bulkWrite(bulkOps);
                totalUpdatedCount += result.modifiedCount;
            }
            console.log(`Processed Batch ${issuePage + 1} (${issueBatchSize})`);
            issuePage++;
        }
        employeePage++;
    }

    console.log("Employee reference population process finished.");
    return {
        message: "Successfully processed all employees and populated references.",
        totalUpdatedCount: totalUpdatedCount
    };
};

populateIssueEmployeeRefs();