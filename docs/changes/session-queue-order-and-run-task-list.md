# Feature: Session queue order + Run task list

## Type
Feature (planned by proto-feature)

## User goal
Two things the user wants to see at both ends of working on tasks:

1. **In the session filter (focus)** — after setting the filter (contexts + energy), see a **list of matched tasks** they're about to do, and be able to **manually set their order** (how they appear in the session). Today the order is rigidly derived from the stressor rank and the list isn't visible.
2. **On Run Details (run)** — see a **list of all tasks with their real state** (done / to do / not relevant / deferred) and be able to **act from the list** (mark done, flag not relevant). Today only aggregates (stat tiles) are visible, not the list itself.

## MVP scope
**In scope:**
- **A (focus):** a matched-tasks list on the filter screen + manual reordering (drag / ↑↓) + a persistent per-Run order + "reset to default".
- **B (run):** a "Tasks" section on RunDetails — a task list with real state + list actions: mark done (`completed`), flag not relevant (`dismissed`).

**Out of scope (Later):**
- Editing a task's text / attributes and deleting a task from RunDetails.
- "Reopen" (→ `pending`) from the RunDetails list (inverse of done/dismiss).
- A `Skip` action from RunDetails (skip is a session concept — see Related).
- Separate orders per filter (the model = one order per Run).
- Real per-Run data wiring (ADR 0020) — the order and the list inherit the global task store.

## Related (routed separately — NOT part of this feature)
- **Skip clears on session exit** — the user reported that on returning to work (Continue/Resume) the session shows them e.g. the 3rd task of 3, because the two earlier ones "hang" as skipped. This is a **bug**, not a feature: the symptom persists despite ADR 0034 (fix in `2a0a7f7`), so it needs a root cause. Hypothesis: the user uses **Resume**, and the snapshot holds the cursor placed past the skipped tasks (`FocusView.tsx` `resumeSession` / `resumableSnapshot`) — yesterday's reset at the start of a *new* session doesn't catch it. Additionally, the user's hypothesis ("clear skip on exit") **may not fix the symptom by itself**, because the problem is the cursor, not only the state. → **`proto-bug [focus]`** (diagnosis + fix plan, independent of this feature).

## Impact map
- **New module?**: no — extends `focus` and `run`.
- **Modules affected**:
  - `focus` — the filter screen gains a matched list + an order UI; new order persistence; queue building reads the manual order instead of (default) the stressor rank.
  - `run` — RunDetails gains a task-list section + actions; the `run` module **mutates task states** for the first time (cross-module: `run` → task store from `decompose`).
- **Cross-module integration** (risky points):
  1. **A — manual-order persistence vs global store + filter.** The order holds an ordered list of task IDs; the filter masks a subset; reordering within a sub-filter reconfigures the global order. Integration point: queue building in `FocusView` (`start` / `attributed`).
  2. **B — `run` mutates `decompose` tasks.** RunDetails will call `updateTask` from `decompose/hooks/use-tasks.ts`. Run stats (`deriveRunStats`, `stats.ts`) must react live (already derived from tasks — verify).
- **Shared-doc additions** (written by `proto-detail`):
  - `ACTIONS.md` [+]: `Reorder queue` (drag/↑↓), `Reset queue order`, `View run task list`, `Mark task done (from details)`, `Mark task not-relevant (from details)`.
  - `ENTITY_MAP.md` [+]: the `TaskOrder` value/relation (a manual per-Run order; default = stressor rank) — the `Run 1—1 TaskOrder 1—* Task` (order) relation.
  - `GLOSSARY.md` [+]: `Manual queue order` (`TaskOrder`) — a Run's manual task order; `Run task list` — the task-list view on Details.

## Per-module changes

