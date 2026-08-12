# 0036 - TaskOrder: one shared model for task ordering

**Date**: 2026-06-30
**Module**: focus, run
**Status**: Accepted

## Context
The `session-queue-order-and-run-task-list` feature (ADR 0035) introduces manual queue reordering in the `focus` filter and a task list on `run` Details. The feature plan left an **open question**: how to sort the run list — by stressor rank, or by the manual order from focus? Additionally: are the filter order and the run-list order **two independent things**, or **one model**?

In the `proto-detail` interview the user decided: the order should serve **flexibility** — grouping related tasks together and sequencing dependencies (one has to come earlier because another depends on it). It's not about "easy first" or "worst first".

## Decision
We introduce **`TaskOrder`** — an ordered list of task IDs — as **one shared ordering model** across the whole app:

- **Default** (empty `TaskOrder` / after reset) = order by stressor rank (most stressful → first), as so far (`FocusView.attributed`).
- **Manual reordering** (drag / ↑↓ on the matched list in the `focus` filter) **overrides** the default.
- The same `TaskOrder` decides the order in **three places**: the matched list in the `focus` filter, the session queue after Start, and the task list on `run` Details (sort within state groups).
- **Reset to default** available in the `focus` filter (and inherited by the `run` list).
- In the prototype `TaskOrder` is **global** (funnel data without `runId`, ADR 0020); per-Run in intent — with future per-Run wiring it becomes per-Run with no model change.

**Win = flexibility, not a nudge.** We hand the user control over the order; we don't suggest any specific logic.

## Impact
- `ENTITY_MAP.md`: added `TaskOrder` (a value type / `Run 1—1 TaskOrder 1—* Task` relation) + a note about the shared model.
- `GLOSSARY.md`: added the term `Manual queue order` (`TaskOrder`).
- `focus.md`: ekran filtra dwuczęściowy (filtry + lista dopasowanych z drag/↑↓ + reset); Start buduje kolejkę w porządku `TaskOrder`.
- `run.md`: lista zadań na Szczegółach sortowana wewnątrz grup stanu po `TaskOrder`.
- Nowe akcje: `Reorder queue`, `Reset queue order` (→ ADR 0037).
- Open (→ `edgecases`/`harden`): tasks added after `TaskOrder` is set; `TaskOrder` pointing to deleted tasks (prune) or tasks outside the current filter; reset (confirm vs undo).
