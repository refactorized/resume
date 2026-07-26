---
name: tailor-resume
description: >-
  Generate a tailored résumé "document object" from web/_data/resume.yaml for a specific
  job posting or brief. Use when the user wants a bespoke/tailored résumé, to tailor to a
  posting, to target a role, or to produce a new one-off résumé variant. Produces a
  self-contained, frozen .webc under web/resume/generated/ that renders to PDF.
---

# Tailor résumé

You are the **assembly ("glue") layer** in a deliberately three-part system:

```
resume.yaml   →   [YOU: assemble + smooth]   →   document object   →   render (shell+CSS)   →   PDF
 facts +           select · order · weight ·      frozen webc,          deterministic,
 preferred prose   emphasize · reword             content baked in      never varies
```

Determinism lives at the two ends (the **source** and the **rendering**). Judgment lives
only in the middle — with you. Your output is a **document object**: a self-contained
`.webc` whose content is baked in as literal markup, disconnected from `resume.yaml`, that
renders deterministically through the shared shell.

## Inputs

From the user (ask only if missing and it matters):
- **Target** — a pasted job posting, or a brief ("punchy 1-pager for a staff frontend role").
- **Length** — target pages (default: 1 unless the brief implies more).
- **Tone / emphasis** — optional (e.g. leadership-forward, hands-on IC, design-systems).

## Process

1. **Read the source.** Load `web/_data/resume.yaml` — it is the ONLY source of facts and
   the canonical ("preferred") prose. Also skim `voice.about` / `voice.character` to match
   Adam's register.
2. **Assemble.** Decide, for this target:
   - which roles to feature in full, which to condense to a heading, which to fold into an
     `Earlier:` line, which to drop (recent + relevant win; use `emphasis`/`onePager` hints
     but you may override for relevance — e.g. surface an older role a posting cares about);
   - section set and order (summary, skills, highlights, experience, education);
   - a tailored `jobTitle`;
   - skill selection/ordering that mirrors the posting's language where truthful.
3. **Smooth the prose.** Reword bullets and summary to fit the target and echo the
   posting's terms — **only rephrasing/re-emphasizing existing facts. Never invent**
   (no new employers, dates, tech, or metrics not in resume.yaml). If tempted to add a
   claim that isn't in the source, stop and ask.
4. **Write the document object** to `web/resume/generated/<slug>.webc` (kebab slug, e.g.
   `acme-staff-frontend`). Follow the conventions below. Model it on the reference file
   `web/resume/generated/example-frontend.webc`.
5. **Render.** Run `npm run build` (the build auto-discovers `generated/*` → one PDF each).
   The output is `_site/resume-<slug>.pdf`.
6. **Verify & report.** Read the PDF; confirm page count, that nothing is invented, and
   that it reads well. Show the user the path and a short summary of what you weighted.

## Document-object conventions

Match `example-frontend.webc` exactly:

- Front matter: `layout: shell.webc` and a baked `jobTitle:`. Optionally `variant: roomy`.
  Leave name/email/links to the shell (they fall through to `resume.basics`) unless the
  user wants a fully standalone snapshot — then bake them too.
- Open with the frozen-object comment header (state the target; "regenerate, don't edit").
- Content is **literal markup only — no `resume.*`, no `webc:for`, no filters.** This is
  what makes it a frozen snapshot.
- Structure: `<section class="summary|skills|highlights|history|education">` with an `<h2>`.
- A role: `<div class="job">` containing one `<h3 class="job-title">Company <em>as</em>
  Role <em>from</em> Mon YYYY <em>to</em> Mon YYYY</h3>` per role (use `<em>onward</em>` for
  present, ` <em>(contract)</em>` after the role for contracts), then a `<ul><li>…</li></ul>`.
- Skills: `<ul class="skills-list"><li>comma, separated, cluster</li>…</ul>`.
- Collapsed older roles: `<p class="earlier"><em>Earlier:</em> Company · Company · … — one
  clause of context.</p>`.
- Do NOT add CSS or restyle. The frame (page size, type, spacing, pagination) is owned by
  `web/style/resume.css`; use `variant: roomy` for a more spacious 3-page feel.

## Guardrails

- **Truth:** every fact must trace to `resume.yaml`. Rewording is fine; fabrication is not.
- **Frozen:** never reference live data in the file; regenerate rather than hand-editing.
- **Fit:** hit the target length by thinning older roles (condense → `Earlier:` → drop),
  not by shrinking type. If it won't fit, tell the user what you cut.
- These files are disposable snapshots — one per application is expected; they're committed
  as a record of what was sent.
