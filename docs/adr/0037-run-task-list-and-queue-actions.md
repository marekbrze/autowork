# 0037 - Task list on RunDetails + queue actions

**Date**: 2026-06-30
**Module**: run, focus
**Status**: Accepted

## Context
The `session-queue-order-and-run-task-list` feature (ADR 0035): the user wants to see a **real task list** (not just aggregates) on `run` Details and act from the list; and to manually reorder in the `focus` filter. `TaskOrder` as a shared model was decided in ADR 0036.

## Decision

**A) Akcje kolejki (`focus`)** — dopisane do `ACTIONS.md` (encja `Task`):
- `Reorder queue` — drag / ↑↓ on the matched list; updates `TaskOrder` (ADR 0036). Honest persistence: on a write failure the local state doesn't break (the `ProcessView` pattern).
- `Reset queue order` — clears `TaskOrder` → back to stressor rank.

**B) Task list on RunDetails (`run`)** — a new "Tasks" section between the stats (`RunStatTiles`) and the Continue block:
- A list of all tasks (`decompose:tasks`, global — ADR 0020) **grouped by state**: **To do** (`pending`/`skipped`/`active`), **Done** (`completed`), **Not relevant** (`dismissed`); sorted within a group by `TaskOrder` (ADR 0036).
- Row: text + a state badge (+ an "untagged" label when it has no attributes) + actions.
- Akcje z listy (dopisane do `ACTIONS.md`):
  - `Mark task done (from details)` — `pending`/`skipped`/`active` → `completed`.
  - `Mark task not-relevant (from details)` — → `dismissed` (terminalnie; undo; liczy do progresem, ADR 0017).
- **`run` mutates task states for the first time** — a cross-module write via `updateTask` (`decompose/hooks/use-tasks.ts`). The stats (`deriveRunStats`, `stats.ts`) and the resume step (`deriveLastReachedStep`) read `state` directly → they recompute live.

**Out of scope (Later):** editing text/attributes and deleting a task from RunDetails; "reopen" (→ `pending`) from the list; `Skip` from the list (skip is a session concept, not a list one).

## Impact
- `ACTIONS.md`: 5 nowych akcji (`Reorder queue`, `Reset queue order`, `View run task list`, `Mark task done (from details)`, `Mark task not-relevant (from details)`).
- `GLOSSARY.md`: added the term `Run task list` (`RunTaskList`).
- `run.md`: a new "Working with the task list" flow, an updated RunDetails screen (the "Tasks" section), new edge cases.
- `focus.md`: zaktualizowany flow/ekran filtra (lista dopasowanych + reset).
- Cross-module: `run` → the `decompose` task store (read + write) — **the first write from `run`**; verify the live stat refresh after mutations.
- Open (→ `edgecases`/`harden`): the impact of done/dismiss from the list on `lastReachedStep`/resume routing; the list empty-state; an attributeless task ("untagged"); done/dismiss on an already-in-that-state task; dismiss from the list (confirm vs undo).
