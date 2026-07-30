#!/usr/bin/env node
/**
 * Render probe — the tight review loop for the built résumés.
 *
 * Runs against the ALREADY-BUILT `_site/` (no rebuild), through the SAME Playwright
 * Chromium that `build.js` prints with — so what the probe measures is what the real
 * PDF does. It exists because hand-rolled browser probes kept getting the same few
 * parameters wrong, each time producing confident nonsense:
 *
 *   · measuring at the default viewport instead of the print content width, so lines
 *     wrapped differently and the numbers described a layout that doesn't exist;
 *   · printing before `document.fonts.ready`, measuring the fallback face;
 *   · forgetting `emulateMedia('print')`, so print-only rules never applied.
 *
 * All of that is baked in here. Page geometry is read from resume.css at runtime (via
 * a probe element resolving the custom properties), so this can never drift from the
 * stylesheet.
 *
 * Commands:
 *   measure           content height vs page budget per view; flags fragmentation waste
 *   css <file>        apply candidate CSS to the built views and diff the page counts
 *   screen            screen-media check + screenshots (the PDF audit can't see these)
 *
 * Output lands in _local/probe/ (gitignored).
 */
import { execFileSync } from 'child_process'
import { chromium } from 'playwright'
import { program } from 'commander'
import { Chalk } from 'chalk'
import http from 'http'
import path from 'path'
import fs from 'fs'

const SITE = '_site'
const OUT = '_local/probe'
const chalk = new Chalk({ level: process.env.NO_COLOR ? 0 : 1 })

const LIVE_VIEWS = [
  ['one-pager', '/resume/', 'resume'],
  ['full', '/resume/full/', 'resume-full'],
  ['recent', '/resume/recent/', 'resume-recent'],
  ['comprehensive', '/resume/comprehensive/', 'resume-comprehensive'],
]

// ── plumbing ────────────────────────────────────────────────────────────────

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
}

function serveStatic(root, port) {
  const base = path.resolve(root)
  const server = http.createServer((req, res) => {
    let file = path.join(base, decodeURIComponent(req.url.split('?')[0]))
    if (file.endsWith(path.sep)) file = path.join(file, 'index.html')
    if (!file.startsWith(base)) {
      res.writeHead(403)
      return res.end()
    }
    fs.readFile(file, (err, buf) => {
      if (err) {
        res.writeHead(404)
        return res.end('not found')
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream',
      })
      res.end(buf)
    })
  })
  return new Promise((resolve) => server.listen(port, () => resolve(server)))
}

function discoverViews(filter) {
  const views = [...LIVE_VIEWS]
  const gen = path.join(SITE, 'resume/generated')
  if (fs.existsSync(gen)) {
    for (const slug of fs.readdirSync(gen).sort()) {
      if (fs.existsSync(path.join(gen, slug, 'index.html'))) {
        views.push([slug, `/resume/generated/${slug}/`, `resume-${slug}`])
      }
    }
  }
  if (!filter) return views
  const want = filter.split(',').map((s) => s.trim())
  return views.filter(([name]) => want.includes(name))
}

function pdfPages(file) {
  try {
    const out = execFileSync('pdfinfo', [file], { encoding: 'utf8' })
    return Number(/Pages:\s+(\d+)/.exec(out)?.[1])
  } catch {
    return null // poppler absent, or file missing — callers degrade gracefully
  }
}

/**
 * Page geometry, resolved from resume.css itself rather than restated here. Custom
 * properties don't compute to px, so measure a throwaway element sized by each one.
 */
const readGeometry = (page) =>
  page.evaluate(() => {
    const px = (expr) => {
      const el = document.createElement('div')
      el.style.cssText = `position:absolute;visibility:hidden;width:${expr}`
      document.body.appendChild(el)
      const w = el.getBoundingClientRect().width
      el.remove()
      return w
    }
    return {
      pageW: px('var(--page-width)'),
      pageH: px('var(--page-height)'),
      marginX: px('var(--margin-x)'),
      marginTop: px('var(--margin-top)'),
      marginBot: px('var(--margin-bot)'),
    }
  })

/** Put a page into the exact state the real print run sees. */
async function preparePrint(page, url, extraCss) {
  await page.goto(url, { waitUntil: 'networkidle' })
  const g = await readGeometry(page)
  const contentWidth = Math.round(g.pageW - 2 * g.marginX)
  const usable = Math.round(g.pageH - g.marginTop - g.marginBot)

  // Print content width — measuring at any other width wraps lines differently and
  // the resulting numbers are fiction.
  await page.setViewportSize({ width: contentWidth, height: 900 })
  if (extraCss) await page.addStyleTag({ content: extraCss })
  await page.emulateMedia({ media: 'print' })
  await page.evaluate(() => document.fonts.ready)
  return { contentWidth, usable }
}

async function withBrowser(fn) {
  if (!fs.existsSync(SITE)) {
    console.error(chalk.red(`no ${SITE}/ — run \`npm run build\` first`))
    process.exit(2)
  }
  fs.mkdirSync(OUT, { recursive: true })
  const port = Number(program.opts().port)
  const server = await serveStatic(SITE, port)
  const browser = await chromium.launch()
  // Every paged-media finding this repo relies on is Chromium-version-dependent, and a
  // stale renderer drifts silently. Say which one produced these numbers.
  console.log(chalk.dim(`Chromium ${browser.version()}\n`))
  try {
    return await fn(browser, `http://localhost:${port}`)
  } finally {
    await browser.close()
    server.close()
  }
}

