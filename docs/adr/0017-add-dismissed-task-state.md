# 0017 - add-dismissed-task-state

**Date**: 2026-06-28
**Module**: focus
**Status**: Accepted

## Context
In `focus` the user needs to mark a task as **not relevant** — it lost its meaning (deadline passed, someone else handled it, circumstances changed). This is a different intent from `Skip` ("not now, I'll come back" — the task lives and returns) and `Done` ("done"). The existing `TaskState` (`pending → active → completed | skipped`) had no place for it.

## Decision
Added a new terminal state **`dismissed`** and a **`Dismiss`** action (mark a task as not relevant). Properties:
- **Doesn't return** in subsequent sessions (terminal; the difference vs `Skip`, which returns as `pending`).
- **Undo** (like stressor deletion — ADR 0004); reverting → `pending`.
- **Counts toward Run progress** (treated as "handled" — off the plate).
- **Widoczny w `SessionSummary`** w **osobnej sekcji** („Nieaktualne").
- `ClearCompleted` clears `completed` **and** `dismissed`.

`TaskState`: `pending → active → completed | skipped | dismissed`. `progress = (completedTasks + dismissedTasks) / totalTasks`.

## Impact
- `ENTITY_MAP.md`: stany `Task` (+ `dismissed`); semantyka `progress` w `Run`.
- `ACTIONS.md`: nowa akcja `Dismiss` pod `Task`; rozszerzona uwaga przy `ClearCompleted`.
- `GLOSSARY.md`: nowy termin „Nieaktualne (odrzucone)" + aktualizacja `TaskState`.
- `PROJECT.md`: Decisions.
