import { getRandomQuote } from '../services/quoteService.js';

/**
 * Controller to handle the request for a random quote.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
export const getQuoteController = async (req, res) => {
  try {
    const quoteObject = await getRandomQuote();
    res.status(200).json(quoteObject);
  } catch (error) {
    console.error("Error in getQuoteController:", error);

    // Send a default quote on failure so the UI doesn't break.
    res.status(500).json({ 
      error: "Failed to fetch a quote.",
      q: "The best way to predict the future is to create it.",
      a: "Peter Drucker" 
    });
  }
};