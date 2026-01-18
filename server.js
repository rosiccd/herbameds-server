import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());

// API key za ScrapingBee
const SCRAPINGBEE_KEY = process.env.SCRAPINGBEE_KEY || "YOUR_KEY_HERE";

// Selektori za cene
const priceSelectors = {
  jankovic: ".product-price",
  drmax: ".product-price-wrapper .price", // ispravljeni selektor za Drmax
  benu: "span[data-mailkit-product-price]",
  galenpharm: ".product-price-new",
  dm: '[data-dmid="price-localized"]',
  lilly: ".price"
};

// Cache (10 minuta)
const priceCache = {};
const CACHE_TIME = 10 * 60 * 1000;

// Middleware za API key auth
const API_KEY = process.env.API_KEY || "12345abcdef";
function authMiddleware(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// API za cene
app.get("/api/price", authMiddleware, async (req, res) => {
  const { site, url } = req.query;
  if (!site || !url)
    return res.status(400).json({ error: "Missing site or url" });

  const selector = priceSelectors[site.toLowerCase()];
  if (!selector)
    return res.status(400).json({ error: "Unsupported site" });

  const cacheKey = `${site}|${url}`;
  const now = Date.now();
  if (priceCache[cacheKey] && now - priceCache[cacheKey].time < CACHE_TIME) {
    return res.json({ price: priceCache[cacheKey].price });
  }

  try {
    // ScrapingBee API poziv
    const response = await axios.get("https://app.scrapingbee.com/api/v1/", {
      params: {
        api_key: SCRAPINGBEE_KEY,
        url: url,
        render_js: true,
        extract_rules: JSON.stringify({ price: selector })
      }
    });

    const price = response.data.price || "Cena nije dostupna";
    priceCache[cacheKey] = { price, time: now };
    res.json({ price });
  } catch (err) {
    console.error("Greška u ScrapingBee API:", err.message);
    res.status(500).json({ error: "Cannot fetch price" });
  }
});

// Root
app.get("/", (req, res) => {
  res.send(
    "Herbameds Backend radi! /api/price?site=...&url=..."
  );
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
