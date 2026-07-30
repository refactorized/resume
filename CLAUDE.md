# CLAUDE.md — refactorized-resume

Personal résumé generator. A **single structured source** (`web/_data/resume.yaml`) drives
data-driven **Eleventy (WebC)** templates, styled by one CSS file, and rendered to screen (HTML) and
paper (**PDF via headless Chrome / Playwright**). This is Adam Tolley's own résumé. ESM
(`"type": "module"`).

## Commands

- `npm run serve` / `npm run dev` — live HTML preview via `eleventy --serve` (http://localhost:8080;
  `dev` cleans `_site` first).
- `npm run build` — `node src/build.js`: builds the site, then prints all four résumé views to
  `_site/*.pdf`: `resume.pdf` (one-pager), `resume-full.pdf` (everything, 3pg),
  `resume-comprehensive.pdf` (3pg), and `resume-recent.pdf` (recent-weighted, 2pg). Every PDF is
  also copied to **`dist/`** (gitignored) — the persistent collection that survives the
  `rimraf _site` cleans; `_site` copies are ephemeral. Each PDF is **stamped with provenance
  metadata** (view, source/object hash, repo commit, build date — read with `pdfinfo`): sent
  résumés are renamed generically before dispatch, so the trace lives inside the file, never in
  the filename or on the page.
- `npm run build-all` — clean rebuild: `rimraf _build _site` then `node src/build.js` (produces the
  same two PDFs as `build`, from scratch).
- `npm run audit` — `node src/audit.js`: asserts every built PDF carries the running header **and**
  contact footer on **every** page, and that the page counts still match. Needs poppler
  (`brew install poppler`). Run it after any change to `shell.webc`, `resume.css`, or spacing — the
  running furniture breaks silently and only on page 2+. Also asserts provenance metadata per PDF,
  **warns** on stale document objects (`sourceVersion:` drift — regeneration stays on-demand), and
  **fails** any object naming a `retired:` technology.
- `npm run audit-all` — the same, plus W3C Nu validation of every generated page. Needs network.
- `npm run probe` — render diagnostics on the built `_site/`, using the project's own Playwright
  (the same Chromium `build.js` prints with). `probe` alone measures content height vs page budget,
  flags fragmentation waste, and warns when a multi-page view's last page is under ⅔ full;
  `probe -- css <file>` diffs page counts under candidate CSS with no rebuild; `probe -- screen`
  asserts the on-screen render. See the **render-probe** skill.
- `build.js` flags: `--skip-pdf`, `--port <n>` (default 3927), `--wait`, `-q`, `--no-color`.
  Playwright downloads its Chromium on `npm install` (shared ms-playwright cache); PDF builds boot
  an internal server on :3927 and end via `process.exit(0)`.

## Architecture

Three layers — determinism at the two ends, AI judgment only in the middle:

```
SOURCE (deterministic)   web/_data/resume.yaml   facts + preferred prose + flags

ASSEMBLE — two ways:
  • live views (loop resume.*)     index / full / recent / comprehensive .webc
                                    always-current defaults
  • tailor-resume SKILL (AI glue)  → frozen DOCUMENT OBJECT
                                    web/resume/generated/<slug>.webc (content baked in)

RENDER (deterministic)
  shell   web/_includes/shell.webc   head · .sheet · header · footer, shared by all
  style   web/style/resume.css       type, geometry, CSS-flow pagination
  print   src/build.js               Playwright → one PDF per view / object
  filters bullets(), jobHeader(), recencyYear()
```

- **Live views** loop `resume.*` and always reflect current data. **Document objects** are
  AI-assembled snapshots with content baked in as literal markup (no `resume.*` refs) — frozen,
  tailored, regenerated (never hand-edited). Both wrap their content in the shared `shell.webc` and
  are styled only by `resume.css`.
- Rendering is deterministic and CSS-driven. **Pagination is automatic by default**: content flows
  and the browser breaks pages. A long role may split, but its heading is never stranded
  (`break-after: avoid`) and no bullet is ever cut (`break-inside: avoid` on `.job li`) — see
  [ai/paged-media.md](ai/paged-media.md) for why whole-role blocks cost pages rather than saving
  them. The running header and contact footer are painted on **every** page by the shell — never
  authored per page.
