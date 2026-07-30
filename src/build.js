#!/usr/bin/env node
// Playwright, not Puppeteer: the render engine and the inspection tooling must be the
// SAME browser. Agents reach for the registered playwright-skill by default, so a
// Puppeteer render would leave a standing trap where probing and printing disagree.
// `page.pdf()` is Chromium-only and headless-only — both true here.
import { chromium } from 'playwright'
import Eleventy from '@11ty/eleventy'
import { PDFDocument } from 'pdf-lib'
import { mkdirp } from 'mkdirp'
import { program } from 'commander'
import { Chalk } from 'chalk'
import { createHash } from 'crypto'
import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

program
  .option('--skip-pdf', 'build the site but skip all PDF rendering', false)
  .option('--port <num>', 'port number', '3927')
  .option('-q, --quiet', 'no console.log()', false)
  .option('--no-color', 'no colors in console output', false)
  .option(
    '--wait',
    `don't close the process when finished, you know, for debugging`,
    false,
  )

program.parse()

const { skipPdf, port, quiet, noColor, wait } = program.opts()
const log = !quiet ? console.log : () => {}
const chalk = new Chalk({ level: noColor ? 0 : 1 })

const webRootUrl = `http://localhost:${port}`
const webFileRoot = '_site'

// PDFs are also collected here — `_site` gets cleaned on every dev/build-all run,
// so this is the copy that survives between builds. Gitignored.
const pdfCollectDir = 'dist'

// ── Provenance ────────────────────────────────────────────────────────────────
// Every PDF is stamped with metadata (view, source/object hash, repo commit, build
// date) so a generically-renamed copy in the wild still traces back to the exact
// state that produced it. Sent résumés are renamed before dispatch on purpose, so
// the filename never carries the trace — the embedded metadata does. Politely
// discreet: visible in the file's properties, never on the page (invisible page
// text reads as keyword-stuffing to ATS screeners).
const shortHash = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 8)
const sourceVersion = shortHash(fs.readFileSync('web/_data/resume.yaml'))
let commit = 'nogit'
try {
  commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  if (execSync('git status --porcelain', { encoding: 'utf8' }).trim())
    commit += '+dirty'
} catch {}
const builtOn = new Date().toISOString().slice(0, 10)

async function stampPdf(pdfPath, view, objectFile) {
  const doc = await PDFDocument.load(fs.readFileSync(pdfPath), {
    updateMetadata: false,
  })
  doc.setTitle('Adam Tolley — Résumé')
  doc.setAuthor('Adam Tolley')
  doc.setSubject('Résumé')
  doc.setKeywords([
    `view=${view}`,
    `source=${sourceVersion}`,
    ...(objectFile ? [`object=${shortHash(fs.readFileSync(objectFile))}`] : []),
    `commit=${commit}`,
    `built=${builtOn}`,
  ])
  fs.writeFileSync(pdfPath, await doc.save())
}

const elly = new Eleventy()
await elly.init()
await elly.write()

if (skipPdf) {
  log('skipping pdf generation')
  process.exit(0)
}

// the résumés to print — job: [url, outPath, view, objectFile?]
const jobs = [
  [`${webRootUrl}/resume/`, `${webFileRoot}/resume.pdf`, 'one-pager'],
  [`${webRootUrl}/resume/full/`, `${webFileRoot}/resume-full.pdf`, 'full'],
  [
    `${webRootUrl}/resume/comprehensive/`,
    `${webFileRoot}/resume-comprehensive.pdf`,
    'comprehensive',
  ],
  [`${webRootUrl}/resume/recent/`, `${webFileRoot}/resume-recent.pdf`, 'recent'],
]

// AI-generated document objects (web/resume/generated/<slug>.webc) → one PDF each
const genDir = `${webFileRoot}/resume/generated`
if (fs.existsSync(genDir)) {
  for (const slug of fs.readdirSync(genDir).sort()) {
    if (fs.existsSync(path.join(genDir, slug, 'index.html'))) {
      jobs.push([
        `${webRootUrl}/resume/generated/${slug}/`,
        `${webFileRoot}/resume-${slug}.pdf`,
        slug,
        `web/resume/generated/${slug}.webc`,
      ])
    }
  }
}

await elly.serve(port)

// Launch the browser and open a new blank page
const browser = await chromium.launch()
const page = await browser.newPage()

log(`printing with Chromium ${chalk.blue(browser.version())}`)

for (const [url, outPath, view, objectFile] of jobs) {
  const outDir = path.dirname(outPath)

  const dirp = await mkdirp(outDir)
  if (dirp) {
    log(`created directory ${path.dirname(dirp)}/${chalk.blue(outDir)}`)
  }

  await page.setViewportSize({ width: 1080, height: 1024 })

  await page.goto(url, { waitUntil: 'networkidle' })

  // Web fonts load asynchronously; printing before they settle silently prints the
  // fallback face and shifts every line break with it.
  await page.evaluate(() => document.fonts.ready)

  // No `format`/`margin` here on purpose — with neither set, the CSS `@page` box
  // governs. Passing either silently overrides the stylesheet.
  await page.pdf({ path: outPath }).catch(log)

  log(`rendered ${url} to ${outPath}`)

  if (fs.existsSync(outPath)) {
    await stampPdf(outPath, view, objectFile)
    await mkdirp(pdfCollectDir)
    const collected = path.join(pdfCollectDir, path.basename(outPath))
    fs.copyFileSync(outPath, collected)
    log(`stamped + collected ${chalk.blue(collected)}`)
  }
}

// await browser.close()

if (!wait) {
  process.exit(0)
}

console.log(`\n still serving, ctrl-c to kill`)
