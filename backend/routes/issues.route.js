import { issueController } from "../controller/issue.controller.js";
import { Router } from "express";

const router = Router();


router.route('/filter').get(issueController.getIssues);
router.route('/stats').get(issueController.getAssigneeStats);
// GET /api/issues/summary - Summary stats for charts
router.get('/summary', issueController.getSummaryStats);

export default router