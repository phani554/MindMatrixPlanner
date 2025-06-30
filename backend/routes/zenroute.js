import { Router } from "express";
const router = Router();

async function fetchQuote() {
  const res = await fetch("https://zenquotes.io/api/random/");
  if (!res.ok) throw new Error(`Quote API returned ${res.status}`);
  const data = await res.json();
  // the API returns an array of quote‑objects
  return data[0];
}

router.get("/quote", async (req, res) => {
  try {
    const quoteObj = await fetchQuote();
    res.json(quoteObj);
    console.log(quoteObj);
  } catch (err) {
    console.error("Error fetching quote:", err);
    res.status(500).json({ error: "Failed to fetch the quote" });
  }
});



export default router;