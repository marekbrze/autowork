# Feature: Total estimated task time (Run + dashboard + focus filter)

## Type
Feature (planned by proto-feature)

## User goal
The user wants to see the **total estimated time** (the sum of `EstimatedTime`) of a Run's tasks — to judge at a glance "how big this pass is" (e.g. ~2h of work). They want it **on the dashboard** (motivation/commitment before starting work) and **in the focus session filter** — so seeing "3 matching tasks" they immediately know how long a work block they're signing up for (~1h 15m) before clicking Start.

## MVP scope
**MUST work:**
- A new live-derived Run stat: `estimatedTotalMin` (sum of `EstimatedTime` over **estimated** tasks) and `estimatedRemainingMin` (sum over estimated **not-done** tasks, i.e. state ∉ `completed`/`dismissed`). Source: `deriveRunStats` in `run/stats.ts` — one source of truth, like today's `timeSpentSec`.
- A shared helper formatting minutes → "2h 35m" / "45m" (`formatMinutes`), with no cross-module coupling (outside the `run` module).
- **TOTAL display** on 3 surfaces:
  1. **Dashboard — dominant card** (`DominantRunCard`): add a "~2h estimated" segment to the progress breakdown line.
  2. **Run Details** (`RunStatTiles`): a new 4th "estimated" tile (total) + a "~45m left" sub-line (remaining).
  3. **Focus filter** (`SessionFilter`): extend the match field "3 tasks match" → "3 tasks · ~1h 15m".
- Empty / no-estimate handling: when a Run/filter has no `EstimatedTime` at all, do NOT show a misleading "0m" — omit the segment or show "—" (→ `proto-harden`).

**Deferred to "Later":**
- A prominent "remaining" on the dominant card (the MVP shows remaining only as a sub-line on Details).
- Total estimate on Run **mini-cards** (`RunCard`) and the **archive** list.
- An "estimate vs actual time" framing (e.g. "~2h estimated · 1h 30m in focus" as a motivator; under-/over-completion).

## Impact map
- **New module?**: no — extends 3 existing ones (`run`, `dashboard`, `focus`).
- **Modules affected**:
  - `run` — **the aggregate owner**: new `RunStats` fields + a function in `stats.ts` + a new tile in `RunStatTiles`. The contract lives here.
  - `dashboard` — consumer: the total-estimate segment in `DominantRunCard`.
  - `focus` — consumer: a time counter for matched tasks in `SessionFilter` (+ plumbing in `FocusView`).
- **Cross-module integration**: **low risk**. This is a new value derived from the existing `Task.estimatedTime` field (already exists, a preset in minutes, nullable) via the existing `deriveRunStats`. `useLiveRuns` already distributes `stats` to every Run card and Details today → the new fields flow automatically. Focus computes its subset locally (it already has `matchedTasks`). **No new entity relation** — only a new aggregate.
- **Shared-doc additions**:
  - `ENTITY_MAP.md`: add `estimatedTotalMin` / `estimatedRemainingMin` to `Run`'s attributes/stats (derived live from `Task.estimatedTime`).
  - `GLOSSARY.md`: new term "Total estimated time" → `EstimatedTotal` (sum of estimates over estimated tasks; live) and "Remaining estimated time" → `EstimatedRemaining`. Avoid "time spent" (= `timeSpent`).
  - `ACTIONS.md`: **unchanged** — this is a passive read/display, not a new user action.

## Per-module changes

