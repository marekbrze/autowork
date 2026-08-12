# 0018 - focus-edgecase-baseline

**Date**: 2026-06-29
**Module**: focus
**Status**: Accepted

## Context
The `focus` module was built in `proto-lofi` (the happy paths work), but it hadn't yet been systematically stress-tested for edge cases. `proto-detail` deliberately deferred this audit ("don't force a systematic audit — that's proto-edgecases").

## Decision
The audit is in `docs/modules/focus-edgecases.md`. **10** gaps found: 🔴 1 · 🟡 4 · 🟢 5. Top priorities:
- 🔴 **Honest persistence** — action handlers ignore the result of `updateTask`/`deleteTask`; on a write failure the UI moves on, and the next action overwrites `pendingRef` → silent data loss (vs `ProcessView.tsx:185-199`, which checks `if (!ok) return`).
- 🟡 **No session persistence** — Exit/refresh/browser-back lose the session position; the spec promises Exit → `active` + resume (the lo-fi defers `pending` and abandons).
- 🟡 **Undo Dismiss unreachable for the last task** — the jump to summary unmounts the toast (ADR 0017 promises undo).
- 🟡 **Misleading empty-state** — "No attributes" also shows when all tasks are resolved.

## Impact
`proto-harden` will implement the priority list (starting with #1 persistence + #2 resume + #3 undo-on-summary + #4 splitting the empty-state). After the prototype changes — re-run `proto-edgecases` for a fresh baseline.
