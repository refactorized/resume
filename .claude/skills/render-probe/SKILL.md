---
name: render-probe
description: >-
  Review and diagnose how the résumés actually render to PDF — check a change, find why a view
  gained a page, try candidate CSS without rebuilding, or verify the on-screen view. Use whenever
  touching web/style/resume.css, web/_includes/shell.webc, spacing, page geometry, or anything that
  could move a page break. Also use before reporting that a render change works.
---

# Render probe

The deliverable is a **PDF**. Reviewing the HTML, the markup diff, or the page count alone routinely
misses what is actually wrong with the output. This skill is the loop that looks at the real thing.

Everything runs on the project's own Playwright — the **same** Chromium `build.js` prints with —
against the already-built `_site/`. Don't hand-roll a browser script for this; the tool exists
because hand-rolled ones kept getting the same parameters wrong (see **Traps**).

## The loop

```bash
npm run build && npm run audit    # build, then assert furniture + page counts
```

Then **read the PDFs** — `_site/*.pdf`, page by page. Poppler is installed, so PDF pages are
readable as images with the Read tool. This is the primary review action, not a fallback. Do it
before saying a render change works.

Add `npm run audit-all` to also validate every page against the W3C Nu validator (needs network).
The render layer depends on standards-mode paged-media behaviour, so conformance is a rendering
requirement here, not hygiene.

## Diagnosing

```bash
npm run probe                     # measure: content height vs page budget, per view
npm run probe -- css <file.css>   # apply candidate CSS to built views, diff page counts
npm run probe -- screen           # screen-media check + screenshots
```

Global flags: `--views one-pager,full` to narrow, `--port <n>` if 3928 is busy. Output goes to
`_local/probe/` (gitignored).

**`measure`** answers the question that matters when a view grows: _is there actually too much
content?_ It reports content height against the page budget and, by comparing implied pages to the
built PDF's actual pages, flags **fragmentation waste** — a block that wouldn't fit got pushed
whole, stranding the tail of a page. That is a break-policy problem, and cutting content would be
the wrong fix. See [ai/paged-media.md](../../../ai/paged-media.md).

**`css`** is the fast path for any styling question: write the candidate rules to a file, run it,
and get a baseline-vs-candidate page-count diff across every view plus both PDFs to read. No
rebuild. This is how a change should be evaluated before it is committed to `resume.css`.

**`screen`** covers what the PDF cannot show — print-only rules leaking into screen media, a
fallback font, quirks mode, the footer overlapping content. It asserts each of those and writes
full-page screenshots.

## Traps

Each of these has produced a confidently wrong conclusion in this repo:

- **Measure at the print content width**, never the default viewport. In print media `.sheet` fills
  the viewport, so lines wrap differently and the numbers describe a layout that doesn't exist.
  `probe` derives the width from `resume.css` at runtime; if you write a one-off script, replicate
  that.
- **Await `document.fonts.ready`** before measuring or printing, or you measure the fallback face
  and every line break moves.
- **`emulateMediaType('print')`**, or print-only rules never apply.
- In a one-off `page.pdf()` that also passes `format` or `margin`, add `preferCSSPageSize: true` —
  otherwise those options override the CSS `@page` box. `probe` and `build.js` pass neither, so the
  stylesheet governs.
- Page counts alone hide _which_ page lost the running header. `npm run audit` asserts per page;
  trust it over a count.

## When the probe isn't enough

For general browser automation beyond these three commands, the global **playwright-skill**
(`~/.claude/skills/playwright-skill`, run via `node run.js <script>`) is available. Note it drives
its own Playwright Chromium — a different browser build from the one that prints the real PDFs — so
prefer `probe` for anything where render fidelity matters.

## Background

- [ai/review-loop.md](../../../ai/review-loop.md) — the review method in full.
- [ai/paged-media.md](../../../ai/paged-media.md) — how pages are actually built, why, and every
  mechanism that was tried and rejected. **Read before changing page construction.**
