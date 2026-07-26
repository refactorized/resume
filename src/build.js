#!/usr/bin/env node
import puppeteer from 'puppeteer' // or import puppeteer from 'puppeteer-core';
import Eleventy from '@11ty/eleventy'
import { mkdirp } from 'mkdirp'
import { program } from 'commander'
import { Chalk } from 'chalk'
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

const elly = new Eleventy()
await elly.init()
await elly.write()

if (skipPdf) {
  log('skipping pdf generation')
  process.exit(0)
}

// the résumés to print — job: [url, outPath]
const jobs = [
  [`${webRootUrl}/resume/`, `${webFileRoot}/resume.pdf`],
  [`${webRootUrl}/resume/full/`, `${webFileRoot}/resume-full.pdf`],
  [`${webRootUrl}/resume/comprehensive/`, `${webFileRoot}/resume-comprehensive.pdf`],
  [`${webRootUrl}/resume/recent/`, `${webFileRoot}/resume-recent.pdf`],
]

// AI-generated document objects (web/resume/generated/<slug>.webc) → one PDF each
const genDir = `${webFileRoot}/resume/generated`
if (fs.existsSync(genDir)) {
  for (const slug of fs.readdirSync(genDir).sort()) {
    if (fs.existsSync(path.join(genDir, slug, 'index.html'))) {
      jobs.push([
        `${webRootUrl}/resume/generated/${slug}/`,
        `${webFileRoot}/resume-${slug}.pdf`,
      ])
    }
  }
}

await elly.serve(port)

// Launch the browser and open a new blank page
const browser = await puppeteer.launch()
const page = await browser.newPage()

for (const [url, outPath] of jobs) {
  const outDir = path.dirname(outPath)

  const dirp = await mkdirp(outDir)
  if (dirp) {
    log(`created directory ${path.dirname(dirp)}/${chalk.blue(outDir)}`)
  }

  await page.setViewport({ width: 1080, height: 1024 })

  await page.goto(url, { waitUntil: 'networkidle2' })

  await page.pdf({ path: outPath }).catch(log)

  log(`rendered ${url} to ${outPath}`)
}

// await browser.close()

if (!wait) {
  process.exit(0)
}

console.log(`\n still serving, ctrl-c to kill`)
