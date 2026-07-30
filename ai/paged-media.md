# Paged media: running header/footer, and page breaks

Everything below was measured against **headless Chromium 151.0.7922.34, via Playwright, on
2026-07-28** — the same engine `build.js` prints with, which is the point: printing and probing must
share a browser or the findings describe a layout the output doesn't have.

> These findings were originally taken on Chromium 151 while the build still printed on **Chrome
> 127** (Puppeteer 22.15, 24 majors stale — nothing reported the version, so nobody noticed). The
> design held on both, but that was luck. The repo now runs one engine everywhere and prints the
> version from `build.js`, `audit.js`, and `probe.js`. Cross-version check at the time of the
> switch: identical page counts on all six résumés, ~0.4% content-height drift. The one-pager's
> slack went from 10px to 6px — it is the view that will tip first. Chrome's paged-media
> implementation is the constraint here, not the CSS specs — several things the specs describe are
> simply not implemented. Re-measure before trusting any of it years from now; the probe method is
> included so that's cheap.

## The problem

A résumé needs the name/title header and the contact row on **every** page. The header must also not
be overlapped by flowing content, and the contact row should sit at the bottom of the page even on
the last page, where content stops short.

That's three separate requirements — **repeat**, **reserve space**, **pin to bottom** — and no
single mechanism in Chrome satisfies all three.

## What was tested, and what each did

| mechanism                                    | repeats                        | reserves space | pins on last page | keeps Figtree |
| -------------------------------------------- | ------------------------------ | -------------- | ----------------- | ------------- |
| real `<thead>` / `<tfoot>` elements          | ✅                             | ✅             | ❌                | ✅            |
| `display: table-header-group` on `<header>`  | ❌                             | ✅             | ❌                | ✅            |
| `position: fixed` at content-box edges       | ✅                             | ❌             | ✅                | ✅            |
| `position: fixed` pushed into `@page` margin | ✗ clipped, lands on wrong page |                |                   |
| renderer `displayHeaderFooter`               | ✅                             | ✅             | ✅                | ❌ Times only |
| CSS `@page` margin boxes (`@top-center` …)   | not implemented in Chrome      |                |                   |

### The three findings worth not rediscovering

**1. The repeat behaviour is bound to the `<thead>` element, not to `display`.** This is the
surprising one. A `<header>` (or `<div>`) carrying `display: table-header-group` inside a
`display: table` parent does **not** repeat on subsequent pages — it renders once. Tested three
ways: bare group elements, and with explicit `display: table-row` / `table-cell` boxes inside. All
rendered the header on page 1 only, while an otherwise-identical real `<table><thead>` repeated
correctly. There is therefore **no semantic-markup CSS equivalent** available today; a real
`<table>` is required.

**2. `position: fixed` cannot paint into the `@page` margin band.** Fixed elements _do_ repeat on
every printed page (this is well-supported), and they pin correctly — including on a short last
page. But they are positioned relative to the **page content box**, and they **reserve no space**,
so flowing content runs underneath them. Attempts to move them into the margin band — negative
`top`/`bottom` offsets, and `transform: translateY()` — are clipped, and produce a distinctive
off-by-one signature: the header appears on pages 1–2 but not 3, the footer on pages 2–3 but not 1.
Same failure in both quirks and standards mode.

**3. `displayHeaderFooter` templates cannot use a custom font.** Chrome renders the header/footer
template in an isolated context that ignores `@font-face` **even from a `data:` URI** with the font
bytes inlined — so no network dependency explains it. Verified with `pdffonts` on the output: only
`Times-Roman` / `Times-Bold` are embedded. This is disqualifying for a résumé whose body is Figtree,
and it is the reason the otherwise ideal "use the renderer's own API" answer was rejected.

## What we therefore do

A hybrid, in `web/_includes/shell.webc` + `web/style/resume.css`:

- `<thead>` — paints the running header **and** reserves its own height.
- `<tfoot>` — reserves the footer band (`--footer-reserve`); paints nothing.
- `.cv-contact` — `position: fixed`, painting the contact row at the bottom of every page, including
  the last one.

The table carries `role="presentation"` so it stays out of the accessibility tree; the document
outline is carried by the `header` / `div[role=main]` / `footer` inside it. Output validates clean
against the W3C Nu validator.

### Conformance constraints this ran into

- `<tfoot>` must come **after** `<tbody>`. HTML5 reversed the HTML4 ordering; the old order is a
  validation error.
- `<main>` may **not** be a descendant of `<td>` — hence `div[role="main"]`, and CSS selectors
  scoped to `.cv-main` rather than `main`.

## Page breaks

Automatic by default. Two things shape where they land:

**Explicit breaks** (document objects only — see the tailor-resume skill):
`<div class="page-break">`, `<section class="starts-page">`, and continued headings
(`<h2>… <span class="continued">continued</span></h2>`). Verified to work inside the frame table,
with the running furniture intact across a forced break.

**The `.job` break policy** — changed 2026-07-28, and the reasoning is counter-intuitive:

`break-inside: avoid` on a whole `.job` was _costing_ pages. A block only moves wholesale if it fits
on the **next** page, so a tall current role would jump entirely to the next page and strand the
whole tail of the previous one. Measured: `recent` and `comprehensive` each rendered one page longer
than needed **while their content still fit the page budget** (278px and 219px of spare budget
respectively — the loss was pure fragmentation waste).

Current policy: a long role **may** continue across a page, but `break-after: avoid` on `.job-title`
means a heading is never stranded, and `break-inside: avoid` on `.job li` means a bullet is never
split. Cost: a role's bullets can continue onto the next page without repeating the company name. To
revert, restore `break-inside: avoid` on `.job` — and expect page counts to grow.

## How to re-probe

The method that produced all of the above:

1. Serve `_site` on a spare port (pages link `/style/*.css` absolutely — `file://` fails).
2. Build a self-contained probe page with `page.setContent()`, or load a real built view and inject
   candidate CSS with `page.addStyleTag()` — no rebuild needed.
3. `page.emulateMedia({ media: 'print' })`, then `page.pdf({ preferCSSPageSize: true })`. **Omitting
   `preferCSSPageSize` makes `format`/`margin` override the CSS `@page` box** — this invalidated the
   first round of probes and produced a false negative on `position: fixed`.
4. Assert per page with `pdftotext -f N -l N`, counting a marker string. Page counts alone hide
   which page lost the furniture.
5. `pdffonts` to check what actually got embedded.
