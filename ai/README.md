# `ai/` — deep topical memory for this repo

`CLAUDE.md` is the **briefing**: it must stay short enough to be read in full at the start of every
session. This directory is the **library**: the detailed, resumable knowledge that would bloat the
briefing but is expensive to rediscover.

The split matters. Anything a session needs to know _before it starts working_ belongs in
`CLAUDE.md`. Anything a session needs _once it is already inside a topic_ belongs here, and
`CLAUDE.md` should carry a one-line pointer to it.

## Layers

| Layer                 | Purpose                                                                                                        | Where           |
| --------------------- | -------------------------------------------------------------------------------------------------------------- | --------------- |
| **Briefing**          | Always-loaded orientation. Short by design.                                                                    | `../CLAUDE.md`  |
| **Topic memory**      | Deep, durable knowledge on one subject — findings, evidence, and the reasoning behind a decision.              | `ai/<topic>.md` |
| **Narrative history** | How one effort actually went: what was tried, what failed, what shipped. Not canonical; folds into topic docs. | `ai/workflows/` |

## Contents

- **[paged-media.md](paged-media.md)** — the full running-header/footer investigation. Every
  mechanism tested, how it was probed, what it did, and why the current design is the only one that
  works. **Read this before changing anything about how pages are built.**
- **[review-loop.md](review-loop.md)** — how to actually review renders: reading PDFs as images,
  driving Playwright against built pages, measuring at the correct width, and the traps that produce
  confidently wrong measurements.
- **[content-sources.md](content-sources.md)** — where résumé facts come from, what may never be
  invented, and the standing content rules (including which skills must not be reinstated from
  LinkedIn).
- **[workflows/](workflows/)** — one directory per focused effort.

## Conventions

- **Record the evidence, not just the conclusion.** "Use a `<thead>`" is a rule someone will
  eventually 'simplify' away. "Here are the five mechanisms, here is the probe, here is what each
  one did" is a rule that survives, because the next reader can check it.
- **Findings carry their date and their method.** Browser behaviour changes; a claim about Chrome is
  only as good as the day it was measured and the probe that measured it.
- **Don't cache what the repo already owns.** File paths, CSS values, and page counts drift. Point
  at the file; state the _reasoning_ that isn't recoverable from reading it.
- When a workflow establishes something durable, **fold it into the topic doc** and leave the
  workflow as the narrative record.
