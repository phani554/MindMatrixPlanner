import {Router} from 'express';
import { triggerSync } from '../controller/sync.controller.js';


const router = Router();

router.route('/run').post(triggerSync);

export default router;