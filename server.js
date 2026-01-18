require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;

// Scraper za Janković
const fetchJankovic = async (url) => {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // Primer: iz Apoteka Janković vidimo da cena stoji kao tekst pre "RSD"
    const priceText = $("body")
      .text()
      .match(/([0-9]+[.,]?[0-9]*)\s*RSD/i)?.[0];

    if (!priceText) return null;
    return priceText;
  } catch (err) {
    console.error("Jankovic error:", err.message);
    return null;
  }
};

// Scraper za DrMax
const fetchDrMax = async (url) => {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // Na Dr.Max sajtu cena zna biti u elementima sa klasom koja sadrži "price"
    const priceText = $('[class*="price"]').first().text().trim();
    if (!priceText) return null;
    return priceText;
  } catch (err) {
    console.error("DrMax error:", err.message);
    return null;
  }
};

// Backend endpoint
app.get("/api/price", async (req, res) => {
  const { site, url } = req.query;

  if (!site || !url) {
    return res.json({ error: "Params missing" });
  }

  try {
    let price = null;

    switch (site) {
      case "jankovic":
        price = await fetchJankovic(url);
        break;
      case "drmax":
        price = await fetchDrMax(url);
        break;

      // Ostale apoteke dodaj ovako:
      // case "benu":
      //   price = await fetchBenu(url);
      //   break;
      // case "dm":
      //   price = await fetchDm(url);
      //   break;
      // case "galenpharm":
      //   price = await fetchGalenPharm(url);
      //   break;
      // case "lilly":
      //   price = await fetchLilly(url);
      //   break;

      default:
        return res.json({ error: "Unknown site" });
    }

    // fallback kad scraper ne nadje cenu
    if (!price) {
      return res.json({ error: "Cannot fetch price" });
    }

    res.json({ price });
  } catch (err) {
    console.error("API error:", err.message);
    res.json({ error: "Cannot fetch price" });
  }
});

app.listen(PORT, () =>
  console.log(`Backend radi na portu ${PORT}`)
);