- **Page breaks are the one layout decision AI may make.** Live views always auto-flow, but a
  document object can place its own breaks, because _where a multi-page résumé parts is editorial_ —
  the judgment the retired hand-split `parts/jobs-page-N.md` files used to carry:
  `<div class="page-break"></div>`, `<section class="starts-page">`, and a continued heading
  (`<h2>Employment History <span class="continued">continued</span></h2>`). Selection, not styling —
  everything else stays with `resume.css`.
- `src/build.js` (11ty programmatic API + Playwright) prints the four live views plus every
  `web/resume/generated/*` document object — one PDF each.

## Key files

- [web/\_data/resume.yaml](web/_data/resume.yaml) — **single source of truth, facts only.**
  Editorial policy lives in [ai/editorial.md](ai/editorial.md); corrections land here first (fact,
  knob, or `retired:` entry — `retired:` names are lint-enforced by audit). Per-`work` visibility
  knobs (all optional): `contract: true`; `emphasis: brief` (heading only, no bullets);
  `emphasis: omit` (kept as record, never rendered); `onePager: false` (exclude from the compact
  one-pager). Skill groups may set `subtle: true`. `tags[]` are AI-seeded for future filtering / an
  interactive résumé.
- [web/resume/index.webc](web/resume/index.webc) — one-pager: summary, skills, highlights, condensed
  employment **table**, education. Curated to one page.
- [web/resume/full.webc](web/resume/full.webc) — full résumé: same sections + **detailed**
  employment history, auto-paginated.
- [web/resume/comprehensive.webc](web/resume/comprehensive.webc) — 3-page view: `voice.about`
  profile intro, every role un-briefed, roomier spacing (`.sheet.roomy`).
- [web/resume/recent.webc](web/resume/recent.webc) — recent-weighted 2-page: roles ending 2020+ in
  full, 2014–2019 as one-liners, pre-2014 collapsed to an "Earlier:" line.
- [web/\_includes/shell.webc](web/_includes/shell.webc) — shared render shell (layout): `<head>`,
  `.sheet`, the `.page-frame` running-furniture table, and the contact footer. Identity from front
  matter, else falls back to `resume.basics`; `variant: roomy` adds spacing. Every view and document
  object wraps its content in it, so the content files carry no boilerplate. See **Running
  furniture** below before touching `.page-frame`.
- [web/style/resume.css](web/style/resume.css) — every visual decision + the screen/print and
  pagination rules.
- [src/transforms/bullets.js](src/transforms/bullets.js) — highlights array
  (`string | {text, children}`) → nested `<ul>`. [jobHeader.js](src/transforms/jobHeader.js) — a
  work entry's role(s) → styled `<h3>` line(s). [recencyYear.js](src/transforms/recencyYear.js) — a
  job's most-recent end year, for weighting/thinning roles in variants. All registered in
  [eleventy.config.js](eleventy.config.js) and unit-tested inline.
- [web/index.md](web/index.md) + [simple.layout.html](web/_includes/simple.layout.html) — the
  landing page.
- [web/resume/generated/](web/resume/generated/) — **document objects**: frozen, AI-assembled
  résumés with content baked in (see `example-frontend.webc`). `src/build.js` auto-discovers them →
  `resume-<slug>.pdf`. Generate with the **tailor-resume** skill
  ([.claude/skills/tailor-resume/SKILL.md](.claude/skills/tailor-resume/SKILL.md)) — regenerate,
  never hand-edit. Front matter carries `sourceVersion:` (audit warns on drift) and `sent:` once
  dispatched — a sent state is committed and never silently regenerated over. The target brief
  lives verbatim in `ai/briefs/<slug>.md`; each new/changed object is its own commit (facts commit
  first).

## Conventions

- All résumé content lives in `resume.yaml`; templates never hardcode prose.
- The italic-keyword look ("Company _as_ Role _from_ X _to_ Y", `_onward_`, `_(contract)_`) is now
  **generated by `jobHeader()`**, not authored. Don't reintroduce it as markdown.
