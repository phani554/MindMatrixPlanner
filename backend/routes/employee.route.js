import { Router } from "express";
import { employeeController } from "../controller/employee.controller.js";
import { getModuleList } from "../controller/employee.controller.js";
// You might add authentication middleware here in the future.
// import { isAuthenticatedApi } from '../middleware/Auth.js';

const router = Router();

// A GET request to the root of this router ('/data') will be handled
// by the getEmployeesController.
// router.get('/', isAuthenticatedApi, getEmployeesController);
router.get('/raw', employeeController.getEmployeesRawController);
router.get('/modules', getModuleList);

export default router;