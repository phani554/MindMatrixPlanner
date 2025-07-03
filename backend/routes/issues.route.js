import { issueController } from "../controller/issue.controller.js";
import { Router } from "express";

const router = Router();


router.route('/filter').get(issueController.getIssues);
router.route('/stats').get(issueController.getAssigneeStats);

export default router