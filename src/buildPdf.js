import puppeteer from "puppeteer" // or import puppeteer from 'puppeteer-core';

// Launch the browser and open a new blank page
const browser = await puppeteer.launch()
const page = await browser.newPage()

// todo: pre-build and serve
// Set screen size.
await page.setViewport({ width: 1080, height: 1024 })

await page.goto("http://localhost:8080/short/", {
  waitUntil: "networkidle2",
})

await page.pdf({
  path: "../_local/base.pdf",
})

await browser.close()
