# CLAUDE.md — refactorized-resume

Personal résumé generator. A **single structured source** (`web/_data/resume.yaml`)
drives data-driven **Eleventy (WebC)** templates, styled by one CSS file, and rendered to
screen (HTML) and paper (**PDF via headless Chrome / Puppeteer**). This is Adam Tolley's
own résumé. ESM (`"type": "module"`).

## Commands

- `npm run serve` / `npm run dev` — live HTML preview via `eleventy --serve`
  (http://localhost:8080; `dev` cleans `_site` first).
- `npm run build` — `node src/build.js`: builds the site, then prints all four résumé
  views to `_site/*.pdf`: `resume.pdf` (one-pager), `resume-full.pdf` (everything, 2pg),
  `resume-comprehensive.pdf` (3pg), and `resume-recent.pdf` (recent-weighted, 2pg).
- `npm run build-all` — clean rebuild: `rimraf _build _site` then `node src/build.js`
  (produces the same two PDFs as `build`, from scratch).
- `build.js` flags: `--skip-pdf`, `--port <n>` (default 3927), `--wait`, `-q`,
  `--no-color`. Puppeteer downloads its own Chromium on `npm install`; PDF builds boot an
  internal server on :3927 and end via `process.exit(0)`.

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
  print   src/build.js               Puppeteer → one PDF per view / object
  filters bullets(), jobHeader(), recencyYear()
```

- **Live views** loop `resume.*` and always reflect current data. **Document objects** are
  AI-assembled snapshots with content baked in as literal markup (no `resume.*` refs) —
  frozen, tailored, regenerated (never hand-edited). Both wrap their content in the shared
  `shell.webc` and are styled only by `resume.css`.
- Rendering is deterministic and CSS-driven. **Pagination is automatic**: content flows,
  the browser breaks pages, `break-inside: avoid` on `.job` keeps each role whole.
- `src/build.js` (11ty programmatic API + Puppeteer) prints the four live views plus every
  `web/resume/generated/*` document object — one PDF each.

## Key files

- [web/_data/resume.yaml](web/_data/resume.yaml) — **single source of truth.** Per-`work`
  visibility knobs (all optional): `contract: true`; `emphasis: brief` (heading only, no
  bullets); `emphasis: omit` (kept as record, never rendered); `onePager: false` (exclude
  from the compact one-pager). Skill groups may set `subtle: true`. `tags[]` are AI-seeded
  for future filtering / an interactive résumé.
- [web/resume/index.webc](web/resume/index.webc) — one-pager: summary, skills, highlights,
  condensed employment **table**, education. Curated to one page.
- [web/resume/full.webc](web/resume/full.webc) — full résumé: same sections + **detailed**
  employment history, auto-paginated.
- [web/resume/comprehensive.webc](web/resume/comprehensive.webc) — 3-page view:
  `voice.about` profile intro, every role un-briefed, roomier spacing (`.sheet.roomy`).
- [web/resume/recent.webc](web/resume/recent.webc) — recent-weighted 2-page: roles ending
  2020+ in full, 2014–2019 as one-liners, pre-2014 collapsed to an "Earlier:" line.
- [web/_includes/shell.webc](web/_includes/shell.webc) — shared render shell (layout):
  `<head>`, `.sheet`, name/title header, contact footer. Identity from front matter, else
  falls back to `resume.basics`; `variant: roomy` adds spacing. Every view and document
  object wraps its content in it, so the content files carry no boilerplate.
- [web/style/resume.css](web/style/resume.css) — every visual decision + the screen/print
  and pagination rules.
- [src/transforms/bullets.js](src/transforms/bullets.js) — highlights array
  (`string | {text, children}`) → nested `<ul>`. [jobHeader.js](src/transforms/jobHeader.js)
  — a work entry's role(s) → styled `<h3>` line(s).
  [recencyYear.js](src/transforms/recencyYear.js) — a job's most-recent end year, for
  weighting/thinning roles in variants. All registered in
  [eleventy.config.js](eleventy.config.js) and unit-tested inline.
- [web/index.md](web/index.md) + [simple.layout.html](web/_includes/simple.layout.html) —
  the landing page.
- [web/resume/generated/](web/resume/generated/) — **document objects**: frozen,
  AI-assembled résumés with content baked in (see `example-frontend.webc`). `src/build.js`
  auto-discovers them → `resume-<slug>.pdf`. Generate with the **tailor-resume** skill
  ([.claude/skills/tailor-resume/SKILL.md](.claude/skills/tailor-resume/SKILL.md)) —
  regenerate, never hand-edit.

## Conventions

- All résumé content lives in `resume.yaml`; templates never hardcode prose.
- The italic-keyword look ("Company _as_ Role _from_ X _to_ Y", `_onward_`, `_(contract)_`)
  is now **generated by `jobHeader()`**, not authored. Don't reintroduce it as markdown.
- **WebC gotcha:** a nested `webc:for` loses the outer loop variable. Flatten with
  `.flatMap()` in the loop expression, or push the logic into a filter (that's why
  `jobHeader` exists).
- Prettier: no semicolons, single quotes; Markdown `proseWrap: always` at 100; `.webc` as
  HTML.

## Gotchas

- Pinned to Eleventy `3.0.0-alpha.13`.
- **One-pager fit is spacing-tuned, not dynamic**: adding roles to the one-pager set can
  push it to a 2nd page — trim with `onePager: false` or tighten `resume.css`. (Dynamic
  "make it fit" is the eventual AI-glue job.)
- `pages` / `getChunk` filters are now unused but kept (generic, tested).

## Identity (source facts — never invent them)

Adam Tolley · adam.tolley+jobs@gmail.com · linkedin.com/in/adamtolley ·
github.com/refactorized. Current role: **Development Lead, Spectra Media Collective**
(Nov 2024–present). ~2 decades full-stack web; architecture, design systems, DX.
LinkedIn (for enrichment): https://www.linkedin.com/in/adamtolley/ — usually behind auth
for automated fetches, so paste an export.

## Direction

Durable fragments + AI-powered composition. Status:

- ✅ **Single source of truth** (`resume.yaml`) — the six duplicated representations
  consolidated into one.
- ✅ **Data-driven render layer** with automatic CSS pagination — manual page-splitting
  retired; styling stays in plain CSS.
- ✅ **Retired the file-based variant surface** (`var/*` + its render/PDF machinery) —
  tailored résumés are generated on demand, not kept as duplicated files.
- ✅ **Variant _views_** (comprehensive 3-page, recent-weighted 2-page) as data-driven
  templates over the one source — density/selection only, never duplicated content. Add
  more views the same way; posting-specific tailoring still happens on demand.
- ✅ **Tailoring** ("posting → tailored résumé") is the **tailor-resume** skill: AI
  assembles a frozen document object from the source, the deterministic shell/CSS render it.
- ▢ **Data upkeep** (LinkedIn / current work) stays **conversational, on demand** — Adam
  updates rarely, so there is no standing automation to build.
- A tags/skills taxonomy accrues lazily; a future interactive web résumé is a *payoff* of
  accumulated structure, not a prerequisite.
