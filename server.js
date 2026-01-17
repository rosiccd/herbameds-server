import express from "express";
import puppeteer from "puppeteer";
import cors from "cors";

const app = express();
app.use(cors());

const priceSelectors = {
  jankovic: ".product-price",
  drmax: ".price-box .price-final_price",
  benu: "span[data-mailkit-product-price]",
  galenpharm: ".product-price-new",
  dm: '[data-dmid="price-localized"]',
  lilly: ".price"
};

const priceCache = {};
const CACHE_TIME = 10 * 60 * 1000;

let browserPromise = null;
async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  return browserPromise;
}

app.get("/api/price", async (req, res) => {
  const { site, url } = req.query;
  if (!site || !url) return res.status(400).json({ error: "Missing site or url" });

  const selector = priceSelectors[site.toLowerCase()];
  if (!selector) return res.status(400).json({ error: "Unsupported site" });

  const cacheKey = `${site}|${url}`;
  const now = Date.now();

  if (priceCache[cacheKey] && (now - priceCache[cacheKey].time < CACHE_TIME)) {
    return res.json({ price: priceCache[cacheKey].price });
  }

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: 'networkidle2' });

    let price = null;
    try {
      // Čekamo da element sa cenom ima tekst (dinamički JS)
      await page.waitForFunction(
        (sel) => {
          const el = document.querySelector(sel);
          return el && el.innerText.trim().length > 0;
        },
        { timeout: 15000 }, // max 15 sekundi
        selector
      );

      price = await page.$eval(selector, el => el.innerText.trim());
    } catch (err) {
      console.log(`Cena nije pronađena za ${site}:`, err.message);
      price = "Cena nije dostupna";
    }

    await page.close();

    priceCache[cacheKey] = { price, time: now };
    res.json({ price });
  } catch (err) {
    console.error("Greška u Puppeteer-u:", err);
    res.status(500).json({ error: "Cannot fetch price" });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

