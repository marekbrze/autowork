# 0057 - Specify decompose task-status display (done / irrelevant)
**Date**: 2026-07-02
**Module**: decompose
**Status**: Accepted

## Context
`proto-feature` planned a thin, read-only slice on `decompose` (plan: `docs/changes/decompose-task-status-indicator.md`, ADR 0056): show on the Next actions screen that a task is already `completed` (done) or `dismissed` (irrelevant). `proto-feature` scoped *what* (read-only; only completed+dismissed; a counter + de-emphasis), but left `proto-detail` the precise display semantics that `proto-lofi`/`proto-harden`/`proto-design` will build.

## Decision
Specified in `docs/modules/decompose.md` (an update to the existing spec) + two terms in `docs/GLOSSARY.md`. Semantics:

- **Per-task** (`TaskStatusIndicator`): `completed` → glyph ✓; `dismissed` → glyph ⊘ (`Ban`) + etykieta „not relevant", muted. **Neutralnie — irrelevant NIE na czerwono** (DESIGN.md anti-ref „harsh red alarm"). Stany `skipped`/`active` w MVP niewidoczne (render neutralnie).
- **Per-next-action counter**: `X/N done` (done = `completed` + `dismissed`, consistent with `Run.progress`), shown when ≥1 task is handled; at 0 tasks — "to break down".
- **`ResolvedNextAction`** (all tasks handled): strike-through + muted (de-emphasis), but **still fully editable** (edit / break down / delete). Read-only applies to the task **state**, not to next-action CRUD.
- **a11y**: state via glyph + text (`aria-label`), not color/strike-through only.
- **Edge** (diagnosed in the spec, to implement in `proto-harden`): a next-action with no tasks, a mix of states, re-breaking down with done tasks (text-diff preserves `state`), an old task without `state` → neutral.

Three visual micro-decisions picked as recommended (the user was AFK on confirmation; to reopen if they disagree): dismissed = glyph+tag, resolved = strike+muted, counter = "X/N done".

## Impact
`docs/modules/decompose.md` updated (Vision, Screens, Actions, Edge Cases, Integration Points). `docs/GLOSSARY.md` +`TaskStatusIndicator`, +`ResolvedNextAction`. Next step: a residual direct-edit in `src/modules/decompose/components/NextActionItem.tsx` (per the ADR 0056 plan) → `proto-edgecases` → `proto-harden`. No changes to `ACTIONS.md` (no new action — read-only) and `ENTITY_MAP.md` (`Task.state` already exists).