// ── commands ────────────────────────────────────────────────────────────────

program
  .name('probe')
  .option('--port <n>', 'port for the internal static server', '3928')
  .option('--views <list>', 'comma-separated view names (default: all)')

program
  .command('measure', { isDefault: true })
  .description(
    'content height vs page budget per view; flags fragmentation waste',
  )
  .action(async () => {
    const views = discoverViews(program.opts().views)
    await withBrowser(async (browser, base) => {
      const page = await browser.newPage()
      console.log(
        chalk.dim('view              content   /page   implied  actual   note'),
      )
      for (const [name, urlPath, slug] of views) {
        const { usable } = await preparePrint(page, base + urlPath)
        const h = await page.evaluate(
          () =>
            document.querySelector('.page-frame').getBoundingClientRect()
              .height,
        )
        const implied = Math.max(1, Math.ceil(h / usable))
        const actual = pdfPages(path.join(SITE, `${slug}.pdf`))
        const spare = Math.round(implied * usable - h)

        let note = chalk.dim(`${spare}px spare on last page`)
        if (actual && actual > implied) {
          // The content fits fewer pages than it renders into: a block that wouldn't
          // fit got pushed whole. That's a break-policy problem, not too much content.
          note = chalk.yellow(
            `fragmentation waste — ${actual - implied} page(s) beyond what the content needs`,
          )
        }
        console.log(
          `${name.padEnd(17)} ${String(Math.round(h)).padStart(5)}px ${String(usable).padStart(6)}px ` +
            `${String(implied).padStart(7)} ${String(actual ?? '?').padStart(7)}   ${note}`,
        )
      }
    })
  })

program
  .command('css <file>')
  .description(
    'apply candidate CSS to the built views and diff the page counts',
  )
  .action(async (file) => {
    if (!fs.existsSync(file)) {
      console.error(chalk.red(`no such file: ${file}`))
      process.exit(2)
    }
    const candidate = fs.readFileSync(file, 'utf8')
    const views = discoverViews(program.opts().views)

    await withBrowser(async (browser, base) => {
      const page = await browser.newPage()
      console.log(chalk.dim(`candidate: ${file}\n`))
      console.log(chalk.dim('view              baseline  candidate'))
      for (const [name, urlPath] of views) {
        const counts = {}
        for (const variant of ['baseline', 'candidate']) {
          await preparePrint(
            page,
            base + urlPath,
            variant === 'candidate' ? candidate : null,
          )
          const out = path.join(OUT, `${name}-${variant}.pdf`)
          // Same call shape as build.js — no format/margin overrides, so the CSS
          // @page box governs exactly as it does in a real build.
          await page.pdf({ path: out })
          counts[variant] = pdfPages(out) ?? '?'
        }
        const changed = counts.baseline !== counts.candidate
        console.log(
          `${name.padEnd(17)} ${String(counts.baseline).padStart(8)}  ${String(counts.candidate).padStart(9)}` +
            (changed ? chalk.green('  ← changed') : ''),
        )
      }
      console.log(
        chalk.dim(
          `\nPDFs in ${OUT}/ — read them, don't trust the counts alone.`,
        ),
      )
    })
  })

program
  .command('screen')
  .description(
    'screen-media check + screenshots (the PDF audit cannot see these)',
  )
  .action(async () => {
    const views = discoverViews(program.opts().views)
    await withBrowser(async (browser, base) => {
      const page = await browser.newPage()
      let bad = 0
      for (const [name, urlPath] of views) {
        await page.setViewportSize({ width: 1100, height: 1400 })
        await page.goto(base + urlPath, { waitUntil: 'networkidle' })
        await page.evaluate(() => document.fonts.ready)

        const r = await page.evaluate(() => {
          const f = document.querySelector('.cv-contact')
          const m = document.querySelector('.cv-main')
          const reserve = document.querySelector('.cv-contact-reserve')
          return {
            compatMode: document.compatMode,
            font: getComputedStyle(m)
              .fontFamily.split(',')[0]
              .replace(/["']/g, ''),
            // print-only rules must not leak into screen
            footerStatic: getComputedStyle(f).position === 'static',
            reserveHidden: getComputedStyle(reserve).display === 'none',
            footerAfterContent:
              Math.round(f.getBoundingClientRect().top) >=
              Math.round(m.getBoundingClientRect().bottom),
          }
        })

        const fails = [
          r.compatMode !== 'CSS1Compat' && 'quirks mode',
          !r.footerStatic && 'footer is fixed on screen',
          !r.reserveHidden && 'footer reserve visible on screen',
          !r.footerAfterContent && 'footer overlaps content',
          r.font !== 'Figtree' && `font fell back to ${r.font}`,
        ].filter(Boolean)

        await page.screenshot({
          path: path.join(OUT, `${name}-screen.png`),
          fullPage: true,
        })
        console.log(
          `${fails.length ? chalk.red('FAIL') : chalk.green('ok  ')} ${name.padEnd(17)} ` +
            (fails.length
              ? chalk.red(fails.join(', '))
              : chalk.dim(r.font + ', standards mode')),
        )
        if (fails.length) bad++
      }
      console.log(chalk.dim(`\nscreenshots in ${OUT}/`))
      if (bad) process.exitCode = 1
    })
  })

await program.parseAsync()
