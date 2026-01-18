require("dotenv").config();
const express = require("express");
const cors = require("cors");
const NodeCache = require("node-cache");
const { chromium } = require("playwright");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;
const CACHE_TTL = process.env.CACHE_TTL_SECONDS ? parseInt(process.env.CACHE_TTL_SECONDS) : 3600;

const cache = new NodeCache({ stdTTL: CACHE_TTL, checkperiod: 120 });

// Mapa selektora po apotekama
const priceSelectors = {
  jankovic: ".product-price",
  drmax: ".price-box .price-final_price",
  benu: "span[data-mailkit-product-price]",
  galenpharm: ".product-price-new",
  dm: '[data-dmid="price-localized"]',
  lilly: ".price"
};

// Funkcija koja dohvaća cenu sa bilo koje apoteke
const fetchPrice = async (site, url) => {
  const cacheKey = `${site}-${url}`;
  const cachedPrice = cache.get(cacheKey);
  if (cachedPrice) return cachedPrice;

  let browser;
  try {
    const selector = priceSelectors[site];
    if (!selector) throw new Error("Nepoznat site");

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // User-Agent kao pravi browser
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "domcontentloaded" });

    const price = await page.$eval(selector, el => el.textContent.trim());

    if (price) cache.set(cacheKey, price); // Spremi u cache
    return price;
  } catch (err) {
    console.error(`${site} fetch error:`, err.message);
    return null;
  } finally {
    if (browser) await browser.close();
  }
};

// API endpoint
app.get("/api/price", async (req, res) => {
  const { site, url } = req.query;
  if (!site || !url) return res.json({ error: "Params missing" });

  const price = await fetchPrice(site, url);

  if (!price) return res.json({ error: "Cannot fetch price" });
  res.json({ price });
});

app.listen(PORT, () => console.log(`Backend radi na portu ${PORT}`));