- **WebC gotcha:** a nested `webc:for` loses the outer loop variable. Flatten with `.flatMap()` in
  the loop expression, or push the logic into a filter (that's why `jobHeader` exists).
- Prettier: no semicolons, single quotes; Markdown `proseWrap: always` at 100; `.webc` as HTML.

## Deep memory — `ai/`

This file is the **briefing** and is kept short enough to read in full every session. [`ai/`](ai/)
is the **library**: detail that would bloat the briefing but is expensive to rediscover. Load the
relevant topic when you enter it — don't read the tree.

- [ai/editorial.md](ai/editorial.md) — **editorial policy & learnings**: positioning, per-target
  insights, lessons that aren't facts. The tailor-resume skill reads it alongside `resume.yaml`
  and ratchets new judgment back into it. **Read before assembling any tailored résumé.**
- [ai/briefs/](ai/briefs/) — one file per document object: the target posting/brief, verbatim.
- [ai/paged-media.md](ai/paged-media.md) — the full running-header/footer investigation and the
  break policy. **Read before changing how pages are built.**
- [ai/review-loop.md](ai/review-loop.md) — reviewing renders, measuring correctly, and the traps
  that produce confidently wrong numbers.
- [ai/content-sources.md](ai/content-sources.md) — where résumé facts come from, how to ground the
  Spectra role in the `spectra-next` repo, and the standing content rules.
- [ai/workflows/](ai/workflows/) — one directory per effort: what was tried, what failed.

## Reviewing renders

The deliverable is a PDF, so review the PDF — not the HTML. Invoke the **render-probe** skill
([.claude/skills/render-probe/SKILL.md](.claude/skills/render-probe/SKILL.md)); full method in
[ai/review-loop.md](ai/review-loop.md).

- `npm run build && npm run audit`, then **read the PDFs directly** (`_site/*.pdf`); poppler lets
  them be read page-by-page as images. Page counts alone hide plenty.
- The **playwright-skill** (`~/.claude/skills/playwright-skill`, run via `node run.js <script>`)
  covers what the PDF can't show: on-screen rendering, computed styles, and trying a candidate CSS
  against the built pages (`page.addStyleTag` + `emulateMedia('print')` + `page.pdf`) without a
  rebuild. Serve `_site` on a spare port first — the pages link `/style/*.css` absolutely, so
  `file://` will not work.
- **Measure at 643px** (the print content width), never the default viewport — see
  [ai/review-loop.md](ai/review-loop.md).

## Running furniture (header + contact on every page)

`shell.webc` wraps the document in `<table class="page-frame" role="presentation">`: `thead` paints
the running header, `tfoot` reserves a footer band, and a `position: fixed` `.cv-contact` paints the
contact row at the bottom of every page — including the last, where content stops short.

**This is the only mechanism that works, and the table is not a stylistic choice.** Measured against
evergreen Chrome via Playwright, every alternative fails on at least one axis:

| mechanism                      | repeats                   | reserves space | pins on last page | keeps Figtree |
| ------------------------------ | ------------------------- | -------------- | ----------------- | ------------- |
| real `<thead>` / `<tfoot>`     | ✅                        | ✅             | ❌                | ✅            |
| `display: table-header-group`  | ❌                        | ✅             | ❌                | ✅            |
| `position: fixed`              | ✅                        | ❌             | ✅                | ✅            |
| renderer `displayHeaderFooter` | ✅                        | ✅             | ✅                | ❌ Times only |
| CSS `@page` margin boxes       | not implemented in Chrome |                |                   |

Three findings worth not rediscovering:

- The repeat behaviour is bound to the **`<thead>` element**, not to `display: table-header-group` —
  a semantic element carrying that display does **not** repeat, even with explicit row/cell boxes.
- `position: fixed` cannot paint into the `@page` margin band; pushed there by negative offsets or a
  transform it is clipped and lands on the wrong page.
- `displayHeaderFooter` renders in an isolated context that ignores `@font-face` **even from a data:
  URI** — verified with `pdffonts`, it embeds Times only. Disqualifying for a résumé.

Hence the hybrid, and hence `role="presentation"`: the table is kept out of the accessibility tree
while the semantic `header` / `div[role=main]` / `footer` inside carry the document outline, and the
markup validates clean. Don't "simplify" it to a plain header/footer — that silently reverts to
page-1-only furniture, which is how this was lost once already.

Probe method, per-mechanism evidence, and the `.job` break policy (a long role may split; its
heading is never stranded) are in [ai/paged-media.md](ai/paged-media.md).

## Standards baseline

Non-negotiable, and the reason several things are shaped the way they are: **modern HTML, evergreen
engine behaviour, and the rendering layer's own documented API — nothing else.** No legacy-browser
accommodations; no relying on undefined behaviour.

- Every page is a **conformant, standards-mode document** — `<!doctype html>`, `<html lang>`,
  `<head>`, `<body>`, emitted by `shell.webc`. This is a _rendering_ requirement, not hygiene: the
  paged-media behaviour the layout depends on is only defined for standards mode, and a quirks-mode
  fragment silently shifts every metric. `npm run audit-all` validates all output against the W3C Nu
  validator; keep it clean.
- **Figtree is self-hosted** (`web/style/fonts/`, variable woff2, roman + italic). The PDF build
  renders through headless Chrome, so a CDN font would make the output depend on connectivity — the
  same résumé printing in a fallback face when offline. `build.js` awaits `document.fonts.ready`
  before printing, because printing early silently prints the fallback and moves every line break.
- **One browser engine, everywhere.** Printing (`build.js`), diagnostics (`probe.js`), and the
  `playwright-skill` agents reach for all run the **same Playwright Chromium**. This is a hard
  invariant, not a preference: every paged-media behaviour the layout depends on is
  version-specific, so probing with one engine and printing with another silently compares layouts
  that don't match. Don't reintroduce a second browser library for "just this one script."
- **The renderer must stay current, and stay visible.** `build.js`, `audit.js`, and `probe.js` each
  print the Chromium version. That exists because the build sat on Chrome 127 — 24 majors behind —
  and nothing surfaced it; a stale renderer contradicts the evergreen mandate and quietly
  invalidates the findings in [ai/paged-media.md](ai/paged-media.md). If the reported version looks
  old, update `playwright` and re-verify the page counts before doing anything else.

## Gotchas

- Pinned to Eleventy `3.0.0-alpha.13`.
- **Document objects go stale silently.** Editing `resume.yaml` or `positioning` never touches
  `generated/*.webc`, and audit can't see the rot — after enriching the source, check which active
  variants need regeneration (see
  [ai/workflows/2026-07-29_capitalone-refresh-and-pdf-collection/](ai/workflows/2026-07-29_capitalone-refresh-and-pdf-collection/WRAPUP.md)).
- **`<tfoot>` goes after `<tbody>`.** HTML5 reversed the HTML4 ordering; the old order is a
  validation error.
- **`<main>` may not be a descendant of `<td>`** — hence `.page-frame`'s content cell holds a
  `<div class="cv-main" role="main">`. CSS selectors are scoped to `.cv-main`, not `main`.
- **Don't write bare `h2:first-child`** (or similar) to detune the first heading: every section's
  `h2` is a first child, so it flattens the spacing of the whole document. Scope it to
  `.cv-main > :first-child > h2:first-child`.
- **One-pager fit is spacing-tuned, not dynamic**: adding roles to the one-pager set can push it to
  a 2nd page — trim with `onePager: false` or tighten `resume.css`. (Dynamic "make it fit" is the
  eventual AI-glue job.)
- `pages` / `getChunk` filters are now unused but kept (generic, tested).

## Identity (source facts — never invent them)

Adam Tolley · adam.tolley+jobs@gmail.com · linkedin.com/in/adamtolley · github.com/refactorized.
Current role: **Development Lead, Spectra Media Collective** (Nov 2024–present). ~2 decades
full-stack web; architecture, design systems, DX. LinkedIn (for enrichment):
https://www.linkedin.com/in/adamtolley/ — usually behind auth for automated fetches, so paste an
export.

## Direction

Durable fragments + AI-powered composition. Status:

- ✅ **Single source of truth** (`resume.yaml`) — the six duplicated representations consolidated
  into one.
- ✅ **Data-driven render layer** with automatic CSS pagination — manual page-splitting retired;
  styling stays in plain CSS.
- ✅ **Retired the file-based variant surface** (`var/*` + its render/PDF machinery) — tailored
  résumés are generated on demand, not kept as duplicated files.
- ✅ **Variant _views_** (comprehensive 3-page, recent-weighted 2-page) as data-driven templates
  over the one source — density/selection only, never duplicated content. Add more views the same
  way; posting-specific tailoring still happens on demand.
- ✅ **Tailoring** ("posting → tailored résumé") is the **tailor-resume** skill: AI assembles a
  frozen document object from the source, the deterministic shell/CSS render it.
- ✅ **Provenance & editorial durability** — every PDF metadata-stamped for trace-back after
  generic renaming; objects carry `sourceVersion:`/`sent:` with per-object commits; policy in
  `ai/editorial.md` with a fold-back ratchet; `retired:` facts lint-enforced by audit.
- ▢ **Data upkeep** (LinkedIn / current work) stays **conversational, on demand** — Adam updates
  rarely, so there is no standing automation to build.
- A tags/skills taxonomy accrues lazily; a future interactive web résumé is a _payoff_ of
  accumulated structure, not a prerequisite.
