# Bug: Creating a new Run shows the same stressors and tasks (no per-Run funnel data)

## Type
Bug (diagnosed by proto-bug)

## Severity
🔴 high — **Not data loss** (single-active-run usage still works), but a **broken primary flow** on the module whose entire reason to exist is multi-run isolation. The Run module's stated value (`docs/modules/run.md:4`: *"Wiele runów żyje równolegle"*, each Run a tangible object with its own stats/tasks) is defeated: creating a fresh Run and immediately seeing the previous Run's stressors/tasks actively misleads the user into believing they started clean when they did not. Deterministic — every time, for every new Run. Confirmed by code reading (structural), not a live run; the cause is deterministic by construction (see Root cause).

## Reproduction
1. Dashboard → click **Start your first run** (or "new run"). `createRun()` runs (`src/modules/run/hooks/use-runs.ts:27`, called from `src/modules/dashboard/components/DashboardView.tsx:53`): a new `Run` record is prepended to `run:runs` (`use-runs.ts:41`) and you are routed to `/capture`.
2. In the first Run, add several stressors (brain dump), break some into next-actions/tasks in `decompose`, optionally process + run a focus session.
3. Go back to the Dashboard, click **new run** again to create a second Run.

**Expected** (per `docs/modules/run.md:12-15` Create Run flow + ENTITY_MAP `Run 1—* Stressor`): the second Run is a **fresh, empty funnel** — a blank brain dump, no stressors, no tasks. Each Run owns its own set of stressors/tasks (`ENTITY_MAP.md:11` `Run ||--o{ Stressor`, `:74` Run *Contains: Stressory*).
**Actual**: the second Run shows **the same stressors** in capture and **the same tasks** in decompose/run-details/focus as the first Run. Editing them mutates the shared set seen by every Run. Every Run card also shows identical progress and identical resume step.
**Reliability**: every time, for every Run, dev and prod. Independent of Run name, order, or data volume — it is structural.
**Location**: the data layer — there is no single buggy screen; the cause is that all funnel screens read **global** stores with no `runId`. The "create" side that fails to isolate: `src/modules/run/hooks/use-runs.ts:27-45` (`createRun` creates a Run record but neither scopes nor resets the funnel). The shared stores it fails to scope: `src/modules/capture/hooks/use-stressors.ts:8`, `src/modules/decompose/hooks/use-tasks.ts:9`, `src/modules/decompose/hooks/use-next-actions.ts:8`, plus reasons/done-visions/focus stores (see Evidence).

## Root cause
**Class**: data / state — **deferred architecture never built**. A documented spec-vs-code drift where the spec states the *intent* (per-Run funnel data) but the code, by design, stores the funnel globally and the spec admits the per-Run scoping is deferred (ADR 0020).

**Cause**: The entire funnel data layer lives in **global localStorage keys with no `runId`**, and there is **no concept of an "active Run"** anywhere in the code. The funnel modules (`capture`, `decompose`, `process`, `focus`) have **zero coupling** to the `run` module (grep `useRuns`/`useLiveRuns`/`@/modules/run` across `src/modules/{capture,decompose,process,focus}` → **0 hits**). So every funnel screen reads the same single shared dataset regardless of which Run the user is in.

When `createRun` runs it does only one thing: prepends a new `Run` object to `run:runs` (`use-runs.ts:41`). It does **not** set any active-Run pointer, and it does **not** clear/scope the funnel stores. The user then lands in `/capture`, where `useStressors()` reads `capture:stressors` — which still holds the previous Run's stressors. The same is true for tasks, next-actions, reasons, done-visions, and the focus filter/session/task-order. Hence "new Run → same stressors and tasks."

The shared/global funnel stores (no `runId` key segment, no `runId` field on entities):

| Store | Key | File:line |
|-------|-----|-----------|
| Runs (the only per-Run store) | `run:runs` | `src/modules/run/hooks/use-runs.ts:8` |
| Stressors | `capture:stressors` | `src/modules/capture/hooks/use-stressors.ts:8` |
| Tasks | `decompose:tasks` | `src/modules/decompose/hooks/use-tasks.ts:9` |
| NextActions | `decompose:nextActions` | `src/modules/decompose/hooks/use-next-actions.ts:8` |
| Reasons | `decompose:reasons` | `src/modules/decompose/hooks/use-reasons.ts:9` |
| DoneVisions | `decompose:doneVisions` | `src/modules/decompose/hooks/use-done-visions.ts:13` |
| Focus filter | `focus:filter` | `src/modules/focus/components/FocusView.tsx:62` |
| Focus session | `focus:session` | `src/modules/focus/components/FocusView.tsx:72` |
| TaskOrder | `focus:taskOrder` | `src/modules/focus/components/FocusView.tsx:77` |

And the entities themselves carry **no `runId`** — only intra-funnel links (`stressorId`, `nextActionId`):
- `Stressor` (`src/modules/capture/types/stressor.ts`) — `{ id, text }`, no runId.
- `NextAction` (`src/modules/decompose/types/next-action.ts`) — `{ id, stressorId, text }`, no runId.
- `Task` (`src/modules/decompose/types/task.ts:31-43`) — `{ id, text, nextActionId, stressorId, state, … }`, no runId.

