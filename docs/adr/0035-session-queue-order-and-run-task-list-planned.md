# 0035 - Feature „Session queue order + Run task list" planned
**Date**: 2026-06-30
**Status**: Accepted

## Context
A feature request on the living system: (1) in the focus session filter, see the list of matched tasks and manually set their order for the session (today the order is a fixed stressor-rank derivation and no list is shown); (2) on Run details, see the full task list with real states (done / to-do / not-relevant) and act on it (mark done, flag not-relevant). Needed impact scoping before implementation.

## Decision
Planned in `docs/changes/session-queue-order-and-run-task-list.md`. Affects modules `focus` and `run`; **no new module, no new nav entry** (both changes live on existing screens: `SessionFilter`, `RunDetails`). MVP scoped; deferred: edit/delete/reopen-from-details, per-filter orders, true per-Run data scoping (ADR 0020). Model decided with the user: **one manual order per Run** (`TaskOrder`, default = stressor rank; reorder persists; reset clears) — reordering a filtered subset reconfigures the global order. Run gains a task list that reads global tasks and mutates task state via `decompose`'s `useTasks` (first time `run` writes to the task store). Routes to `proto-detail` (focus, run) → `proto-lofi` → `proto-edgecases` → `proto-harden` → residual direct-edits → `proto-design`/`polish`; 5 residual direct-edits listed.

## Impact
The routed skills act on the plan. The user also reported a **related bug, routed separately**: skip should clear to `pending` on every session exit, but the symptom persists despite ADR 0034 (`2a0a7f7`) — likely the **Resume** path (snapshot cursor past skipped tasks), not just skip state. Tracked as `proto-bug [focus]`, not part of this feature. Re-run `proto-feature` if scope changes.
