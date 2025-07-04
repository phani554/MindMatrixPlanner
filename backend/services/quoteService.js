/**
 * Fetches a random quote from the ZenQuotes API.
 * This is the proven, working implementation.
 * @returns {Promise<Object>} A promise that resolves to a quote object.
 * @throws {Error} Throws an error if the API request fails.
 */
export const getRandomQuote = async () => {
    const url = "https://zenquotes.io/api/random/";
  
    // These are the exact headers from our successful test.
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9'
    };
  
    const response = await fetch(url, { headers: headers });
  
    if (!response.ok) {
      const errorBody = await response.text();
      console.log(`Quote API returned status ${response.status}:`, errorBody);
      throw new Error(`Quote API responded with status: ${response.status}`);
    }
  
    const data = await response.json();
    
    // Return the first quote object from the array.
    return data[0] || { q: "Success is not final, failure is not fatal: it is the courage to continue that counts.", a: "Winston Churchill" };
  };