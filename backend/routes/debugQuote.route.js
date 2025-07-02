import { Router } from "express";
const router = Router();

router.get("/test-quote", async (req, res) => {
  const url = "https://zenquotes.io/api/random/";
  
  // Let's be very explicit with our headers to mimic a browser.
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9'
  };

  console.log("--- Starting Quote Fetch Test ---");
  console.log(`Attempting to fetch from: ${url}`);
  console.log("Using headers:", headers);

  try {
    const response = await fetch(url, { headers: headers });

    // Log the immediate response status, whatever it is.
    console.log(`ZenQuotes API responded with Status: ${response.status} ${response.statusText}`);

    // If the response is NOT successful (like a 401)...
    if (!response.ok) {
      // ...we MUST try to read the body of the error response. It often contains a clue.
      const errorBody = await response.text();
      console.error("ZenQuotes API returned an error. Raw error body:", errorBody);
      
      // Send a specific error back to the client so you see it in your browser's network tab.
      return res.status(response.status).json({
        message: "Failed to fetch quote from ZenQuotes.",
        error: `API returned status ${response.status}`,
        apiResponseBody: errorBody 
      });
    }

    // If we get here, the request was successful!
    const data = await response.json();
    console.log("Successfully fetched quote:", data);
    res.status(200).json(data);

  } catch (error) {
    console.error("A critical error occurred during the fetch operation:", error);
    res.status(500).json({ 
      message: "A critical error occurred in the backend.",
      error: error.message,
      stack: error.stack // For debugging only
    });
  } finally {
    console.log("--- Quote Fetch Test Finished ---");
  }
});

export default router;