### `focus` — matched list + manual order
- **Data**:
  - New persistence: **`TaskOrder`** = an ordered list of task IDs (`string[]`), key e.g. `focus:taskOrder` (via `useLocalStorage`, the `focus:filter` pattern from `FocusView.tsx:62`).
  - **Default** (no `TaskOrder` / after reset) = order by stressor rank, as today (`attributed`, `FocusView.tsx:78-90`: sort by `stressorRank` + `createdAt`).
  - **Per-Run in intent; global in the prototype** — inherits the ADR 0020 limitation (funnel data without `runId`); with future per-Run wiring it becomes per-Run with no model change.
  - Tasks outside `TaskOrder` (newly added) → appended by default (stressor rank) at the end (→ edgecases).
- **Actions**:
  - **Reorder queue** — drag / ↑↓ on the matched list; updates `TaskOrder` (positions of the moved IDs; the rest stable). Honest persistence: on a write failure the local state doesn't break (the pattern from `ProcessView` / `FocusView`).
  - **Reset queue order** — clears `TaskOrder` → back to stressor rank.
  - **Filter** and **Start** — semantically unchanged; Start builds the queue from the matched **in `TaskOrder` order** (instead of pure stressor rank).
- **Screens & flows**:
  - `SessionFilter` (`SessionFilter.tsx`) becomes two-part: (1) filters (contexts + energy) + match counter — as today; (2) a **matched-tasks list** (text + context/energy/time attribute badges + a drag handle + ↑↓), visible when `matchCount > 0`. A **"Reset to default"** control when a manual order is active. The large **Start** stays.
  - Entry: unchanged (from `process` / Continue → `/focus`). No new nav entry.
- **States** (→ `harden`):
  - Single-element list — reorder disabled/no-op.
  - 0 matches — list hidden, Start disabled (already handled, `SessionFilter.tsx:84-99`).
  - `TaskOrder` write failure — retry toast, no silent layout loss.
  - Reset — confirmation or immediate + undo (to resolve in `harden`).
- **Edge cases** (→ `edgecases`): tasks added after `TaskOrder` is set (where they land); `TaskOrder` points to deleted tasks (prune); `TaskOrder` points to tasks outside the current filter (hidden, positions preserved); reorder with an "all" filter; stable sort for unlisted items.
- **Design**: `SessionFilter` gets a list + drag handles — a new surface on an existing screen → `lofi` (build), then `design`/`polish` (drag UX, badges, rhythm). Respects `DESIGN.md` (if it exists).

### `run` — task list on Details + actions
- **Data**:
  - No new entity. RunDetails reads all tasks (`decompose:tasks`, global — ADR 0020) and their `state`.
  - Actions mutate `Task.state` via `updateTask` (`decompose/hooks/use-tasks.ts`) — the `run` module starts writing to the task store.
- **Actions**:
  - **View run task list** — the list on RunDetails (under the stat tiles).
  - **Mark task done (from details)** — `pending`/`skipped` → `completed`.
  - **Mark task not-relevant (from details)** — → `dismissed` (terminally; counts toward progress, ADR 0017).
- **Screens & flows**:
  - `RunDetails` (`RunDetails.tsx`) gains a **"Tasks"** section between the stats (`:134-137`) and the Continue block (`:139-163`). The task list grouped/labeled by state: **To do** (`pending`/`skipped`/`active`), **Done** (`completed`), **Not relevant** (`dismissed`). Row: text + a state badge + actions (Done / Not relevant; disabled when already in that state). Stats (`RunStatTiles`) recompute live via `useLiveRuns`/`deriveRunStats`.
  - Entry: unchanged (Run card → Details). No new nav entry.
- **States** (→ `harden`):
  - Empty Run (no tasks) — empty-state ("No tasks yet — start with a brain dump").
  - Read/write failure — retry toast (the `StorageStatusToast` pattern, already in `RunDetails.tsx:192`).
  - Dismiss from the list — confirm or undo (to resolve in `harden`).
