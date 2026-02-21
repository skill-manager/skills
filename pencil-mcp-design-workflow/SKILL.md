---
name: pencil-mcp-design-workflow
description: Use Pencil MCP tools to read and modify .pen canvases safely and consistently. Use when working in Pencil (pencil.dev), editing or generating UI screens/flows, composing designs from a design system, converting code to design, or troubleshooting Pencil MCP actions (batch_design, batch_get, get_editor_state, get_guidelines, get_screenshot).
---

# Pencil MCP Design Workflow

This skill teaches **procedural best practices** for using the Pencil MCP server—beyond tool schemas—so an agent can reliably build, edit, and audit `.pen` designs.

## When to use this skill
Use this skill whenever the task involves:
- Creating or editing **Pencil** `.pen` canvases (new screens, flows, dashboards, layouts)
- Working with a **design system frame** (reusable components, slots, tokens)
- Using **batch operations** (`batch_design`) and needing safe sequencing/rollback strategy
- Debugging common failures (missing node IDs, instance paths, stale state, schema errors)
- Performing **visual verification** via `get_screenshot`

## Core rules (non-negotiable)
1. **Ground truth first**: always discover current canvas/editor state before changing anything.
2. **Smallest-change-first**: prefer atomic updates; keep batches small to limit rollbacks.
3. **Compose with components**: use design-system components/instances before drawing raw shapes.
4. **Verify after mutation**: re-fetch affected nodes and take screenshots after major edits.
5. **No surprise refactors**: do not restructure unrelated areas unless explicitly requested.

## Standard operating procedure

### 0) Discovery (always first)
1. Call `tools/list` (or equivalent discovery) to confirm available tools + schemas.
2. Run `get_editor_state` to learn:
   - active file/canvas context
   - selected frame(s)
   - current selection IDs
   - available reusable components (if surfaced)
3. Pull guidelines early:
   - `get_guidelines("design-system")` for component usage/slots/tokens
   - `get_guidelines("table")` (or other relevant guideline sets) for layout rules
4. If you need IDs/paths for instance overrides, use:
   - `batch_get(..., resolveInstances: true)` before doing deep overrides.

**Stop condition:** If you cannot confidently identify the target frame/node IDs, do not write—re-run discovery and search the tree.

### 1) Plan in passes (structure → content → polish)
Organize changes into intent-based passes:
- **Structure pass:** frames, shell layout (e.g., sidebar + main), grid/constraints
- **Content pass:** components/instances, slots, tables/forms/cards
- **Polish pass:** spacing alignment, state blocks, empty placeholders, minor typography fixes

### 2) Build reusable shells before page details
For multi-screen work:
1. Create top-level page frames first with consistent size/theme.
2. Build one “golden” shell (e.g., sidebar + main content).
3. Replicate the shell across pages to prevent layout drift.
4. Only then fill page-specific content via component composition and slot overrides.

### 3) Prefer component composition over raw shapes
- Use existing components (cards, tables, buttons, alerts, labels, search, etc.) whenever possible.
- Only use custom frames/shapes for lightweight glue (wrappers, spacing, section headers).
- For instance customization:
  - Prefer slot/override mechanisms (e.g., `instanceId/slotId` paths) over manual rebuilding.
  - Never assume descendant IDs are flat—inspect with `resolveInstances: true` first.

### 4) Use small batches with rollback awareness
- Keep each `batch_design` call to **~25 ops or fewer**.
- Group operations by intent (one pass per batch).
- If a single op failing causes full rollback, smaller batches minimize rework.
- After each batch:
  1. Re-fetch impacted nodes (via `batch_get` or equivalent).
  2. Confirm constraints/alignment didn’t regress.
  3. Optionally capture a screenshot for auditability.

### 5) Add product states in-context
For key user journeys, add compact state sub-frames per page:
- `loading`
- `empty`
- `error`

Keep them visible but non-dominant so stakeholders can review behavior without navigating away.

### 6) Encode important decisions as UI artifacts
When the product has policy, compliance, or trust rules:
- Represent them as explicit callouts (e.g., Alert components) in the design.
- This makes decisions reviewable in design critique, not hidden in external docs.

### 7) Visual validation and artifact cleanup
After major changes:
1. Call `get_screenshot` for representative frames/pages.
2. Fix common artifacts:
   - empty action slots / placeholder stripes
   - inconsistent spacing between repeated blocks
   - mixed typography tokens
3. Re-screenshot after cleanup before proceeding.

## Common failure modes and recovery

### “Node/element not found”
1. Re-run `get_editor_state` (selection may have changed).
2. Re-run `batch_get` (use broader search) to rediscover correct IDs.
3. If instance overrides are involved: re-run `batch_get(..., resolveInstances: true)` and retry with correct descendant paths.

### Schema/validation errors
1. Re-run discovery (`tools/list`) to confirm the current schema.
2. Adjust payload to match required fields/types.
3. Retry with a reduced batch (1–3 ops) to isolate the failure.

### Layout regressions after edits
1. Identify which batch introduced the regression.
2. Revert by applying inverse ops (or restore properties from last known good fetch).
3. Re-apply changes in smaller, more constrained batches.

## Output requirements (how to report back)
When you finish a set of changes, summarize:
- What changed (high level)
- Which frames/nodes were touched (IDs if available)
- How you verified (re-fetch + screenshot)
- Any assumptions or open questions

## Reference playbooks
See:
- `references/golden-path.md`
- `references/error-recovery.md`
- `references/patterns.md`
