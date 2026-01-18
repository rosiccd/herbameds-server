import express from "express"
import cors from "cors"
import puppeteer from "puppeteer-core"

const app = express()
app.use(cors())

const priceSelectors = {
  jankovic: ".product-price",
  drmax: ".price-box .price-final_price",
  benu: ".buy-modal h3",
  dm: '[data-dmid="price-localized"]',
  galenpharm: ".product-price-new",
  lilly: ".price"
}

let browser

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ]
    })
  }
  return browser
}

app.get("/api/price", async (req, res) => {
  const { site, url } = req.query
  if (!site || !url) {
    return res.json({ price: null })
  }

  try {
    const browser = await getBrowser()
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })
    await page.waitForSelector(priceSelectors[site], { timeout: 15000 })

    const price = await page.$eval(
      priceSelectors[site],
      el => el.innerText.trim()
    )

    await page.close()
    res.json({ price })
  } catch (err) {
    console.error("SCRAPE ERROR:", err.message)
    res.json({ price: null })
  }
})

app.listen(8080, () => console.log("Server running"))