Two compounding effects make it worse, not better:
1. **No active-Run concept exists at all.** Grep for `activeRun|activeRunId|setActiveRun|currentRun|selectedRun` across `src/` → **0 hits**. The app cannot know which Run the user is working, so even a "switch Run" action has nothing to switch.
2. **The live-stats layer broadcasts the one global dataset onto every Run.** `useLiveRuns` derives a single `stats`/`lastReachedStep` from the global funnel and maps it onto **all** Runs (`src/modules/run/hooks/use-live-runs.ts:35` `deriveRunStats(tasks)` from the global `tasks`; `:49-52` `runsApi.runs.map((r) => ({ ...r, stats, lastReachedStep }))`). So not only do you edit one shared funnel, but every Run card also displays identical progress/resume-step. (This was the fix for the earlier `dashboard-run-stats-disconnected` bug, ADR 0033 — it resolved "0% everywhere" but cemented "same data everywhere.")

This is a **known, explicitly-documented deferral**, not an oversight: ADR 0020 introduced multi-Run as visible objects but deferred per-Run data scoping; `docs/modules/run.md:96` (*"Dane lejka są globalne (bez runId), więc wszystkie Runy dzielą ten sam zestaw; … Odłożone do fazy per-Run (ADR 0020): scope'owanie danych lejka po runId"*), `src/modules/run/types/run.ts:21`, and `src/modules/run/hooks/use-live-runs.ts:19-20` all state it. The prior diagnosis `docs/changes/dashboard-run-stats-disconnected.md:79` already routed *"true per-run data (funnel stores scoped by runId)"* to **proto-feature**, explicitly deferred by ADR 0020. The deployed prototype has now surfaced that deferral as the bug the user is hitting.

**Evidence**:
- `src/modules/run/hooks/use-runs.ts:27-45` — `createRun` only writes a Run record; no active-Run set, no funnel reset/scope. (Caller: `src/modules/dashboard/components/DashboardView.tsx:53`.)
- `src/modules/capture/hooks/use-stressors.ts:8,16` — global `capture:stressors`, read with no runId.
- `src/modules/decompose/hooks/use-tasks.ts:9,26` — global `decompose:tasks`, no runId.
- `src/modules/decompose/hooks/use-next-actions.ts:8` — global `decompose:nextActions`, no runId.
- `src/modules/capture/types/stressor.ts`, `src/modules/decompose/types/next-action.ts`, `src/modules/decompose/types/task.ts:31-43` — entities carry no `runId`.
- `src/modules/run/hooks/use-live-runs.ts:35,49-52` — single global `stats`/`lastReachedStep` mapped onto every Run.
- Grep `activeRun|activeRunId|currentRun|selectedRun` in `src/` → 0 hits (no active-Run concept).
- Grep `useRuns|useLiveRuns|@/modules/run` in `src/modules/{capture,decompose,process,focus}` → 0 hits (funnel never touches Run).
- Grep `runId` in `src/modules/{capture,decompose,focus}` → 0 hits (no entity runId).
- Spec (intent): `docs/modules/run.md:4` (multi-run, each Run tangible), `:12-15` (Create Run → fresh brain dump), `:96` (the deferral note); `docs/ENTITY_MAP.md:11,74` (Run owns Stressors).

