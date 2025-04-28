// server.js
const express = require("express");
const fetch = require("node-fetch");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/rss", async (req, res) => {
  const feedUrl = req.query.url;
  if (!feedUrl) {
    return res.status(400).send("Missing ?url parameter");
  }

  try {
    let xml;

    if (feedUrl.includes("fliplet.com/feed")) {
      // Solve Fliplet’s JS challenge via headless Chrome
      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      // Optional: set a real UA to reduce detection
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) " + "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36");
      await page.goto(feedUrl, { waitUntil: "networkidle2" });
      xml = await page.content();
      await browser.close();
    } else {
      // Normal RSS/XML fetch
      const upstream = await fetch(feedUrl);
      xml = await upstream.text();
    }

    // Add CORS so browser (localhost or live site) can read it
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.type("application/xml").send(xml);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(502).send(`<error>Fetch failed: ${err.message}</error>`);
  }
});

app.listen(PORT, () => console.log(`▶ RSS proxy listening on http://localhost:${PORT}/rss?url=…`));
