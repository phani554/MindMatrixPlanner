import {Router} from 'express';
import { triggerFullSync } from '../controller/sync.controller.js';

let clients = [];
export function broadcastSyncComplete(payload) {
    const data = `event: sync_completed\ndata: ${JSON.stringify(payload)}\n\n`;
    clients.forEach(res => res.write(data));
};


const router = Router();

router.route('/run').post(triggerFullSync);
router.get("/stream", (req, res) => {
    // Required headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
  
    // Send a comment to establish the stream
    res.write(":\n\n");
  
    // Store this client
    clients.push(res);
  
    // Remove on close
    req.on("close", () => {
      const idx = clients.indexOf(res);
      if (idx !== -1) clients.splice(idx, 1);
    });
});

export default router;