// server.js
const express = require("express");
const fetch = require("node-fetch");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 3000;

const CHROME_PATH = process.env.CHROME_FOR_TESTING || process.env.GOOGLE_CHROME_BIN || process.env.CHROME_PATH || "/app/.chrome-for-testing/chrome-linux64/chrome";

app.get("/rss", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const feedUrl = req.query.url;
  if (!feedUrl) {
    return res.status(400).send("Missing ?url parameter");
  }

  try {
    let xml;

    if (feedUrl.includes("fliplet.com/feed")) {
      const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        args: ["--headless", "--no-sandbox", "--disable-setuid-sandbox"],
        headless: true,
      });
      const page = await browser.newPage();

      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) " + "AppleWebKit/537.36 (KHTML, like Gecko) " + "Chrome/115.0.0.0 Safari/537.36");

      const networkResponse = await page.goto(feedUrl, { waitUntil: "networkidle2" });
      if (!networkResponse.ok()) {
        throw new Error(`Fliplet fetch failed: ${networkResponse.status()} ${networkResponse.statusText()}`);
      }
      xml = await networkResponse.text();
      await browser.close();
    } else {
      const upstream = await fetch(feedUrl);
      if (!upstream.ok) {
        throw new Error(`Fetch failed: ${upstream.status} ${upstream.statusText}`);
      }
      xml = await upstream.text();
    }

    res.status(200).type("application/xml; charset=utf-8").send(xml);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(502).type("application/xml; charset=utf-8").send(`<error>Fetch failed: ${err.message}</error>`);
  }
});

app.listen(PORT, () => {
  console.log(`▶ RSS proxy listening on port ${PORT}`);
});
