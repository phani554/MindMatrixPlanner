import {Router} from 'express';
import { triggerSync } from '../controller/sync.controller.js';
import { handleTeamSyncRequest } from '../controller/sync.controller.js';


const router = Router();

router.route('/run').post(triggerSync);
router.route('/data').post(handleTeamSyncRequest);

export default router;