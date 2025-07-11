import {Router} from 'express';
import { getStatus, triggerFullSync } from '../controller/sync.controller.js';
import { clients } from '../utils/eventutil.js';
import { validateToken } from '../middleware/sync.middleware.js';


const router = Router();

router.route('/run').post(validateToken, triggerFullSync);
router.get("/stream", (req, res) => {
    // Required headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
  
    // Send a comment to establish the stream
    res.write("SSE Event Handler:\n\n");
  
    // Store this client
    clients.push(res);
  
    // Remove on close
    req.on("close", () => {
      const idx = clients.indexOf(res);
      if (idx !== -1) clients.splice(idx, 1);
    });
});

router.route('/status').get(validateToken, getStatus);

export default router;