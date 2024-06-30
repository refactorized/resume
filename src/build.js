import puppeteer from 'puppeteer' // or import puppeteer from 'puppeteer-core';
import Eleventy from '@11ty/eleventy'
import { mkdirp } from 'mkdirp'

const port = process?.env?.PORT || 3927
const path = process?.env?.PDF_DIR || './_site/resume.pdf'
const pathDir = path.split('/').slice(0, -1).join('/')

await mkdirp(pathDir)

const elly = new Eleventy()
await elly.init()
await elly.write()
elly.serve(port)

// Launch the browser and open a new blank page
const browser = await puppeteer.launch()
const page = await browser.newPage()

// todo: pre-build and serve
// Set screen size.
await page.setViewport({ width: 1080, height: 1024 })

await page.goto(`http://localhost:${port}/resume`, {
  waitUntil: 'networkidle2',
})

await page.pdf({
  path,
})

await browser.close()

process.exit(0)
