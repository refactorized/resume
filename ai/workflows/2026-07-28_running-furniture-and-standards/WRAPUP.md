# Running furniture, standards mode, and a React-forward rewrite

**2026-07-28.** Started as "restore the per-page headers/footers we lost," became a rebuild of the
render layer's foundations plus a content pass on the current role.

## What prompted it

`_local/resume-full.pdf` (the pre-consolidation render) had a name/title header and a contact row on
every page, and an "Employment History _continued_" heading on page 3. Those came from hand-split
fixed-height `.page` divs fed by `parts/jobs-page-N.md`. When pagination became automatic (commit
`263c728`), the furniture silently became page-1-only — nothing failed, the output just quietly got
worse.

## What shipped

**Tooling.** Installed `playwright-skill` globally at `~/.claude/skills/`, and poppler — the latter
is what made PDF review possible at all, since it lets the built PDFs be read as images. Added
`src/audit.js` (`npm run audit` / `audit-all`) asserting header + footer on **every** page of every
PDF, expected page counts, and optionally W3C validation.

**Running furniture restored.** `.page-frame` hybrid: `thead` paints the header, `tfoot` reserves
the footer band, fixed `.cv-contact` pins the contact row to the bottom of every page including the
last. Full investigation and the rejected alternatives are in
[../paged-media.md](../paged-media.md).

**Explicit page breaks** as a document-object primitive — `page-break`, `starts-page`, continued
headings — with the tailor-resume skill given editorial ownership of where a multi-page résumé
parts. This was Adam's original expectation of what "AI gluing" would cover.

**Standards mode.** The pages had never had a doctype — WebC emits a bare fragment, so everything
rendered in quirks mode. Now a full conformant document. Two conformance errors surfaced that
assumption would have missed: `<tfoot>` must follow `<tbody>` in HTML5, and `<main>` may not descend
from `<td>`.

**Self-hosted Figtree.** The build was fetching fonts from a CDN at render time, so the same résumé
printed in a fallback face when offline. Now local woff2, and `build.js` awaits
`document.fonts.ready`.

**Content.** React-led skills (Lit/Stencil retired to `de_emphasize`), a substantially rewritten
Spectra entry grounded in the actual `spectra-next` repo — platform work, the AI-augmented
development discipline, mentoring, design system, trust-boundary hardening.

## Bugs found along the way

- `h2:first-child { margin-top: 0 }` was flattening **every** section heading, not just the
  document's first — each section's `h2` is a first child. Pre-existing; visible as
  `Employment History` and `Education` crammed against the preceding bullet.
- `break-inside: avoid` on `.job` was _costing_ pages rather than saving them. See
  [../paged-media.md](../paged-media.md#page-breaks).

## Wrong turns worth remembering

- **First probe of `position: fixed` produced a false negative.** `page.pdf()` was called without
  `preferCSSPageSize`, so `format: 'Letter'` overrode the CSS `@page` box and the fixed elements
  landed outside the page. Conclusion drawn: "fixed doesn't repeat." Wrong — it repeats fine.
  Re-probed correctly and the whole design space changed.
- **First overflow measurement was taken at the default viewport width**, reporting 55px spare on a
  page that was 12px over. In print media `.sheet` fills the viewport, so line wrapping differed
  completely. Always measure at 643px.
- **Assumed `<main>` was legal inside `<td>`** and that the `tbody`/`tfoot` order was free. Both
  wrong, both caught only because the output was actually run through a validator.

## Open / not done

- `example-frontend.webc` and `capitalone-lead.webc` predate the page-break primitive and still
  break wherever the browser lands. Regenerating them through the updated skill would exercise it.
- The `role="main"` div is a compromise forced by the frame table. A true `<main>` element would
  require dropping auto-flow for explicit per-page sections — coherent with the AI-chosen-splits
  direction, but it means live views need a build-time pagination pass.
- Relaxed `.job` break policy means a long role can continue across a page without repeating the
  company name. Acceptable, but a per-page "continued" affordance for live views was never built.
