# Bug: Dashboard shows 0% / „No tasks yet" for a run that has tasks

## Type
Bug (diagnosed by proto-bug)

## Severity
🔴 high — The Dashboard is the app's entry screen and its stated core value is **momentum by progress** (ADR 0026: „motywacja = głównie momentum progresem"). For a real run with stressors and tasks, the dominant card renders **0%** and **„No tasks yet — start with a brain dump"**, and **Continue** always routes back to brain dump — i.e. the screen's two primary promises (progress + one-click resume) are both non-functional in production. Not data loss (the funnel data is intact and correct), but a **broken primary flow on the entry screen** that actively misleads the user.

## Reproduction
1. Deploy (or `npm run dev`), land on the Dashboard, click **Start your first run** → a Run is created (`use-runs.ts:27`, `stats = {0,0,0,0}`, `lastReachedStep = 'brain-dump'`) and you are routed to `/capture`.
2. Add several stressors, break them into next-actions/tasks in `decompose`, optionally process + run a focus session (complete/dismiss a few).
3. Navigate back to the Dashboard.

**Expected**: the dominant run card shows real progress — a non-zero `%`, „X of Y done", and the tasks you completed (per `docs/modules/dashboard.md` §Vision / §Screens *„progres na pierwszym planie — pasek + X z Y zrobione + %"*; `runProgress` formula `run.ts:76`).
**Actual**: the dominant card shows **0%** and **„No tasks yet — start with a brain dump"**; clicking **Continue** sends you to `/capture` (brain dump) no matter how far you actually got.
**Reliability**: every time, for every run, dev and prod. Independent of how much data the run actually has.
**Location**: display read at `src/modules/dashboard/components/DominantRunCard.tsx:74,81,88` (reads `run.stats.doneCount` / `run.stats.totalTasks`); resume decision at `src/modules/dashboard/components/DashboardView.tsx:79` (`continueRun(dominant.lastReachedStep)`). Both fields are stale by construction — see root cause.

## Root cause
**Class**: data / state — **deferred cross-module integration never wired** (spec-vs-code drift: the spec *promises* live run stats but also *explicitly defers* the wiring).

**Cause**: The `Run` object carries `stats` (`totalTasks`, `doneCount`, `dismissedCount`, `timeSpentSec`) and `lastReachedStep`/`lastActiveAt`, but **no production code path ever writes real values into them after creation**. `createRun` initialises them to zeros / `'brain-dump'` / `now` (`use-runs.ts:34-39`) and they are never updated. The funnel modules store their data in **separate, global** localStorage keys with **zero coupling** to the run module:

- `capture:stressors` (`capture/hooks/use-stressors.ts:8`)
- `decompose:tasks`, `decompose:nextActions`, `decompose:reasons`, `decompose:doneVisions` (`decompose/hooks/use-tasks.ts:9`, …)
- `focus:filter`, `focus:session` (`focus/components/FocusView.tsx:62,70`)

A grep for `useRuns` / `Run` across `capture` / `decompose` / `process` / `focus` returns **no hits** — the funnel does not know runs exist. The only writes to `run.stats` / `lastReachedStep` / `lastActiveAt` in the whole codebase are `createRun` (zeros) and Storybook/scenario mocks (`scenarios/data/run.ts`). The Dashboard reads the frozen `run.stats`, so it renders the initial zeros forever.

Crucially, the **data needed to compute progress already exists** in `decompose:tasks`: each `Task` carries a `state` (`'pending' | 'active' | 'completed' | 'skipped' | 'dismissed'`, `decompose/types/task.ts:19`) and `updateTask` **persists** focus transitions back into the store (`decompose/hooks/use-tasks.ts:28`; focus writes at `FocusView.tsx:219,233,271`). So the integration is feasible today; it was simply never connected. The spec itself flags this as deferred: `docs/modules/run.md:75` and `docs/modules/dashboard.md:69` — *„W prototypie statystyki / lastReachedStep są mockiem (dane lejka globalne)… Realne spięcie per-Run odłożone do fazy integracji (cross-module)."* The deployed app surfaced that deferral as a user-visible bug.

**Counting semantics** (confirmed with the user, matches spec): progress = `(completed + dismissed) / total tasks`, where **total = all Tasks** in `decompose:tasks` (NOT the session-filtered subset — the filter only narrows one focus session, ADR 0013). `completed` + `dismissed` count as done; `skipped` does **not** (reverts to `pending` next session, `FocusView.tsx:271`); `pending`/`active` are not done. `timeSpentSec` ≈ Σ `task.timerElapsed` over completed tasks.

**Evidence**:
- `src/modules/run/hooks/use-runs.ts:34-39` — only write site for `lastReachedStep`/`stats`/`lastActiveAt`; sets them once at creation, never updates.
- `src/modules/run/types/run.ts:18-28` — `RunStats` definition; `run.ts:76-89` — `runProgress`/`runRemaining`/`isRunCompleted` read `run.stats`.
- `src/modules/decompose/hooks/use-tasks.ts:9,28` — `decompose:tasks` store + `updateTask` (where focus persists completion).
- `src/modules/focus/components/FocusView.tsx:219,233,271` — focus writes task state back to the store.
- `src/modules/dashboard/components/DominantRunCard.tsx:74,81,88` — reads frozen `run.stats` → renders 0% / „No tasks yet".
- `src/modules/dashboard/components/DashboardView.tsx:79` — `Continue` uses frozen `lastReachedStep` → always `/capture`.
- Grep `useRuns`/`Run` in `src/modules/{capture,decompose,process,focus}` → 0 hits (no funnel→run coupling).
- Spec (intent): `docs/modules/run.md:75`, `docs/modules/dashboard.md:69` — deferral note; `docs/modules/run.md` §Continue (ADR 0022) and §Vision — the live behaviour expected by the user.

