# Patterns That Generalize Well Across Apps

## Ground truth beats guessing
- Always start with get_editor_state + guidelines.
- Always inspect instance trees before deep overrides.

## Shell-first for multi-page products
- Standardize page frames first.
- Build one golden shell and replicate it.
- Avoid per-page ad-hoc layout decisions.

## Component-first, raw-shape-last
- Use the design system; only glue with custom frames.
- Keep custom shapes minimal so future refactors are cheap.

## State blocks are part of UX, not an afterthought
- Put loading/empty/error blocks inside each key page.
- Keep them compact but visible for review.

## Verification loop
- After any material change: re-fetch + screenshot.
- Fix placeholders immediately so they don’t compound into “mystery artifacts.”
