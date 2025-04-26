const express = require("express");
const fetch = require("node-fetch");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/rss", async (req, res) => {
  const feedUrl = req.query.url;
  if (!feedUrl) return res.status(400).send("Missing ?url");

  try {
    let payload;
    if (feedUrl.includes("fliplet.com/feed")) {
      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.goto(feedUrl, { waitUntil: "networkidle2" });
      payload = await page.content();
      await browser.close();
    } else {
      const upstream = await fetch(feedUrl);
      payload = await upstream.text();
    }

    res.set("Access-Control-Allow-Origin", "*");
    res.type("application/xml").send(payload);
  } catch (err) {
    res.status(502).send(`Fetch error: ${err.message}`);
  }
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
