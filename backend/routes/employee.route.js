import { Router } from "express";
import { getEmployeesController } from "../controller/getResources.js";
// You might add authentication middleware here in the future.
// import { isAuthenticatedApi } from '../middleware/Auth.js';

const router = Router();

// A GET request to the root of this router ('/data') will be handled
// by the getEmployeesController.
// router.get('/', isAuthenticatedApi, getEmployeesController);
router.get('/', getEmployeesController);

export default router;