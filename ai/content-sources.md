# Content: sources, grounding, and standing rules

`web/_data/resume.yaml` is the single source of truth. Templates never hardcode prose, and tailored
document objects may only reword what's already in the source. **Nothing on this résumé may be
invented** — not an employer, a date, a technology, or a metric.

That rule cuts both ways: when the source is thin on something real Adam did, the fix is to
_research and enrich the source_, not to write a nice sentence into a document object.

## Where facts come from

| Source                          | Covers                                                        | Caveat                                                                 |
| ------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `web/_data/resume.yaml`         | Everything rendered. The only thing templates read.           | —                                                                      |
| LinkedIn (`/in/adamtolley`)     | History, dates, older roles, the `voice.about` text.          | Usually behind auth for automated fetch — ask Adam to paste an export. |
| `/Users/adam/code/spectra-next` | The current role. The actual codebase, docs, and AI workflow. | A sibling repo. Read it to ground claims; never edit it from here.     |

### Grounding the Spectra role

The current-role bullets should describe what is actually in `spectra-next`. Worth reading before
rewriting them:

- `CLAUDE.md` — house instructions, including the **Model & Agent Tiering** policy.
- `.ai/README.md` — the layered knowledge system (canonical docs / mechanical reference / per-effort
  workflow records). This is the substance behind the "agent-facing knowledge system" claim.
- `.claude/skills/` — `flow` (the workflow-context manager), plus other authored skills. These are
  the "reusable agent skills and workflow tooling."
- `docs/` — `code-style.md` (house style + decisions ledger), `security.md` (the data-access-layer
  model and trust lanes), `db-environments.md`.
- `~/.claude/projects/-Users-adam-code-spectra-next/memory/` — accumulated project memory, including
  team composition.

Stack, as of 2026-07: Next.js 16, React 19, TypeScript, PostgreSQL (AWS RDS) via pg-promise, MUI v7
with Prism design tokens, Zustand, Auth0, Playwright, deployed on AWS.

## Standing content rules

- **Claude Code is named, not genericized.** It is the actual daily tool behind every
  agentic-development claim (grounded in `spectra-next`: its `CLAUDE.md`, the layered `.ai/`
  system, the authored `.claude/skills/`) and a keyword some employers (e.g. Capital One) screen
  for. It leads the AI-augmented development skills group and is named in the Spectra highlights —
  don't soften it back to "AI coding tools."
- **Enriching the source does not update frozen document objects.** `generated/*.webc` are
  snapshots; they rot silently on both facts and policy (the Capital One variant missed the entire
  Spectra enrichment and still carried banned Lit/Stencil until regenerated, Jul 2026). Every
  object carries a `sourceVersion:` stamp and `npm run audit` warns when it no longer matches the
  source — regenerate on demand when it fires. When regenerating, match the old object's page
  fullness, not just its facts.
- **Lit / Stencil.js are retired — as facts.** They came from 2023–24 consulting research into
  platform-native web component frameworks, were never working knowledge, and have gone cold. They
  are `retired:` entries in `resume.yaml`, and `npm run audit` fails any generated document object
  that names them. **Do not reinstate them** from LinkedIn or from an older résumé PDF. "Web
  components" as a concept is still fair.
- **React leads.** React and Next.js are the current specialization and should lead any
  product-engineering target. The broader web-platform depth backs it up rather than replacing it.
- **Python / Java stay small.** Evidence of polyglot range, never a leading claim. See
  [ai/editorial.md](editorial.md) for the exact framing.
- **A posting's keywords never override editorial policy** ([ai/editorial.md](editorial.md)).
  Represent Adam at his real strengths, not the job description's wishlist.

## When content changes, page counts move

Adding to `resume.yaml` affects every view at once, and `npm run audit` will catch the overflow.
Remedies, in order of preference:

1. **Check whether it actually doesn't fit.** Measure content height against the page budget
   ([review-loop.md](review-loop.md)). An extra page is often fragmentation waste, not excess
   content — that's a break-policy problem, and cutting material would be the wrong fix.
2. **`onePager: false`** on an old, short role — the compact view is the one with a hard limit, and
   the oldest brief contract is the cheapest row to lose.
3. **`emphasis: brief`** to keep a role in the timeline without bullets.
4. **Tighten `resume.css`** — last, and only in small, principled amounts.

Never shrink the type to fit.