### run (aggregate owner)
- **Data**:
  - `RunStats` (`src/modules/run/types/run.ts:23-32`) +2 fields: `estimatedTotalMin: number`, `estimatedRemainingMin: number` (minutes).
  - `deriveRunStats` (`src/modules/run/stats.ts:22-42`) computes both: sums `t.estimatedTime` (when `!= null`); remaining skips `completed`/`dismissed`. `skipped`/`pending`/`active` count toward remaining (still to do).
  - A new helper `formatMinutes(totalMinutes)` → "2h 35m" / "45m" / "0m". **Location to resolve in `proto-detail`**: recommendation = `src/shared/format.ts` (a new shared file), so `focus`/`dashboard` use it without importing from inside `run` (preserve the dependency direction: the funnel doesn't depend on the `run` module). Alternative: re-use `formatDuration(min*60)` from `run/types/run.ts`, but that requires importing from `run` and yields an "s" suffix for <1min (irrelevant for 5+ presets, less clean).
- **Actions**: none (passive display).
- **Screens & flows**: `RunStatTiles` (`src/modules/run/components/RunStatTiles.tsx:18`) — grid `grid-cols-3` → `grid-cols-4` (or 2×2), a new "estimated" tile = `formatMinutes(estimatedTotalMin)`; under the grid a "~X left estimated" sub-line = `estimatedRemainingMin`.
- **States**:
  - **No estimates** (`estimatedTotalMin === 0`): the tile shows "—" / "no estimate" instead of "0m"; the remaining sub-line omitted.
  - **Run with no tasks** (`totalTasks === 0`): as today (the estimated tile also "—"; the dominant card already has "No tasks yet").
- **Edge cases** (→ `proto-edgecases`/`harden`):
  - **Mixed** (some tasks estimated, some without attributes): total covers only the estimated ones — the wording should imply a subset ("~2h estimated" implies "of the ones that have an estimate").
  - **0 estimated, but >0 tasks** (everything unprocessed): "—" / "no estimate" — don't confuse with an empty Run.
  - **Remaining = 0** (everything done/dismissed): a "~0m left" sub-line → rather hide it (the run is completed/celebratory anyway).
- **Design**: a new tile in `RunStatTiles` + a segment in the dominant card. `DESIGN.md` exists (ADR 0041/0051 — hi-fi surfaces) → a light `proto-design`/`proto-polish` touch, keep tabular-nums and the style of the existing tiles.

### dashboard (consumer)
- **Data**: reads `run.stats.estimatedTotalMin` (already distributed by `useLiveRuns`).
- **Screens & flows**: `DominantRunCard` (`src/modules/dashboard/components/DominantRunCard.tsx:87-93`) — add a "· ~2h estimated" segment to the "X of Y done · N left · {time} in focus" line. When `estimatedTotalMin === 0` → segment omitted (the line as today).
- **Edge cases**: 0 estimates → omit the segment (don't break the existing line). Mini-cards (`RunCard`) and the archive = **Later**.
- **Design**: one text segment on an already hi-fi card → `proto-polish` (tone/composition consistency).

### focus (consumer)
- **Data**: a local sum in `FocusView` — `matchedTasks.reduce((s,t) => s + (t.estimatedTime ?? 0), 0)`. `matchedTasks` **always** have `estimatedTime` (the `attributed` filter requires it, `FocusView.tsx:94-106`), so no null-edge.
- **Screens & flows**: `SessionFilter` (`src/modules/focus/components/SessionFilter.tsx:13-31, 153-163`) — a new prop `matchedEstimateMin: number`; the match field "{n} tasks match" → "{n} tasks · ~1h 15m". `FocusView` (`FocusView.tsx:147`, passing the prop ~`:451`) computes the memo and passes it.
- **States**: `matchCount === 0` → the field already shows "No tasks match" (no time). `matchCount > 0` ⇒ estimate > 0 always.
- **Edge cases**: none new (the subset is always estimated). `Nothing left / All done` (resolvedAttributed) → a separate empty-state without time.
- **Design**: an extension of the existing `bg-muted/30` field → `proto-polish`.

## Routing — which proto skill builds what
| Step | Skill | Target | What it does |
|------|-------|--------|--------------|
| 1 | `proto-detail run` | run | Spec the new `RunStats` fields, the `formatMinutes` location, the total/remaining semantics + the "no estimate" state; add `ENTITY_MAP.md` / `GLOSSARY.md` entries. Note that `dashboard`/`focus` consume. |
| 2 | (direct edit — residual) | run / dashboard / focus | Build the 3 displays + the aggregate + the helper (list below). |
| 3 | `proto-edgecases run` | run | Diagnose the display-edges (mixed / 0 estimated / remaining=0) once the tiles exist. |
| 4 | `proto-harden run` | run | Implement the "—"/segment-omission states when there are no estimates. |
| 5 | `proto-design run` → `proto-polish run` (+ dashboard/focus) | run / dashboard / focus | Keep the new surface hi-fi (`DESIGN.md`). Optional if residual leaves slack. |

**Sequence:** `proto-detail run` → residual (build) → `proto-edgecases run` → `proto-harden run` → `proto-design`/`proto-polish`.

## Residual — direct edits not covered by a proto skill
- **[`src/modules/run/types/run.ts:23-32`]** — now: `RunStats { timeSpentSec, doneCount, dismissedCount, totalTasks }`. change to: add `estimatedTotalMin: number` and `estimatedRemainingMin: number` (minutes). why: the aggregate contract.
- **[`src/modules/run/stats.ts:22-42`]** — now: a loop computes `doneCount`/`dismissedCount`/`timeSpentSec`. change to: in the same loop accumulate `estimatedTotalMin += t.estimatedTime` (when `!= null`) and `estimatedRemainingMin` (when state ∉ `completed`/`dismissed`); return them in the object. why: one source, flows through `useLiveRuns`.
- **[`src/modules/shared/format.ts` (new)]** / or `src/lib/utils.ts` — now: none. change to: add `formatMinutes(totalMinutes): string` ("2h 35m"/"45m"/"0m"). why: a shared helper, avoids focus→run coupling. (Final location to resolve in detail.)
- **[`src/modules/run/components/RunStatTiles.tsx:18-56`]** — now: a `grid-cols-3` grid (in focus / done / progress). change to: `grid-cols-4` (or 2×2) + an "estimated" tile = `formatMinutes(stats.estimatedTotalMin)`; a "~{formatMinutes(estimatedRemainingMin)} left estimated" sub-line (when >0). When `estimatedTotalMin === 0` → tile "—". why: the Run stats home.
- **[`src/modules/dashboard/components/DominantRunCard.tsx:87-93`]** — now: "{done} of {total} done · {remaining} left · {time} in focus". change to: append "· ~{formatMinutes(stats.estimatedTotalMin)} estimated" (when `> 0`). why: a runway motivator (the user's goal).
- **[`src/modules/focus/components/FocusView.tsx:147` and `~451`]** — now: `matchCount = matchedTasks.length`; passes `matchCount` to `<SessionFilter>`. change to: add `const matchedEstimateMin = useMemo(() => matchedTasks.reduce((s,t)=>s+(t.estimatedTime??0),0), [matchedTasks])`; pass `matchedEstimateMin`. why: the subset is always estimated.
- **[`src/modules/focus/components/SessionFilter.tsx:13-31, 153-163`]** — now: prop `matchCount`; field "{n} tasks match the filter". change to: add prop `matchedEstimateMin`; "{n} tasks · ~{formatMinutes(matchedEstimateMin)}". why: a session-length decision before Start.

## Later (deferred)
- A prominent "remaining estimate" on the dominant card (MVP: only a sub-line on Details).
- Total estimate on `RunCard` **mini-cards** and the **archive** list (`ArchivedRuns`).
- An estimate-vs-actual framing (under-/over-completion, a post-session motivator) — possibly also in `SessionSummary`.

## Hand-off
Run in order: **`proto-detail run`** (spec the `RunStats` fields + `formatMinutes` + total/remaining semantics + shared-doc entries) → **residual direct-edits** (build the aggregate + 3 displays) → **`proto-edgecases run`** → **`proto-harden run`** (the no-estimate states) → optionally **`proto-design`/`proto-polish`**. The plan is the base those skills read.
