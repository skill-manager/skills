# Golden Path: Reliable Pencil MCP Session

Use this as a “known good” sequence for most UI work.

## 1) Discover
- tools/list → confirm available tools + schemas
- get_editor_state → confirm selection + active file
- get_guidelines("design-system") → learn component & slot rules
- batch_get(resolveInstances: true) → only if you need deep overrides

## 2) Plan passes
- Structure → Content → Polish
- Decide which frames/pages you will touch

## 3) Structure (small batches)
- Create/normalize page frames
- Build one “golden” shell (sidebar + main)
- Replicate shell across pages
- Verify with batch_get + screenshot

## 4) Content (component-first)
- Insert design-system components (cards/tables/forms/etc.)
- Fill via slot overrides rather than rebuilding
- Verify each page incrementally

## 5) States & decisions
- Add compact loading/empty/error blocks
- Add explicit alert/callouts for trust/compliance decisions (if relevant)

## 6) Polish & cleanup
- Fix spacing drift, typography token inconsistency
- Remove/disable unused slots that create placeholder stripes
- get_screenshot on representative pages again
