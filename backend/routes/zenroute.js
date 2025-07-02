import { Router } from "express";
import { getQuoteController } from "../controller/getQuote.js";
const router = Router();

// A GET request to /zen/quote will be handled by the getQuoteController.
router.get("/quote", getQuoteController);

export default router;