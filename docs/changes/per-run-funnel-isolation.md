# Feature: Per-Run funnel isolation (each Run owns its own stressors/tasks)

## Type
Feature (planned by proto-feature)

## User goal
Each Run should be **a separate set of stressors and tasks** — creating a new Run, the user starts from an empty brain dump, not from the previous Run's data. Switching between Runs (via Continue) shows the right set. *(Reported as a bug in `docs/changes/runs-share-funnel-data.md`; diagnosed as a deferred architecture — ADR 0020.)*

## MVP scope
**MUST** (full funnel isolation, confirmed with the user):
- Each Run owns its own: stressors, next-actions, tasks, reasons, done-visions, focus session + task-order.
- The "active Run" — whose funnel is visible in capture/decompose/process/focus — is set by **Create Run** and **Continue** (via the dashboard, with no new UI).
- A new Run = an empty funnel (resolves the reported bug directly).
- Per-Run stats (each Run card shows only its own progress).
- Cascading deletion (`deleteRun` cleans that Run's funnel data).
- Migration of existing global data → seeded into the newest Run (if none — create one "first run").

**DEFERRED → Later**:
- A Run switcher in the header/shell (the user chose a dashboard-driven model).
- Run comparison (already out of MVP scope, ADR 0027).
- Run export/sharing.

## Impact map
- **New module?**: **no** — extends `run` (container + lifecycle) and re-scopes the data layer of the funnel modules. The active-Run concept lives in `run` (or shared).
- **Modules affected**: **all 6** — `run` (active Run, per-Run stats, cascading delete, header chip), `capture` (per-Run stressors), `decompose` (per-Run tasks/nextActions/reasons/doneVisions), `process` (reads tasks — inherits), `focus` (per-Run filter/session/taskOrder), `dashboard` (Create/Continue sets the active Run; dominant card with real per-Run data).
- **Cross-module integration** (risk #1): until now the funnel modules had **zero coupling** with `run` (grep `@/modules/run` in capture/decompose/process/focus → 0 hits). This feature **reverses that** — the funnel must know which Run is active (via context). This is the plan's biggest risk: every funnel data reader must get per-Run values, or isolation won't work.
- **Shared-doc additions**: `ACTIONS.md` (Create/Continue now also "set active Run"), `ENTITY_MAP.md` (the `Run ||--o{ Stressor/Task` relation becomes real; dotted "hosts" → solid; `TaskOrder` "global" → "per-Run"; a new `activeRunId` value), `GLOSSARY.md` (the **Active Run** term).

## Per-module changes

### run (primary)
- **Data**: a new global pointer `activeRunId` (`run:active` in localStorage). `deleteRun` (`use-runs.ts:77`) gets cascading deletion of that Run's funnel data.
- **Actions**: **Create Run** and **Continue** additionally **set the active Run** (today they don't: `DashboardView.tsx:53-56` creates+navigates, `:59` only navigates). No new user action — the switch is implied by Create/Continue.
- **Screens & flows**: the active-Run chip in the header (`AppShell.tsx:41` — slot already reserved, unassigned today) wired to real state. The rest of the Run screens unchanged structurally.
- **States**: no active Run (fresh app / active deleted) — a guard on the funnel screens; a migration toast on first load after upgrade.
- **Edge cases**: the active Run deleted/archived mid-funnel; dominant-card selection (ADR 0028 `lastActiveAt`) with real per-Run data; migrate when zero Runs exist.
- **Design**: the active-Run chip — a small new surface in the existing shell; respects `DESIGN.md`.

### capture
- **Data**: `Stressor` gets `runId` (`src/modules/capture/types/stressor.ts`). `useStressors` (`use-stressors.ts:8,16`) scopes by `activeRunId`.
- **Actions**: no action changes; mutations (add/update/delete/reorder) operate within the active Run.
- **Edge cases**: unsaved brain-dump text on a Run switch (loss?).

### decompose
- **Data**: `runId` on `NextAction` (`next-action.ts`), `Task` (`task.ts:31`), `Reason` (`reason.ts`); `DoneVision` namespaced per-Run. `useTasks`/`useNextActions`/`useReasons`/`useDoneVisions` (`use-tasks.ts:9,26`, `use-next-actions.ts:8`, `use-reasons.ts:9`, `use-done-visions.ts:13`) scoped by `activeRunId`; `bareTask` (`use-tasks.ts:11`) stamps `runId`.
- **Edge cases**: reasons/doneVisions isolated correctly (keys by stressorId are globally unique, but the hook must return only the active Run's entries).

### process
- **Data**: reads tasks from `decompose` — inherits per-Run isolation with no store changes of its own. Verify that `ProcessView` reads through the scoped hook.

### focus
- **Data**: `focus:filter`, `focus:session` (`SessionSnapshot = {queue, cursor}`, `focus/types/focus.ts`), `focus:taskOrder` (`FocusView.tsx:62,72,77`) become per-Run (the active Run). A paused session belongs to its Run; Continue-resume reads the right snapshot.
- **Edge cases**: Run A's paused session when switching to Run B and back — must resume the right one.

### dashboard
- **Data**: the dominant card + "Other active" show real per-Run stats (today one global value mapped to all — `use-live-runs.ts:35,49-52`).
- **Actions**: Create/Continue set the active Run before navigating.
- **Edge cases**: dominant selection (ADR 0028) with multiple Runs of real data.

## Routing — which proto skill builds what
| Step | Skill | Target | What it does |
|------|-------|--------|--------------|
| 0 | **(direct edit — residual)** | data layer, cross-module | the foundation: `runId` on entities, re-scope hooks, a `run:active` store + context, per-Run stats, cascading delete, migration. **An inversion of the usual order** — this feature is data-layer-led, not screen-led; everything depends on this foundation. |
| 1 | proto-detail | `run` (+ lightly capture/decompose/focus) | spec the Active Run concept, per-Run ownership, cascading delete; write into `ACTIONS`/`ENTITY_MAP`/`GLOSSARY`; refresh the "global data" notes in the module specs. |
| 2 | proto-lofi | `run` (cross-module aware) | wire the active-Run chip in the header to real state; ensure Create/Continue set the active Run (parts visible). |
| 3 | proto-edgecases | `run` (+ capture/decompose/focus) | diagnose the new states: mid-funnel switch, session across switches, migration, post-delete orphans, dominant card, no-active-Run guard. |
| 4 | proto-harden | `run` | implement the states from edgecases (no-active-run guard, migration toast, redirect after deleting the active). |
| 5 | proto-design → polish | `run` | hi-fi active-Run chip (a small new surface in the shell). |

## Residual — direct edits not covered by a proto skill
The data-layer foundation (step 0) — no proto-skill covers this; it's pure logic/data plumbing:

- **[entity types]** add `runId: string` to: `Stressor` (`src/modules/capture/types/stressor.ts`), `NextAction` (`src/modules/decompose/types/next-action.ts`), `Task` (`src/modules/decompose/types/task.ts:31`), `Reason` (`src/modules/decompose/types/reason.ts`). **Why**: the lack of `runId` is the root cause of the bug (`runs-share-funnel-data.md`); entities must know who they belong to.
- **[active-run store + hook]** a new key `run:active` (`activeRunId | null`) + `useActiveRun()` (`src/modules/run/hooks/`) + an `ActiveRunProvider` at the root (`src/App.tsx`). **Why**: today there's no concept of an active Run (grep → 0 hits); the funnel must know which Run it's working on. The funnel routing (`App.tsx`) has no `runId` in the URL → the active Run must live in state.
- **[re-scope the funnel hooks]** `useStressors` (`use-stressors.ts:8,16`), `useTasks` (`use-tasks.ts:9,26,11`), `useNextActions` (`use-next-actions.ts:8`), `useReasons` (`use-reasons.ts:9`), `useDoneVisions` (`use-done-visions.ts:13`) — read `activeRunId` and return/mutate only the active Run's slice. **Design decision (mine)**: **Design B** — `runId` on entities + in-memory filtering by `activeRunId` inside the hook (consumers don't change call sites). **Why B not A (key-per-run)**: `useLocalStorage` reads the key once on mount (`use-local-storage.ts:24-34`, `initRef`) — a dynamic key on switch would require extending the hook/remounting; Design B is reactive with no storage changes. Trade-off: global arrays hold all Runs (localStorage grows), delete filters — acceptable for a prototype. Design A (key-per-run, harder isolation, trivial delete) is an alternative if the team prefers.
- **[focus per-Run]** `focus:filter` / `focus:session` / `focus:taskOrder` (`FocusView.tsx:62,72,77`) scoped by the active Run. **Why**: a paused session and a manual order belong to one Run (`TaskOrder` "per-Run in intent", ADR 0036/`ENTITY_MAP.md:49`); today global.
- **[Create/Continue set active]** `handleStartNew` (`DashboardView.tsx:53-56`) → `setActiveRun(run.id)` before navigating; `continueRun` (`:59`) and Continue in `RunCard`/`RunDetails` → `setActiveRun(run.id)` before navigating. **Why**: this is the only way into a specific Run's funnel (the dashboard-driven model, confirmed with the user).
- **[per-Run stats]** `useLiveRuns` (`use-live-runs.ts:35,49-52`) — instead of mapping one global `stats`/`lastReachedStep` to all Runs, group tasks by `runId` and derive per-Run (`deriveRunStats` from that Run's tasks). **Why**: today every card shows identical progress (a side effect of the ADR 0033 fix).
- **[cascading delete]** `deleteRun` (`use-runs.ts:77`) — after removing the Run, delete its stressors/tasks/nextActions/reasons/doneVisions/focus-data (in Design B: filter the global arrays; remove that Run's focus keys). **Why**: otherwise the data is orphaned and pollutes localStorage.
- **[migration]** on first load after upgrade — if old global keys exist without `runId`, seed them into the newest existing Run (or create one "first run" and set it active). Prod is locked to the 'empty' scenario (`loader.ts:31`), so migration mainly affects dev/local localStorage — but the logic must exist. **Why**: the user (answer 3) wants to keep their current data, not start from scratch.
- **[scenarios]** `src/scenarios/data/{capture,decompose,run}.ts` + `scenarios/{minimal,full,focus}.ts` — attach `runId` (the scenario creates a Run + sets it active) so the mock data fits the new model.

## Later (deferred)
- An active-Run switcher in the shell (a header dropdown) — the user chose a dashboard-driven model.
- Run comparison (ADR 0027, already out of MVP scope).
- Run export/sharing.

## Hand-off
**Step 0 (residual — the data layer) goes first** — it's the foundation the rest depends on; this feature is data-layer-led. After it: `proto-detail run` (spec the concept + shared-doc), then `proto-lofi run` (chip + Continue/Create wiring), `proto-edgecases run`, `proto-harden run`, `proto-design/polish run`. Technical decision (mine): Design B (`runId` on entities + filtering), because it works with the existing `useLocalStorage` without changes. The document is the base the next skills read.