## Fix plan
**Chosen direction** (confirmed with user): **derive progress live** from `decompose:tasks` instead of reading the frozen `run.stats`. This is the minimal change that resolves the reported symptom and matches the user's mental model („ile wszystkich zadań z capture jest zrobionych vs niezrobionych").

**Change**:
1. Add a pure derivation helper, e.g. `deriveRunStats(tasks: Task[]): RunStats` (in `src/modules/run/types/run.ts` or a new `src/modules/run/stats.ts`):
   - `totalTasks = tasks.length`
   - `doneCount = tasks.filter(t => t.state === 'completed' || t.state === 'dismissed').length`
   - `dismissedCount = tasks.filter(t => t.state === 'dismissed').length`
   - `timeSpentSec = Math.round(tasks.filter(t => t.state === 'completed').reduce((s, t) => s + t.timerElapsed, 0))`
2. Where the UI reads runs for **display**, read `useTasks()` alongside `useRuns()` and merge derived stats onto each run before passing to the cards (display-only — do not persist into `run:runs`). Centralise via a small hook, e.g. `useRunWithLiveStats()` / `useRunsLive()`, used by `DashboardView`, `RunDetails`, `ArchivedRuns`. `runProgress`/`runRemaining`/`isRunCompleted` need no change — they read `run.stats`, which is now the merged value.
3. **Related, same root cause** — `lastReachedStep` is also frozen, so **Continue** always routes to `/capture`. Decide in the same fix or scope separately: derive `lastReachedStep` from funnel-data presence per `run.md:17-24` (paused focus session → focus; ≥1 task → focus; next-actions → process; ranked stressors → decompose; stressors → ranking/brain-dump; all done → details).

**Multi-run caveat (honest)**: `decompose:tasks` is global (no `runId`), so in the prototype every run card shows the **same** live progress — acceptable for single-active-run usage; true per-run stats stay deferred (ADR 0020). State this caveat in the UI or a tooltip so the number is not misleading once multiple runs exist.

**Spec impact**: update `docs/modules/run.md:75` and `docs/modules/dashboard.md:69` — the „stats są mockiem / odłożone" note is partially superseded: progress (`totalTasks`/`doneCount`/`timeSpent`) is now **derived live**; only true per-run scoping + `lastReachedStep` auto-advance remain deferred.

## Regression scope
- **Every reader of `run.stats` must receive the merged/derived value** (else it still reads zeros):
  - `src/modules/dashboard/components/DominantRunCard.tsx:74,81,88` (progress bar + breakdown).
  - `src/modules/run/components/RunCard.tsx:45,50` (mini cards — active „Other" list **and** archived list).
  - `src/modules/run/components/RunStatTiles.tsx:20,22,45-46` (Run Details tiles).
  - `src/modules/run/components/RunDetails.tsx` (verify it reads via the new live hook).
- **Progress math stays correct**: `runProgress`/`runRemaining`/`isRunCompleted` (`run.ts:76-89`) — unchanged, but feed them the merged run.
- **Resume routing**: `DashboardView.tsx:79` Continue, plus `App.tsx` `/run` redirect and any other `lastReachedStep` consumers — verify once `lastReachedStep` is derived.
- **Storybook / scenarios**: `scenarios/data/run.ts` injects hand-written stats and bypasses the store — unaffected; but any story mounting `DashboardView` with the real hook will now show derived (global) stats instead of the mock — update fixtures if needed.
- **Related edge cases** (mostly already handled, re-verify): `totalTasks === 0` → „No tasks yet" branch still renders correctly (`DominantRunCard.tsx:81`); `skipped` excluded from done (correct); a run with only `dismissed` tasks shows 100% / „Run complete" + Archive CTA (`isRunCompleted`) — intended. No edge-case cluster found beyond the multi-run caveat above.

## Routing
| Step | Skill / action | Target | What |
|------|----------------|--------|------|
| 1 | (direct edit) | `src/modules/run/types/run.ts` (or new `src/modules/run/stats.ts`) | add `deriveRunStats(tasks)` per the formula above; why: progress data exists in `decompose:tasks`, it is just not aggregated. |
| 2 | (direct edit) | `src/modules/run/hooks/use-runs.ts` (+ `DashboardView`/`RunDetails`/`ArchivedRuns`) | add a live-stats hook merging `useTasks()` onto runs for display; why: UI must read derived, not frozen, stats. |
| 3 | (direct edit) | `src/modules/dashboard/components/DashboardView.tsx:79` (+ `lastReachedStep` derivation) | fix Continue routing; why: same root cause — `lastReachedStep` is also never synced. |
| 4 | (doc) | `docs/modules/run.md:75`, `docs/modules/dashboard.md:69` | update the deferral note: progress is now live-derived; per-run scoping + auto-advance still deferred. |

No `proto-harden` / `proto-polish` fit — this is deferred-integration wiring with no proto skill covering it. If the user later wants **true per-run data** (funnel stores scoped by `runId`), that is `proto-feature` (multi-module), explicitly deferred by ADR 0020.

## Hand-off
Apply step 1 + step 2 (derive + wire live stats into the run-reading layer), then verify the dominant card on the Dashboard shows a non-zero `%` and „X of Y done" for a run that has tasks. Then decide step 3 (Continue routing) in the same pass or as a follow-up — both symptoms share one root cause, so fixing only the progress bar would leave resume broken.
