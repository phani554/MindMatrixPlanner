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
            const allParams = req.query;             // Extract pagination parameters
            // Extract sorting options
            const sortOptions = {
                sortBy: allParams.sortBy || 'updatedAt',
                order: allParams.order || 'desc'
            };
            const pagination = {
                page: parseInt(req.query.page) || 1,
                limit: Math.min(parseInt(req.query.limit) || 15, 100) // Max 100 per page
            };
            // Create clean filters
            const filters = { ...allParams };
            delete filters.page;
            delete filters.limit;
            delete filters.sortBy;
            delete filters.order;

            const result = await issueService.findIssues(filters, pagination, sortOptions);
            
            res.status(200).json({
                ...result,
                filters: filters,
                sortOptions: sortOptions,
                timestamp: new Date().toISOString()
            });
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
            const allParams = req.query;

            // Sorting options are also extracted from the query string.
            // The service has defaults if these are not provided.
            const sortOptions = {
                sortBy: req.query.sortBy,
                order: req.query.order
            };

            // Extract pagination parameters
            const pagination = {
                page: parseInt(req.query.page) || 1,
                limit: Math.min(parseInt(req.query.limit) || 15, 100) // Max 100 per page
            };

            // Create clean filters by removing non-filter parameters
            const filters = { ...allParams };
            delete filters.page;
            delete filters.limit; 
            delete filters.sortBy;
            delete filters.order;

            

            const result = await issueService.getAssigneeStats(filters, sortOptions, pagination);
            
            res.status(200).json({
                ...result,
                filters: filters,
                sortOptions: sortOptions,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error in getAssigneeStats controller:", error);
            res.status(500).json({ message: "An error occurred while generating assignee statistics." });
        }
    },

    /**
     * Handles the request to get summary statistics for doughnut charts and quick overviews.
     * Maps to routes like: GET /api/issues/summary, GET /api/issues/summary?assignee_ids=123
     * @param {import('express').Request} req - The Express request object.
     * @param {import('express').Response} res - The Express response object.
     */
    async getSummaryStats(req, res) {
        try {
            // Use the same filter structure as other endpoints for consistency
            const filters = req.query;
            const summary = await issueService.getSummaryStats(filters);
            
            res.status(200).json({
                data: summary,
                filters: filters,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error in getSummaryStats controller:", error);
            res.status(500).json({ message: "An error occurred while generating issue summary." });
        }
    }
};