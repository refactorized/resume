# Capital One refresh, Claude Code emphasis, and the PDF collection

**2026-07-29/30.** Started as "stop my PDFs disappearing," became a regeneration of the Capital One
variant that exposed how frozen document objects rot, plus the first naming of Claude Code as a
source fact.

## What prompted it

Built PDFs lived only in `_site/`, which `npm run dev` and `build-all` both rimraf — outputs kept
vanishing. Separately, Adam noticed the Capital One variant didn't reflect the recently enriched
Spectra data, and wanted his Claude Code use emphasized by name (Capital One is heavily invested in
it).

## What shipped

**`dist/` collection.** `build.js` now copies every rendered PDF into gitignored `dist/` — the copy
that survives cleans. The copy happens only if the render actually produced a file, so a failed
print can't clobber a good previous copy.

**Claude Code as a named fact.** `resume.yaml` previously said only "agentic coding workflows"; the
actual daily tool was never named. Now the first item of the AI-augmented development skills group
and named in the Spectra highlights ("full adoption … on Claude Code", "reusable Claude Code agent
skills"). Grounded against `spectra-next` before writing — its `CLAUDE.md` (model/agent tiering
policy), layered `.ai/` knowledge system, and authored `.claude/skills/`. A fact, not padding —
though it is also a keyword some employers screen for. The facts-first ordering (enrich the source,
then regenerate) was confirmed by Adam as the right call.

**`capitalone-lead.webc` regenerated** through the updated skill (the previous object predated both
the Spectra enrichment and the page-break primitive):

- Full enriched Spectra role including the nested Claude Code bullets; Claude Code also in summary
  ¶2 and the skills list (moved up to second line).
- Lit/Stencil purged — the old object still carried them; the ban postdated its generation.
- First real use of the editorial page break + `Experience <span class="continued">` heading: page 1
  closes after the two current-stack roles, page 2 reopens labelled.
- Mid-career roles restored after the first regeneration over-thinned (below).

**Fill-balance check codified** in the tailor-resume SKILL (verify step) and
[../review-loop.md](../review-loop.md): a final page left half-empty fails review like an overflow.

## Wrong turns worth remembering

- **Shipped a page 2 that was ~60% empty, and every automated check passed.** Audit asserts
  furniture and page counts; nothing measures fullness. The pages were reviewed as images, the space
  was visible, and it was misjudged as a normal tail. Fill balance is editorial judgment — now
  written into the review docs, but still manual (see below).
- **Over-thinned on regeneration.** Too many mid-career roles were folded into `Earlier:` to pay for
  the bigger Spectra section, landing ~1.6 pages of content on a 2-page document. The old variant's
  density was load-bearing. When regenerating, compare against the previous object's fullness, not
  just its facts.
- **The frozen object had rotted on two independent axes** — facts (missing the entire Spectra
  enrichment) and policy (carrying Lit/Stencil, banned after generation) — and nothing surfaced
  either. Regeneration was triggered by Adam's memory, not by tooling.

## Open / evolution (assessment, 2026-07-30)

The three-layer architecture (determinism at the ends, judgment in the middle) held up; the gaps all
sit around the frozen middle artifacts. Ranked:

1. **Staleness detection.** Stamp each document object with the source state it was assembled from —
   e.g. a `sourceVersion:` front-matter key holding a short content hash of `resume.yaml` — and
   teach `audit.js` to warn when a stamp no longer matches the current source. Closes the
   silent-rot class (both facts and policy drift).
2. **Measured fill.** `probe` already measures content height against the page budget; have it
   report last-page fill % per view/object and warn under ~two-thirds. Mechanizes this session's
   manual check.
3. **Keep the target, not a paraphrase.** The posting/brief exists only as a comment-header summary
   inside the object; regeneration reassembles from that paraphrase. The skill should write
   `generated/<slug>.brief.md` alongside the object and read it when regenerating.
4. **Policy lint.** `positioning.de_emphasize` is enforced only by attention. A banned-terms grep
   over `generated/*.webc` (Lit, Stencil.js, …) in audit would have caught the carry mechanically.
5. **Sent-record tension.** Objects are "committed as a record of what was sent," but regeneration
   overwrites in place — the sent state survives only as an unmarked git commit. When a variant is
   actually dispatched, mark that state (a `sent:` note in the header at dispatch time, or a tag)
   before any later regeneration.

Deliberately **not** on the list: standing data-upkeep automation (ruled out in Direction), and the
interactive résumé (a payoff of accumulated structure, not a prerequisite). `dist/` accumulating
PDFs of retired objects is known and accepted — prune by hand.

## 2026-07-30 follow-up — shipped

Adam approved the list with refinements: **metadata over anything hidden on the page** (sent PDFs
are renamed generically, so the trace must live inside the file — and invisible page text trips ATS
screeners); **corrections are fact changes** (Lit/Stencil should have been retired *facts*, not
prose policy); **interactive editorial review** for new/changed objects; **per-object commits**,
local and frequent, pushes batched. Implemented same day:

- PDF provenance metadata on every build (`pdf-lib`): view, source/object hash, commit, build date.
  Audit asserts its presence; verified to survive renaming.
- `sourceVersion:` stamps + audit staleness **warning** (regeneration stays on-demand); `retired:`
  facts in `resume.yaml` + audit **fail** lint (example-frontend's Lit/Stencil line cleaned).
- `ai/editorial.md` — policy home; positioning migrated out of `resume.yaml`, which is facts-only
  now. `ai/briefs/` holds each object's target verbatim (Capital One's reconstructs a lost email).
- Capital One dispatched 2026-07-30: `sent:` front-matter marker; record locked as two commits
  (facts `29495d1`, object `932628b`) before any restructuring.
- Still open: probe last-page-fill measurement (session two).
