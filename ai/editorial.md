# Editorial policy & learnings

**What this is.** The judgment layer, made durable. [`web/_data/resume.yaml`](../web/_data/resume.yaml)
holds facts; this file holds how Adam wants those facts weighted, led, and softened — plus the
editorial lessons that aren't facts. The **tailor-resume** skill reads both before assembling
anything, and ends every session with the **ratchet**: new durable decisions fold back — facts and
knobs into `resume.yaml`, judgment into here. Maintained, not append-only: rewrite entries as
understanding improves; date them where the date carries meaning.

Enforceable retirements are **not** policy — they are `retired:` facts in `resume.yaml`, and
`npm run audit` fails a generated document object that names one.

## Positioning — lead with

- Deep web-platform expertise — HTML/CSS/JS, browsers and standards, web components, performance,
  and the architecture and design systems that hold large front ends together. This hard-won
  platform depth is the differentiator — what directing an AI can't replace.
- React specialization — React and Next.js are the current working stack (server components, typed
  data layers, shared component systems). Lead with React for any product-engineering target; the
  broader platform depth above is what backs it up.
- AI-augmented development, as a discipline — not just coding with AI, but building the knowledge
  systems, agent skills, and workflow tooling that make a team's AI use repeatable, and mentoring
  other developers into directing agents effectively themselves. Platform depth is what turns AI
  into real leverage. Claude Code is the named tool (a fact — see `resume.yaml`); don't genericize
  it back to "AI coding tools."
- Architecture, developer experience, design systems, and technical leadership / mentoring.
- Polyglot range — picks up and ships in most languages and stacks quickly; the value is breadth,
  judgement, and fast ramp, not single-language depth. (Once coded a computed-tomography simulation
  overnight from a purely algorithmic description of the math.)

## Positioning — de-emphasize

Fine to include as evidence of polyglot range, or to omit entirely for focus — but never lead with
them or claim deep expertise. A posting's keywords never override this: represent Adam at his real
strengths, not the JD's wishlist.

- **Python** — conversant and quick to master, not a claimed strength.
- **Java** — decades-old, early-career work and not a language he enjoys.

## Per-target insights

- **Capital One** (sent 2026-07-30): heavily invested in Claude Code — name it prominently. Their
  themes: cloud (AWS), developer experience, technical leadership. See
  [`briefs/capitalone-lead.md`](briefs/capitalone-lead.md).

## Editorial lessons

- **Corrections are fact changes first** (2026-07-29). When a correction arrives ("emphasize Claude
  Code", "drop Lit/Stencil"), the fix lands in `resume.yaml` — as a fact, a knob, or a `retired:`
  entry — before any document object bakes it in. Policy prose here is only for what genuinely
  can't be data.
- **Fill balance** (2026-07-29). A final page left half-empty fails review like an overflow; every
  automated check passed on a page that was 60% blank. Judge fullness from the rendered pages.
- **Density is load-bearing** (2026-07-29). When regenerating an object, match the predecessor's
  page fullness, not just its facts — the first Capital One regeneration over-thinned mid-career
  roles to ~1.6 pages of content on a 2-page document.
- **Interactive review for new/changed objects** (2026-07-30). Adam drives this toolset from
  Claude Code / the VSCode extension: show the rendered pages and iterate; a new or changed object
  isn't done until he's seen it. The `sourceVersion` stamps are what make "changed" precise.
- **Discretion in artifacts** (2026-07-30). Tailoring is not advertised: sent PDFs are renamed
  generically, so the filename carries no trace — the embedded PDF metadata does. Politely
  discreet, not secret; nothing hidden in the page text (ATS screeners flag invisible text).
- **Commit convention** (2026-07-30). Facts commit first, then each new/changed object (+ its
  brief) as its own commit — so an object's stamp always points at a committed source state. Local
  and frequent; pushing stays batched and manual. At dispatch, add `sent: YYYY-MM-DD` to the
  object's front matter and commit.
