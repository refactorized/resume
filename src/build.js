#!/usr/bin/env node
import puppeteer from 'puppeteer' // or import puppeteer from 'puppeteer-core';
import Eleventy from '@11ty/eleventy'
import { mkdirp } from 'mkdirp'
import { program } from 'commander'
import jsonfile from 'jsonfile'
import { Chalk } from 'chalk'
import path from 'path'

program
  .option(
    '--skip-pdf',
    'skip all pdf rendering, including root resume. overrides --all-pdfs',
    false,
  )
  .option('--pdfs', "locally render all pages with the 'pdf' tag", false)
  .option('--port <num>', 'port number', '3927')
  .option('-q, --quiet', 'no console.log()', false)
  .option('--no-color', 'no colors in console output', false)
  .option(
    '--pdfs-dir',
    'pdf output directory, for local builds',
    './_build/pdf',
  )

program.parse()

const { noPdf, pdfs: allPdfs, port, quiet, pdfsDir, noColor } = program.opts()
const log = !quiet ? console.log : () => {}
const chalk = new Chalk({ level: noColor ? 0 : 1 })

const webRootUrl = `http://localhost:${port}`
const rootResumeUrl = `${webRootUrl}/resume/`

// const webFileRoot = url.fileURLToPath(new URL('../_site', import.meta.url))
const webFileRoot = '_site'

const pdfManifestPath = `${webFileRoot}/pdf/pdf.json`

const elly = new Eleventy()
await elly.init()
await elly.write()

if (noPdf) {
  log('skipping pdf generation')
  process.exit(0)
}

// include default root resume
// job: [url, outPath]
const jobs = [[rootResumeUrl, `${webFileRoot}/resume.pdf`]]

if (allPdfs) {
  const variantPath = /\/resume\/(.+|)\//
  const isVariantPath = (str) => `${str}`.match(variantPath)
  const getVariantName = (p) => p.match(variantPath)[1]
  const toOutputPath = (p) => path.join(pdfsDir, `${getVariantName(p)}.pdf`)
  const paths = await jsonfile.readFile(pdfManifestPath)

  log(paths)

  paths.forEach((p) => {
    if (isVariantPath(p)) {
      jobs.push([`${webRootUrl}/${p}`, toOutputPath(p)])
    }
  })
}

log({ jobs })

elly.serve(port)

// Launch the browser and open a new blank page
const browser = await puppeteer.launch()
const page = await browser.newPage()

// todo: pre-build and serve
// Set screen size.
for (const [url, outPath] of jobs) {
  const outDir = path.dirname(outPath)

  const dirp = await mkdirp(outDir)
  if (dirp) {
    log(`created directory ${path.dirname(dirp)}/${chalk.blue(outDir)}`)
  }

  await page.setViewport({ width: 1080, height: 1024 })

  await page.goto(url, {
    waitUntil: 'networkidle2',
  })

  await page
    .pdf({
      path: outPath,
    })
    .catch(log)

  log(`rendered ${url} to ${outPath}`)
}

// await browser.close()

process.exit(0)