- **Edge cases** (→ `edgecases`): a task without attributes (unprocessed) — show with an "untagged" label; a done action on an already-done task (no-op/disable); the action's impact on `lastReachedStep`/resume routing; list sorting (default stressor rank / `TaskOrder`?).
- **Design**: a new section on an existing screen → `lofi`, then `design`/`polish`.

## Routing — which proto skill builds what
| Step | Skill | Target | What it does |
|------|-------|--------|--------------|
| 1 | proto-detail | `focus` | spec the filter changes + `TaskOrder` + entries in `ACTIONS`/`ENTITY_MAP`/`GLOSSARY` |
| 2 | proto-detail | `run` | spec the list section + list actions + shared-doc entries |
| 3 | proto-lofi | `focus` | build the matched list + order UI + reset |
| 4 | proto-lofi | `run` | build the "Tasks" section + done/not-relevant actions |
| 5 | proto-edgecases | `focus` | new cases: `TaskOrder` vs added/deleted tasks, sort stability |
| 6 | proto-edgecases | `run` | new cases: empty run, attributeless tasks, impact on resume routing |
| 7 | proto-harden | `focus` | states: single-element list, `TaskOrder` write failure, reset (confirm/undo) |
| 8 | proto-harden | `run` | states: empty-state, storage failure, dismiss (confirm/undo) |
| 9 | (direct edit) | — | see Residual — wiring `TaskOrder` to queue building + task mutations from `run` |
| 10 | proto-design → polish | `focus`, `run` | hi-fi list, drag handles, badges, rhythm (if visual) |
| — | **proto-bug** | `focus` | **Related, separate:** skip-cleanup-on-exit diagnosis (see the Related section) |

## Residual — direct edits not covered by a proto skill
- **[`src/modules/focus/components/FocusView.tsx:190-204` (`start`)]** — today: queue = matched in `attributed` order (stressor rank). change: build the queue in `TaskOrder` order (when it exists), with a default = the current sort. why: the manual order should decide the session order.
- **[`src/modules/focus/components/FocusView.tsx:62` area]** — add `TaskOrder` persistence via `useLocalStorage<string[]>('focus:taskOrder', [])`; a sorting function `orderedTaskIds(tasks, taskOrder, stressorRank)` (mapped by index in `TaskOrder`, the rest by stressor rank at the end). why: one order model shared by the filter list and queue building.
- **[`src/modules/focus/components/SessionFilter.tsx:141-155`]** — add props: `matchedTasks: Task[]` (ordered), `onReorder(ids: string[])`, `onResetOrder()`, `hasManualOrder: boolean`; render the matched list with drag/↑↓ + a "Reset to default" control. why: the order UI on the filter screen.
- **[`src/modules/run/components/RunDetails.tsx:134-163`]** — insert a "Tasks" section: read tasks (the `useTasks` hook from `decompose`), group by `state`, render rows with `onDone`/`onDismiss` actions (`updateTask`). why: the task list + actions on Details.
- **[`src/modules/run/components/RunDetails.tsx:22`]** — add `useTasks()` from `decompose/hooks/use-tasks.ts` (cross-module read+write). why: `run` must read and mutate task states.
- **Verification (non-edit):** `src/modules/run/stats.ts:22-42` (`deriveRunStats`) reads `state` directly — after done/dismiss actions from RunDetails the stats recompute themselves; confirm `RunStatTiles` refreshes live.

## Later (deferred)
- Editing text/attributes and deleting a task from RunDetails.
- "Reopen" (`→ pending`) from RunDetails.
- Separate orders per filter.
- Real per-Run wiring (ADR 0020) for `TaskOrder` and the task list.

## Hand-off
Feature = A (`focus`) + B (`run`). Run in the Routing table's order: first `proto-detail focus` and `proto-detail run` (spec the changes + shared-doc entries), then `lofi`/`edgecases`/`harden`/residual/`design`. In parallel (separately) run `proto-bug focus` for skip-cleanup-on-exit (the Related section) — that's an independent bug. This document is the base the next skills read.
