# 0040 - focus+run session-queue prototype hardened
**Date**: 2026-07-01
**Module**: focus, run
**Status**: Accepted

## Context
After `proto-lofi` + `proto-edgecases` of the session-queue-order + run-task-list feature (ADR 0035/0039), the new surfaces needed hardening. The re-audit (ADR 0039) flagged 13 gaps (focus 7, run 6), of which 1 🔴 (R2-1) and 5 🟡.

## Decision
Implemented the harden states top-down from the re-audit:
- **R2-1 (🔴)** — `useLiveRuns` exposes `tasks`/`updateTask`/`deleteTask`/`taskStorage` from its own `useTasks` instance; `RunDetails` uses a single instance → the stat tiles and Continue recompute **live** after Done/Not-relevant actions from the list (previously two `useTasks` instances unsynchronized within the same tab = stats stale until refresh; it broke the ADR 0035 promise).
- **R2-2 (🟡)** — undo dla Dismiss z listy (`DismissUndoToast`; ADR 0017).
- **R2-3 (🟡)** — an archived Run → a read-only task list (actions hidden + a "Read-only — unarchive to edit" hint).
- **R2-4 (🟡)** — honest persistence (`if (!updateTask) return` w `markNotRelevant`) + implicit feedback dla Done (migracja do grupy Done).
- **F2-1 (🟡)** — a `ConfirmDialog` for "Reset to default" in the focus filter (destructive — loss of the manual `TaskOrder`).

Story: `Run/RunTaskList → ReadOnly`. ✅ tsc + eslint + build.

Deferred: **F2-2** (a design decision — resume vs live `TaskOrder`; changes the happy path, outside harden's scope), **F2-3…F2-7 / R2-5 / R2-6** (polish — touch DnD, long lists, aria-live, ID pruning).

## Impact
The prototype now handles the error paths of the new surfaces: destructive actions with confirm/undo, archived read-only, live stats after cross-module mutations. The biggest fragility removed: **R2-1** — Run stats lied after list actions. Visual polish → a separate `proto-design`/`proto-polish`.
