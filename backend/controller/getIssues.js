import { Issue } from "../models/issue.model.js";

/**
 * @description   Get issues based on a flexible set of query filters.
 * @route         GET /api/issues
 * @access        Public (or Private, depending on your auth middleware)
 */
export const getIssues = async (req, res) => {
    try {
      // The magic happens here. The req.query object, which contains all the
      // URL query parameters (e.g., ?state=open&labels=bug), is passed
      // directly to our static method. The method is designed to handle this object.
      const issues = await Issue.findIssues(req.query);
  
      // Send the results back to the client with a 200 OK status.
      res.status(200).json({
        success: true,
        count: issues.length,
        data: issues,
      });
    } catch (error) {
      // If anything goes wrong (e.g., database connection issue),
      // we send a 500 Internal Server Error response.
      console.error('Error fetching issues:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching issues.',
      });
    }
};
  