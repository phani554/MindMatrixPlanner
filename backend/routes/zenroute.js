import { Router } from "express";
import { getQuoteController } from "../controller/quote.controller.js";
const router = Router();

// A GET request to /zen/quote will be handled by the getQuoteController.
router.route('/quote').get(getQuoteController)

export default router;