## Fix plan
**Direction**: introduce **per-Run funnel-data scoping** + an **active-Run pointer**, so each Run owns its own stressors/tasks/etc. and creating/switching a Run isolates the funnel. This is a multi-module data-model change — **no quick patch hides the symptom without data loss** (clearing the global stores on create would destroy the previous Run's data and still not let you return to it), so the true feature is required.

This is intentionally a *direction*, not a full implementation plan — the comprehensive plan (entities, states, screens, edge cases, migration) is the job of **proto-feature** (see Routing). Sketch so proto-feature has a head start:

1. **Add `runId` to the funnel entities** that are ownable: `Stressor`, `NextAction`, `Task` (cascade — `Reason`/`DoneVision` reference `stressorId`, which becomes per-Run, so they inherit isolation; verify no cross-Run id collision since ids are globally unique).
2. **Introduce an active-Run pointer** — e.g. a global `run:active` value (the active `runId`). Set it in `createRun` and on **Continue**. The funnel hooks then read/write scoped to the active Run.
3. **Scope the stores** — two viable designs for proto-feature to choose:
   - **(A) Key-per-Run**: `capture:stressors:<runId>`, `decompose:tasks:<runId>`, … The hooks take a `runId` and use the right key. Cleanest isolation, trivial cascade-delete on `deleteRun`.
   - **(B) Single global array carrying `runId`, filtered in memory**: hooks return only the active Run's slice. Less migration churn, but `deleteRun` must filter and orphan cleanup is manual.
   Design (A) best matches the user's mental model ("each Run = a separate set").
4. **`createRun` sets the new Run active** → funnel reads empty for the new `runId` → fresh brain dump (fixes the reported symptom directly).
5. **`useLiveRuns` derives stats per-Run** (`deriveRunStats(tasksOfThatRun)`), not one global `stats` mapped onto all (`use-live-runs.ts:35,49-52`).
6. **Cascade delete** in `deleteRun` — remove that Run's funnel data (trivial in design A; filter in design B).
7. **Focus stores per-Run** — `focus:filter`, `focus:session`, `focus:taskOrder` (`FocusView.tsx:62,72,77`) become scoped (the paused session + manual order belong to one Run; `use-live-runs.ts:44` resume logic already reads the session snapshot).
8. **Migration** — a user with data in today's global keys needs it assigned to a Run (e.g. on first load after upgrade, seed the most recent Run, or create one). Decide behavior in proto-feature.

**Spec impact**: large, and *clarifying* (brings code toward already-stated intent). Update the deferral notes that now become true:
- `docs/modules/run.md:96` — replace *"Dane lejka są globalne… odłożone"* with the per-Run reality.
- `src/modules/run/types/run.ts:21`, `src/modules/run/hooks/use-live-runs.ts:19-20` — same deferral comments.
- `docs/ENTITY_MAP.md:46-49` — `TaskOrder` note ("w prototypie globalny… w intencji per-Run") flips to per-Run.
- `docs/changes/dashboard-run-stats-disconnected.md:56,79` — the "multi-run caveat / deferred to proto-feature" is resolved.
- Possibly a new ADR superseding the deferral portion of ADR 0020.

## Regression scope
This change touches **every funnel module and every reader of funnel data**. proto-feature must map all of:
- **Every call to `useStressors()` / `useTasks()` / `useNextActions()` / `useReasons()` / `useDoneVisions()`** must resolve the active `runId`. Sites span: `capture` (brain dump, ranking, pairing), `decompose` (WHY/HOW, task split), `process`, `focus` (filter view, task screen, motivation panel), `run` (`RunDetails` task list via `useLiveRuns`, `RunTaskList`), `dashboard` (`DominantRunCard`, live stats), and `use-live-runs.ts`.
- **`useLiveRuns`** (`src/modules/run/hooks/use-live-runs.ts:30-57`) — switch from one global `stats`/`lastReachedStep` to per-Run derivation; every consumer (`DashboardView`, `RunDetails`, `ArchivedRuns`, `RunCard`) must receive per-Run values.
- **`createRun` / `deleteRun` / Continue** (`src/modules/run/hooks/use-runs.ts:27,77`, `DashboardView.tsx:53`, resume routing) — set/clear active-Run; cascade delete.
- **Focus stores** (`FocusView.tsx:62,72,77`) — per-Run filter/session/taskOrder; the resume-from-snapshot logic (`use-live-runs.ts:44`) must read the active Run's session.
- **Scenarios / mock data** (`src/scenarios/data/{capture,decompose,run}.ts`, `src/scenarios/{minimal,full,focus}.ts`, `loader.ts`) — must attach `runId`; today they inject into the global keys.
- **Storybook fixtures** (`*.stories.tsx` in run/capture/decompose/focus) — mounting real hooks will now need an active Run.
- **Existing localStorage migration** — in-production users have global data; define assignment-to-Run behavior to avoid surprise data loss/appearance.
- **Related edge cases** worth routing to `proto-edgecases` once built: switching Runs mid-funnel (unsaved brain-dump text?); a Run with an in-flight focus session when you switch away and back; per-Run stats recalculation after a `deleteRun`; two Runs and the "dominant card" choice (`ADR 0028`); archive/unarchive affecting the active-Run pointer.

## Routing
| Step | Skill / action | Target | What |
|------|----------------|--------|------|
| 1 | **proto-feature** | `run` (+ multi-module: capture/decompose/process/focus) | Plan per-Run funnel-data scoping + active-Run pointer end-to-end (entities, stores, create/continue/delete, stats, migration, edge cases, spec). proto-bug's diagnosis above is the input; proto-feature produces the plan the build skills act on. |
| 2 | (after plan) | proto-edgecases / proto-harden / proto-lofi per proto-feature's routing | Implement the per-Run behavior, its states, and the migration. |

**Why proto-feature and not a direct edit / harden / polish:** this is a multi-module data-model change (new `runId` on entities, an active-Run mechanism, store re-scoping, migration), not a missing UI state (harden), a visual defect (polish), or a one-line logic fix (direct edit). The project's own prior diagnosis (`dashboard-run-stats-disconnected.md:79`) already routed exactly this to proto-feature as "explicitly deferred by ADR 0020." proto-bug diagnoses and routes; it does not build.

## Hand-off
Run **`proto-feature run`** (multi-module: capture/decompose/process/focus) to plan the per-Run funnel-data scoping, using this diagnosis as the base. The feature must, at minimum, deliver: a new Run starts with an empty funnel (the reported symptom), switching/continuing a Run isolates its data, and per-Run stats reflect only that Run. There is no smaller safe interim — confirm with the user they want the real per-Run feature (they do — *"każdy run to powinien być oddzielny zestaw zadań i stresorów"*) before proto-feature fans out.
