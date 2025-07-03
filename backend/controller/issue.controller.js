import { issueService } from '../services/issueService.js';

/**
 * Controller object for handling all issue-related API requests.
 */
export const issueController = {
    /**
     * Handles the request to get a list of issues based on filter criteria.
     * Maps to routes like: GET /api/issues, GET /api/issues?state=closed, etc.
     * @param {import('express').Request} req - The Express request object.
     * @param {import('express').Response} res - The Express response object.
     */
    async getIssues(req, res) {
        try {
            // The filters are passed directly from the request's query string.
            // Our service is already designed to handle these.
            const filters = req.query;
            const result = await issueService.findIssues(filters);
            res.status(200).json(result);
        } catch (error) {
            console.error("Error in getIssues controller:", error);
            res.status(500).json({ message: "An error occurred while fetching issues." });
        }
    },

    /**
     * Handles the request to get aggregated statistics about assignees.
     * Maps to routes like: GET /api/issues/stats, GET /api/issues/stats?sortBy=openIssues
     * @param {import('express').Request} req - The Express request object.
     * @param {import('express').Response} res - The Express response object.
     */
    async getAssigneeStats(req, res) {
        try {
            // Filters are extracted directly from the query string for consistency.
            const filters = req.query;

            // Sorting options are also extracted from the query string.
            // The service has defaults if these are not provided.
            const sortOptions = {
                sortBy: req.query.sortBy,
                order: req.query.order
            };

            const stats = await issueService.getAssigneeStats(filters, sortOptions);
            res.status(200).json(stats);
        } catch (error)
        {
            console.error("Error in getAssigneeStats controller:", error);
            res.status(500).json({ message: "An error occurred while generating assignee statistics." });
        }
    }
};