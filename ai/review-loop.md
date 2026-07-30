# Reviewing renders

The deliverable is a **PDF**. Reviewing the HTML, or the page count, or the markup diff, all
routinely miss what's actually wrong with the output. Look at the pages.

The `/render-probe` skill is the short version of this document.

## The loop

```bash
npm run build && npm run audit     # build + assert furniture and page counts
```

then **read `_site/*.pdf` directly** — with poppler installed, PDF pages are readable as images,
page by page. This is the primary review action, not a fallback, and it should happen before
reporting that a render change works.

While reading, judge **fill balance**, not just breaks: a final page left half-empty is as much a
fit failure as an overflow. For document objects, restore or thin content until the last page is
deliberate (found the hard way on the Capital One two-pager, Jul 2026 — page 2 shipped ~60% empty
and passed every automated check).

- `npm run audit` — every PDF carries the running header **and** contact footer on **every** page,
  and page counts match expectations. Needs poppler (`brew install poppler`).
- `npm run audit-all` — the same, plus W3C Nu validation of every generated page. Needs network.
  Conformance is a rendering requirement here, not hygiene: the paged-media behaviour the layout
  depends on is only defined for standards-mode documents.

## Diagnosing — `npm run probe`

`src/probe.js` runs on the project's **own Playwright** — the same Chromium `build.js` prints with —
against the already-built `_site/`. It boots and tears down its own static server, and reads page
geometry from `resume.css` at runtime so it cannot drift from the stylesheet.

```bash
npm run probe                     # measure: content height vs page budget, per view
npm run probe -- css <file.css>   # candidate CSS on built views, page-count diff
npm run probe -- screen           # screen-media assertions + screenshots
```

`--views one-pager,full` narrows the run; `--port <n>` if 3928 is busy. Output goes to
`_local/probe/` (gitignored).

**`css` is the fast path for any styling question.** Write the candidate rules to a file and run it:
baseline-vs-candidate page counts across every view, plus both PDFs to read, with no rebuild. That
is how the `.job` break policy was evaluated across three views in one pass.

**`measure`** answers the question that matters when a view grows — _is there actually too much
content?_ It compares implied pages (from content height) against the built PDF's actual pages and
flags the gap as fragmentation waste.

**`screen`** covers what the PDF cannot show: print-only rules leaking into screen media, a fallback
font, quirks mode, the footer overlapping content.

## Measuring, without fooling yourself

The probe encodes all of this. Replicate it if you ever write a one-off script.

- **Measure at the print content width** — 8.5in paper less 0.9in margins each side = 6.7in ≈ 643px.
  In print media `.sheet` has no fixed width, so at the default ~1280px viewport lines wrap
  completely differently. A measurement at the wrong width is not approximately right, it is
  fiction: the first overflow measurement taken this way reported the one-pager as having 55px
  _spare_ when it was in fact 12px over.
- **Await `document.fonts.ready`**, or you measure the fallback face and every line moves.
- **`emulateMediaType('print')`**, or print-only rules never apply.
- If a one-off `page.pdf()` also passes `format` or `margin`, add `preferCSSPageSize: true` —
  otherwise those override the CSS `@page` box. `probe` and `build.js` pass neither, so the
  stylesheet governs.
- Page counts alone hide _which_ page lost the running header. `npm run audit` asserts per page;
  trust it over a count.

**Content height and page count are different questions.** If a view renders longer than its budget
implies, the excess is fragmentation waste — a block that wouldn't fit got pushed whole, stranding
the tail of a page — not too much content. The fix is break policy; cutting material would be wrong.
See [paged-media.md](paged-media.md).

## When the probe isn't enough

The global **playwright-skill** (`~/.claude/skills/playwright-skill`, run via
`node run.js <script>`) is there for general browser automation. Two caveats:

- It drives its own Playwright Chromium — a **different browser build** from the one printing the
  real PDFs. Prefer `probe` wherever render fidelity matters.
- Its `run.js` calls `process.chdir()` into the skill directory, so **the shell cwd resets** after
  every run. Use absolute paths in the following command, or `cd` explicitly.
