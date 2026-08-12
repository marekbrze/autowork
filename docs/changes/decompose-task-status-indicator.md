# Feature: Decompose — task status indicator (done / irrelevant)

## Type
Feature (planned by proto-feature)

## User goal
On the **Next actions** screen (`decompose`, the HOW block — where you enter next-actions and break them into tasks) the user wants to **see** that a given task has already been marked **done** (`completed`) or **irrelevant** (`dismissed`) somewhere else. Today every task renders as a bare `–` bullet + text — regardless of state — so returning to `decompose` after a `focus` session or after markings from `run` details looks as if nothing was done. Job-to-be-done: *recognize at a glance what's already handled, without having to remember or click elsewhere*.

## MVP scope
**MUST work:**
- By each task (under a next-action) a status marker when `state === 'completed'` or `state === 'dismissed'` — distinct for done vs irrelevant.
- A progress counter by the next-action: `{resolved}/{total} done` when ≥1 task and ≥1 resolved (where resolved = `completed` + `dismissed`, consistent with `Run.progress`).
- A visual de-emphasis of a next-action whose **all** tasks are resolved (strike-through + muted + possibly a "Resolved" tag).

**Explicitly deferred to "Later":**
- Changing a task's state from the `decompose` screen (read-only; Done/Dismiss stay in `focus`, Mark done/not-relevant — in `run` details).
- Signaling the `skipped` and `active` states (MVP = only `completed` + `dismissed`).
- Hi-fi / arcade styling of the marker (decompose isn't hi-fi yet — ADR 0041; only `focus` 0042 and `run` 0051 are designed). Build neutrally/with tokens; design will pick this up when `decompose` goes through `proto-design`.

## Impact map
- **New module?**: no — extends `decompose`.
- **Modules affected**: **only `decompose`**. The module already produces and stores `Task` (`decompose:tasks:${runId}`, `useTasks`), and `NextActionItem` **already receives full `Task` objects with `state`** (grouping in `HowBlock.tsx:42-50`). The field is in the data — it's just not displayed. **Cross-module: no new integration.** `completed`/`dismissed` are set by `focus` and `run`, but it's the same shared `Task` entity; `decompose` only reads it.
- **Cross-module integration**: none new. Low risk — a pure read of an existing field.
- **Shared-doc additions** (written by `proto-detail decompose`):
  - `ACTIONS.md`: **no new action** (read-only). Optionally a note by the existing `Done`/`Dismiss` actions that the state is now *visible* in `decompose` too.
  - `ENTITY_MAP.md`: **no change** (`Task.state` is already documented: `pending → active → completed | skipped | dismissed`).
  - `GLOSSARY.md`: + `TaskStatusIndicator` (a read-only task-state marker on the action list) and optionally `ResolvedNextAction` (a fully-handled next-action → muted + counter).

## Per-module changes

### decompose
- **Data**: no new fields/entities. Reads the existing `Task.state`.
- **Actions**: none new (read-only). Confirmation: Done/Dismiss in `focus`, Mark done/not-relevant in `run` details — unchanged.
- **Screens & flows**: the HOW block (`NextActionItem`). The task sub-item (today `NextActionItem.tsx:121-130`) gets a status marker; the next-action header (the counter `NextActionItem.tsx:89-96`) gets progress; the whole item — de-emphasis when fully resolved. **One file** (`NextActionItem.tsx`); `HowBlock` already passes full `Task[]` — unchanged.
- **States (display, not data)**: per-task → `done` | `irrelevant` | `neutral` (other). Per-next-action → `none` (0 tasks / 0 resolved) | `partial` | `resolved`.
- **Edge cases** (→ `proto-edgecases` will deepen):
  - A next-action with no tasks ("to break down") — do **not** show a `0/0` counter; leave "to break down".
  - A mix (1 done, 1 pending) — partial: a `1/2 done` counter, no de-emphasis.
  - Re-breaking down (`DecomposeModal`) a next-action with done tasks: `replaceTasksForNextAction` diffs by text (`use-tasks.ts:62-81`) and preserves `state` for tasks whose text is unchanged → the marker survives; text removed in the modal = a deleted task (the state goes with it); the same text added again = a fresh `pending`. The de-emphasis counts live, so it self-corrects.
  - Old/migrated tasks without `state` (or an unknown state) → treat as neutral (guard).
  - `dismissed` ≠ `completed`: a different glyph/label, but **both calm** (DESIGN.md: anti-ref "harsh red alarm"; irrelevant is NOT red).
- **Glossary**: `TaskStatusIndicator`, `ResolvedNextAction` (candidates).
- **Design**: the surface is still neutral (decompose isn't hi-fi). Build on shadcn tokens (`text-muted-foreground`, `line-through`, `opacity-60`), with glyphs: ✓ for done, a neutral one (e.g. `Ban`/`Minus`) + a "not relevant" label for dismissed. **No red alarm, no rainbow** (one accent — DESIGN.md). Hi-fi deferred to `proto-design decompose`.

## Routing — which proto skill builds what
| Step | Skill | Target | What it does |
|------|-------|--------|--------------|
| 1 | proto-detail | decompose | Specify the display (states, marker semantics, counter, de-emphasis, the re-break-down interaction) + GLOSSARY entries. Update `docs/modules/decompose.md`. Light — a thin change. |
| 2 | (direct edit) | — | Implementation in `NextActionItem.tsx`. See residual below — this is the change's core. |
| 3 | proto-edgecases | decompose | Diagnose the new display-edges (0 tasks, mix, re-break-down, missing `state`, a11y). |
| 4 | proto-harden | decompose | Implement the diagnosed states (mainly a11y + the empty/counting counter). |
| 5 | proto-design → polish | decompose | Hi-fi, when decompose goes through design (deferred — neutral today). |

> This is a thin, low-risk, read-only slice. **The core is the residual (a direct edit in `NextActionItem.tsx`).** `proto-detail`/`edgecases`/`harden` are light passes maintaining spec/ADR discipline; you can condense them if you'd rather move faster.

## Residual — direct edits not covered by a proto skill
The change's core — **one file**: `src/modules/decompose/components/NextActionItem.tsx`.

- **[`src/modules/decompose/components/NextActionItem.tsx:2`]** — imports. Today: `import { Check, Scissors, X } from 'lucide-react';`. Add a glyph for dismissed (e.g. `Ban`) — `Check` is already there (reuse for done).
- **[`src/modules/decompose/components/NextActionItem.tsx:44`]** — `const taskCount = tasks.length;`. Add the derived values:
  ```ts
  const resolvedCount = tasks.filter((t) => t.state === 'completed' || t.state === 'dismissed').length;
  const isResolved = tasks.length > 0 && resolvedCount === tasks.length;
  ```
- **[`src/modules/decompose/components/NextActionItem.tsx:89-96`]** — the counter badge. Today it shows `${taskCount} task(s)` or `to break down`. Change to:
  - 0 tasks → `to break down` (unchanged).
  - ≥1 task, 0 resolved → `${taskCount} task(s)` (unchanged).
  - ≥1 resolved → `${resolvedCount}/${taskCount} done`.
- **[`src/modules/decompose/components/NextActionItem.tsx:47-52`]** — the item container (`className={cn('rounded-lg border bg-background px-3 py-2 …', editing && 'border-ring')}`). Add de-emphasis when `isResolved && !editing`: `opacity-60` + a strike-through on the next-action text (`line-through text-muted-foreground`).
- **[`src/modules/decompose/components/NextActionItem.tsx:121-130`]** — the task list `<ul>`. Each `<li>` gets a marker per `t.state`:
  - `completed` → `<Check>` + `line-through text-muted-foreground`, `aria-label="…: done"`.
  - `dismissed` → `<Ban>` (neutral, NOT red) + `line-through text-muted-foreground` + possibly a "not relevant" label, `aria-label="…: not relevant"`.
  - other (`pending`/`active`/`skipped`/none) → the current `–` (neutral).
  - The state conveyed via glyph + text (not color only) — an a11y requirement.

Optionally (if the marker gets long): extract a small `TaskStateBadge` in `src/modules/decompose/components/`, later reusable by the `run` details list. For the MVP — inline in `NextActionItem`, per the module's current style.

## Later (deferred)
- State-change actions from `decompose` (an inline toggle done/irrelevant).
- Signaling `skipped` / `active` on the action list.
- Hi-fi / arcade marker styling (`proto-design decompose`).
- A progress aggregate at the **stressor** level ("3/5 done in this stressor") — today per next-action.

## Hand-off
Run the routing steps in order. **The shortest real path:** `proto-detail decompose` (light, spec the display + GLOSSARY) → the residual edit in `NextActionItem.tsx` → `proto-edgecases` + `proto-harden` (mainly a11y). This document is the base the next skills read.
