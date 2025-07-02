import { getIssues } from "../controller/getIssues.js";
import { Router } from "express";

const router = Router();


router.route('/filter').get(getIssues);

export default router