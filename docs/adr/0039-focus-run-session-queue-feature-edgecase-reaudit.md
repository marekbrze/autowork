# 0039 - focus+run session-queue feature edge-case re-audit
**Date**: 2026-07-01
**Module**: focus, run
**Status**: Accepted

## Context
After `proto-lofi` of the session-queue-order + run-task-list feature (ADR 0035), the new surfaces needed stress-testing: the matched list + `TaskOrder` in `focus` (`SessionTaskList`), and the "Tasks" section + list actions in `run` (`RunTaskList`). The pre-feature surfaces were already audited (ADR 0018/0024) and hardened (ADR 0019/0025) — the re-audit focuses on the new things and their interactions.

## Decision
Dopisano datowane sekcje re-auditu do `docs/modules/focus-edgecases.md` (7 luk: 🟡 2 · 🟢 5) i `docs/modules/run-edgecases.md` (6 luk: 🔴 1 · 🟡 3 · 🟢 2).

**Highest priority — R2-1 (🔴)**: after Done/Not-relevant actions from the list on `RunDetails`, the stats (`RunStatTiles`) and Continue **don't refresh live**. `RunDetails` holds two `useTasks()` instances (its own for mutations + one inside `useLiveRuns` for stats), and `useLocalStorage` synchronizes instances **only cross-tab** (the `storage` event doesn't ping the same window). `RunTaskList` refreshes (the mutating instance), but the stats read the stats instance — stale until refresh. This breaks the "stats recompute live" promise (ADR 0035). Fix: expose mutators from `useLiveRuns` (it already calls `useTasks`) and use a single instance in `RunDetails` (or add same-tab sync to `useLocalStorage`).

Remaining priorities: F2-1 (reset with no undo), R2-2 (dismiss from the list with no undo/confirm — ADR 0017), R2-3 (actions on an archived Run), F2-2 (resume vs live `TaskOrder`).

## Impact
`proto-harden` implements the priority list — **R2-1** as a direct-edit/harden (priority, because it's a main-interaction regression), F2-1/R2-2/R2-3/R2-4 in harden, the rest (🟢) in polish. Re-run `proto-edgecases` after the changes for a fresh baseline.
