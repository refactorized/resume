#!/usr/bin/env node
/**
 * Audits the built PDFs in _site/.
 *
 * The running header and contact footer are produced by paged-media machinery that is
 * easy to break silently — a stray `table`/`td` rule, a lost `font: inherit`, a fixed
 * element drifting outside the page box. None of that fails the build; it just quietly
 * drops the furniture off page 2. So: assert per page, not per document.
 *
 * With --validate it also checks the generated HTML against the W3C Nu validator. The
 * render layer leans on paged-media behaviour that is only defined for conformant,
 * standards-mode documents — a stray quirks-mode fragment silently changes metrics — so
 * conformance is a rendering requirement here, not just hygiene. Needs network.
 *
 * Requires poppler (`brew install poppler`) for pdfinfo/pdftotext.
 *
 * Usage: node src/audit.js [--expect resume=1,resume-full=3] [--validate]
 */
import { execFileSync } from 'child_process'
import { chromium } from 'playwright'
import { Chalk } from 'chalk'
import { createHash } from 'crypto'
import yaml from 'js-yaml'
import path from 'path'
import fs from 'fs'

const chalk = new Chalk({ level: process.env.NO_COLOR ? 0 : 1 })
const SITE = '_site'

const expectArg = process.argv.indexOf('--expect')
const expected = Object.fromEntries(
  expectArg === -1
    ? []
    : process.argv[expectArg + 1].split(',').map((pair) => {
        const [name, n] = pair.split('=')
        return [name, Number(n)]
      }),
)

const resume = yaml.load(fs.readFileSync('web/_data/resume.yaml', 'utf8'))
const HEADER_MARK = resume.basics.name
const FOOTER_MARK = resume.basics.email

const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' })

try {
  execFileSync('pdfinfo', ['-v'], { stdio: 'ignore' })
} catch {
  console.error(
    chalk.red('pdfinfo not found.') + ' Install poppler:  brew install poppler',
  )
  process.exit(2)
}

const pdfs = fs
  .readdirSync(SITE)
  .filter((f) => f.endsWith('.pdf'))
  .sort()

if (!pdfs.length) {
  console.error(chalk.red(`no PDFs in ${SITE}/ — run \`npm run build\` first`))
  process.exit(2)
}

// Report the renderer. Every paged-media behaviour this layout depends on is
// Chromium-version-specific, and the version drifts silently: the build sat on Chrome
// 127 for a long time — 24 majors behind — and nothing surfaced it.
{
  const browser = await chromium.launch()
  console.log(chalk.dim(`rendered by Chromium ${browser.version()}\n`))
  await browser.close()
}

let failed = 0

for (const pdf of pdfs) {
  const file = path.join(SITE, pdf)
  const slug = pdf.replace(/\.pdf$/, '')
  const info = sh('pdfinfo', [file])
  const pages = Number(/Pages:\s+(\d+)/.exec(info)?.[1])
  // provenance metadata (build.js stamps every PDF) — a renamed copy must trace back
  const stamped = /Keywords:.*\bsource=[0-9a-f]{8}\b/.test(info)

  const missing = []
  for (let p = 1; p <= pages; p++) {
    const text = sh('pdftotext', ['-f', String(p), '-l', String(p), file, '-'])
    if (!text.includes(HEADER_MARK)) missing.push(`p${p} header`)
    if (!text.includes(FOOTER_MARK)) missing.push(`p${p} footer`)
  }

  const want = expected[slug]
  const countBad = want !== undefined && want !== pages
  const ok = !missing.length && !countBad && stamped

  const detail = [
    countBad ? chalk.red(`expected ${want} pages`) : '',
    missing.length ? chalk.red(`missing ${missing.join(', ')}`) : '',
    stamped ? '' : chalk.red('no provenance metadata'),
  ]
    .filter(Boolean)
    .join('  ')

  console.log(
    `${ok ? chalk.green('ok  ') : chalk.red('FAIL')} ${slug.padEnd(28)} ${String(pages).padStart(2)}pg  ${detail}`,
  )
  if (!ok) failed++
}

console.log(
  failed
    ? chalk.red(`\n${failed} of ${pdfs.length} résumés failed the render audit`)
    : chalk.green(
        `\nall ${pdfs.length} résumés carry header + footer on every page`,
      ),
)

// ── Document objects: staleness (warn) + retired terms (fail) ─────────────────
// Frozen objects rot silently. `sourceVersion:` records which resume.yaml state an
// object was assembled from — drift only warns, because regeneration is on-demand.
// `retired:` names are facts an object may never carry — that fails (it would have
// caught the Lit/Stencil carry-over of Jul 2026).
{
  const GEN = 'web/resume/generated'
  const sourceVersion = createHash('sha256')
    .update(fs.readFileSync('web/_data/resume.yaml'))
    .digest('hex')
    .slice(0, 8)
  const retired = (resume.retired ?? []).map((r) => r.name)
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const objects = fs
    .readdirSync(GEN)
    .filter((f) => f.endsWith('.webc'))
    .sort()
  if (objects.length) console.log('')

  for (const f of objects) {
    const src = fs.readFileSync(path.join(GEN, f), 'utf8')
    const fm = /^---\n[\s\S]*?\n---/.exec(src)?.[0] ?? ''
    const stamp = /^sourceVersion:\s*(\S+)/m.exec(fm)?.[1]
    // comment headers may legitimately name retired terms ("Lit/Stencil purged")
    const body = src.slice(fm.length).replace(/<!--[\s\S]*?-->/g, '')
    const hits = retired.filter((n) =>
      new RegExp(`\\b${esc(n)}\\b`).test(body),
    )
    if (hits.length) failed++

    const stale = !stamp
      ? chalk.yellow('unstamped — no sourceVersion in front matter')
      : stamp !== sourceVersion
        ? chalk.yellow(`stale — from ${stamp}, source is now ${sourceVersion}`)
        : ''
    const flag = hits.length
      ? chalk.red('FAIL')
      : stale
        ? chalk.yellow('warn')
        : chalk.green('ok  ')
    const detail = [
      hits.length ? chalk.red(`names retired: ${hits.join(', ')}`) : '',
      stale,
    ]
      .filter(Boolean)
      .join('  ')
    console.log(`${flag} ${f.padEnd(28)} obj   ${detail}`)
  }
}

if (process.argv.includes('--validate')) {
  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) return walk(full)
      return e.name === 'index.html' ? [full] : []
    })

  const pages = walk(path.join(SITE, 'resume')).sort()
  console.log(chalk.dim(`\nvalidating ${pages.length} pages (W3C Nu)…`))

  for (const file of pages) {
    let messages
    try {
      const res = await fetch('https://validator.w3.org/nu/?out=json', {
        method: 'POST',
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: fs.readFileSync(file),
      })
      messages = (await res.json()).messages ?? []
    } catch (err) {
      console.log(`${chalk.yellow('skip')} ${file} — validator unreachable`)
      continue
    }

    // `info` covers stylistic notes; only error/warning gate the build.
    const real = messages.filter((m) => m.type !== 'info')
    console.log(
      `${real.length ? chalk.red('FAIL') : chalk.green('ok  ')} ${file}`,
    )
    for (const m of real) console.log(`       ${m.type}: ${m.message}`)
    if (real.length) failed++
  }
}

process.exit(failed ? 1 : 0)
