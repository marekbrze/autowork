# Run

## Vision
A Run is a **visible, statistical object** — not a silent persistence layer. Each Run is one full pass through the funnel (brain dump → celebration), but the user manages it consciously: they see how much time they spent, how many tasks they did, how many are left **and how big the work is (total estimated time)**. **Many runs live in parallel**, launched from the dashboard; each has a name (default date/time), progress, and session history. A Run can be **archived (reversibly)** when you consider it finished, or **deleted permanently**.

**Total estimated time = the size of the work in a pass.** Next to the *spent* time (how much already invested), a Run shows the *estimated* time (how much work sits in it) — the sum of `EstimatedTime` over estimated tasks. It's an aggregate **derived live** from tasks (like `timeSpent`), not persisted separately; it lives in `deriveRunStats` (`run/stats.ts`), so it's a **single source of truth** for `dashboard` (the dominant card), `RunStatTiles` (Details), and `focus` (session filter). (Feature `run-estimated-time-totals`, ADR 0059/0060.)

This departs from the early note "MVP = one hidden active Run" (`MODULES.md`) — the user wants to operate on runs as tangible objects (ADR 0020).

**A Run is also a tangible task list, not just aggregates.** On Details you see all tasks with their real state (to do / done / not relevant) and can **act from the list** — mark done or flag not relevant — without entering a session. This is the first time the `run` module **mutates task states** (cross-module write: `run` → store from `decompose`, ADR 0037). The list is grouped by state and sorted within each group by **the same `TaskOrder`** as the focus queue (ADR 0036). (Feature `session-queue-order-and-run-task-list`, ADR 0035.)

**Each Run has its own funnel.** Stressors, next-actions, tasks, reasons, done-visions, as well as the paused focus session and the manual queue order (`TaskOrder`) belong to a specific Run — creating a new Run, you start from an empty brain dump, not from the previous pass's data. This realizes the *hosts* relation from `MODULES.md` (Core steps live inside a Run), previously only an intention. It's driven by the **active Run** (`activeRunId`) — the Run whose funnel is visible in `capture`/`decompose`/`process`/`focus`; set on **Create** and **Continue** (switch via the Dashboard). (Feature `per-run-funnel-isolation`, ADR 0044.)

**A Run's funnel is freely navigable, and Details actions sit above the list.** The funnel steps (Stressors › Ranking › Actions › Processing › Focus) on the funnel screens are a **clickable stepper** — the user jumps to any step of the active Run, not only via the "Next" button. This reverses the early "guided funnel without breadcrumbs" decision (ADR 0001 / UI-STRATEGY) — superseded by ADR 0048. All steps are clickable (no locking), the current one = no-op; leaving an active focus session requires confirmation (the session pauses and survives for resumption). **On Run Details all actions (Continue, Review, Archive, Delete) sit above the task list** — the list is the longest section, so actions don't land at the very bottom. (Feature `clickable-run-steps-and-details-actions-on-top`, ADR 0047/0048.)

## User Flows

### Create Run (start fresh)
1. User na dashboardzie klika „nowy Run" / „start fresh".
2. Aplikacja tworzy Run (nazwa = data/godzina, stan `in_progress`, `lastReachedStep = brain dump`, `progress = 0`), **ustawia go jako aktywny** (`activeRunId`) i prowadzi do brain dumpa.
3. The user lands in `capture` (brain dump) — **this Run's empty funnel** (each Run has its own data; it doesn't inherit from the previous one), the first funnel step. (`capture` creates the Run implicitly.)

### Continue (resume)
1. On a Run card (active on the dashboard) the user clicks **Continue**. The Run becomes **active** (`activeRunId`) — its funnel is visible in the funnel screens.
2. Smart-routing to the furthest funnel step of **this Run** that has work left (`lastReachedStep` + data state):
   - a focus session is paused → **resume that session** (timer from the saved position);
   - there are ≥1 tasks → **focus** (session filter / start) — attributes don't gate (ADR 0013);
   - no tasks, but there are unprocessed tasks/NextActions → **process**;
   - ranked stressors, but no NextActions → **decompose**;
   - stressors exist, but unranked → **capture / ranking**;
   - no stressors → **capture / brain dump**;
   - everything done → **Details** in the "Run completed" state.
3. The user resumes work without manually picking a step — the app leads.

### Nawigacja po krokach Runa (klikalny stepper)
1. On any funnel screen (Stressors / Ranking / Actions / Processing / Focus) the user sees a clickable 5-step stepper at the top (already displayed, now clickable).
2. Clicks any step → the app navigates to that step's route (`STEP_ROUTE`) for the **active Run**.
3. **Current step**: click = no-op (the user stays).
4. **Leaving an active focus session** (task under the timer, timer running): clicking another step → **ConfirmDialog** "You have an active session — leave?". **Confirm** → the session pauses (the per-Run snapshot survives, resumable via `SessionResumeBanner`), the user lands on the chosen step. **Cancel** → stays in the session.
5. **Jumping to a step with unmet conditions** (e.g. Focus with no tasks, Ranking with <2 stressors) → the screen degrades to its empty state (see edge cases).
6. A jump **does not update `lastReachedStep`** and doesn't change "Continue" routing (Continue is still derived from funnel data, not from the last jump) — it's a direct jump, not "progress".

### View Details / Stats (Details)
1. The user clicks **Details** on the Run card.
2. Sees the stats screen: **time spent** (total from focus — sum of `timerElapsed`), **done** (`completed + dismissed`), **left** (remaining), **progress %**, and **total estimated time** (sum of `EstimatedTime` — the size of the work; `EstimatedTotal`) as a separate tile + a sub-line of **remaining estimate** (`EstimatedRemaining` — roughly how much is left).
3. **Above the task list — an actions block**: **Continue** (or the "completed" state) + **Review / Archive (or Un-archive) / Delete**. (Rename inline in the header, always at the top.)
4. **Below, the "Tasks" section** — a list of all tasks with their real state (see the "Working with the task list" flow); at the bottom of the page, so actions don't require scrolling.

### Working with the task list (from Details)
1. On Details the user sees the **"Tasks"** section (under the stat tiles, above the Continue block): all tasks grouped by state — **To do** (`pending`/`skipped`/`active`), **Done** (`completed`), **Not relevant** (`dismissed`); within a group sorted by `TaskOrder` (default = stressor rank).
2. Each row: the task text + a state badge (+ an "untagged" label when it has no attributes) + actions.
3. **Mark done** (`pending`/`skipped`/`active` → `completed`) albo **Mark not-relevant** (→ `dismissed`, terminalnie; undo; liczy do progresem, ADR 0017) — prosto z listy.
4. The stats (`RunStatTiles`) and the resume step recompute live (`deriveRunStats` reads `state` directly).
5. A **reset order** is available — the same `TaskOrder` as in the focus filter (ADR 0036).

### Review (manual)
1. On Details the user clicks **Review**.
2. Walks through stressors / tasks and marks each: **relevant** (still applies) or **stale** (outdated / to remove).
3. Stale items are cleaned up. Review does **not** run automatically on resume (ADR 0023).

### Rename Run
1. On Details → Rename → edits the name (default date/time).

### Archive / Un-archive
1. On Details the user clicks **Archive** → the Run disappears from active, lands in the **archive (history)** on the dashboard. If it was the active Run — **the active Run is cleared** and the user returns to the Dashboard (archive = "done with this Run").
2. Stats and comparison remain visible in the archive.
3. From the archive you can **Un-archive** → the Run returns to active and can be Continued again. Reversible (ADR 0021).

### Delete Run
1. The user clicks **Delete** → the Run is permanently removed (from history/archive too) **along with its entire funnel** (stressors, next-actions, tasks, reasons, done-visions, focus data — cascading). The only terminal operation. If it was the active Run — **the active Run is cleared**, the user returns to the Dashboard.

## Screens (rough)
- **Run Details (Details)**: stats on top (time spent · done/left · progress % · **total estimate** as a 4th tile, with a **remaining estimate** sub-line) + the Run name (inline-editable) + state (active / completed) + progress bar; **an actions block above the list: Continue (or the "completed" / celebration state) + Review / Archive (or Un-archive when archived) / Delete**; **the "Tasks" section at the bottom** (task list grouped by state: To do / Done / Not relevant; sorted within a group by `TaskOrder`; row = text + state badge + done/not-relevant actions). When everything is done — the "completed" / celebration state (CTA above the list).
- **Archived Runs (history)**: on the dashboard; a list of archived runs with their stats, for comparison and motivation; an Un-archive action.
- **Dashboard run card** (owner: `dashboard`): a card for the active Run with mini-stats and two actions — **Continue** + **Details**.

## Actions

| Action | Description | Entity | Notes |
|--------|-------------|--------|-------|
| Create Run | Nowy przejazd lejka z dashboardu; nazwa = data/godzina. | `Run` | `capture` tworzy Run implicite; **ustawia aktywny Run (`activeRunId`), pusty lejek**. ADR 0020, 0044. |
| Continue (resume) | Smart-routing to the furthest step with work left. | `Run` | Card on the dashboard; **sets the active Run**; attributes don't gate (ADR 0013). ADR 0022, 0044. |
| Navigate to funnel step | Jump to any step of the active Run via the clickable stepper (Stressors / Ranking / Actions / Processing / Focus). | `Run` (`FunnelStep`) | Current = no-op; leaving an active focus session → ConfirmDialog (pause + persist snapshot, resumable). Doesn't change `lastReachedStep` (Continue still per data). Supersedes ADR 0001; ADR 0048. |
| View Details / Stats | Stats screen + management. | `Run` | Time spent = sum from focus; done = `completed + dismissed`. |
| View run task list | See all tasks with real state on Details (grouped, sorted by `TaskOrder`). | `Task` | `run` reads tasks cross-module (store `decompose`); ADR 0036/0037. |
| Mark task done (from details) | `pending`/`skipped`/`active` → `completed` z listy. | `Task` | `run` mutuje stan taska (pierwszy raz, ADR 0037); liczy do progresem. |
| Mark task not-relevant (from details) | → `dismissed` z listy. | `Task` | Terminalnie; undo; liczy do progresem (ADR 0017). |
| Rename Run | Edit the name. | `Run` | From Details. |
| Review | Review: relevant vs stale. | `Run` (`Stressor`/`Task`) | **Manual only**; not on resume. ADR 0023. |
| Archive Run | Move to the archive (history). | `Run` | Manual; reversible. ADR 0021. |
| Un-archive Run | Restore to active. | `Run` | From the archive. ADR 0021. |
| Delete Run | Permanent removal. | `Run` | The only terminal operation; **cascades with funnel data**; clears the active Run. ADR 0044. |

## Edge Cases
- **Empty Run** (no stressors): Continue → brain dump.
- **Empty "Tasks" section** (no tasks): list empty state ("No tasks yet — start with a brain dump").
- **Task without attributes** (unprocessed): visible in the list with an "untagged" label — still ready to be marked (ADR 0013).
- **Done on already-done** / **not-relevant on already-dismissed**: no-op / action blocked.
- **Action impact on resume routing**: done/dismiss from the list changes `doneCount` → `deriveLastReachedStep` may advance the step (e.g. everything done → celebration). Verify that Continue / the "completed" state react live (→ `edgecases`).
- **Dismiss z listy**: undo (`DismissUndoToast`; harden, R2-2; ADR 0017).
- **Akcje z listy na zarchiwizowanym Runie**: read-only — akcje Done/Not-relevant ukryte (harden, R2-3).
- **Stats/Continue after list actions**: recompute live — a single `useTasks` instance in `useLiveRuns` (harden, R2-1; ADR 0035).
- **Read/write failure** (task mutation from the list): retry toast, no silent loss (`StorageStatusToast` pattern, already in `RunDetails`).
- **Task without attributes**: still "ready" for focus (ADR 0013) — it just won't match filters that require a given attribute.
- **Run completed** (100% done/dismissed): on Details a "Run completed" section + an "Archive this run" CTA; **no auto-archive** (archiving is manual only).
- **Resume zapauzowanej sesji**: timer wznawia od zapisanej pozycji (`timerElapsed`), nie od 0.
- **Many active runs at once**: each has its own `lastReachedStep`, stats **and its own funnel** (stressors/tasks/…); Continue sets it active and routes per-Run.
- **No active Run on a funnel screen** (the active one was deleted/archived, or entering via a direct link to `/capture` when none is active): redirect to the **Dashboard** — the funnel requires an active Run; the user picks Continue or creates a new one.
- **Switching the active Run mid-funnel**: Continuing another Run swaps the funnel data to that Run; an **unsaved draft** (e.g. text in the brain-dump field before Enter) **does not persist** — only committed stressors are saved (the input field is ephemeral).
- **Storage read error** (corrupted `run:runs`): an error state (`RunReadError`) instead of a misleading empty state; refresh as the recovery path.
- **Walidacja rename**: pusta nazwa (lub same spacje) blokuje „Zapisz" + inline komunikat (`aria-invalid`); `maxLength` 60.
- **Bulk deletion in Review**: "Remove stale" requires confirmation (`ConfirmDialog`).
- **Overview stats**: `stats` (`totalTasks`/`doneCount`/`dismissedCount`/`timeSpentSec`/`estimatedTotalMin`/`estimatedRemainingMin`) and `lastReachedStep` are **derived live** from **that Run's** funnel data (`src/modules/run/stats.ts`, `use-live-runs.ts`) — each Run card shows **its own** progress and resume step; after done/dismiss actions from the list they recompute themselves. (Feature `per-run-funnel-isolation`, ADR 0044 — funnel data scoped per-Run; previously global, diagnosis in `docs/changes/runs-share-funnel-data.md` / ADR 0043. `reviewItems` is still a mock.)
- **No estimates / completed (display states, ADR 0060/0062)**: `estimatedTotalMin = 0` (fresh run / nothing estimated) → the "estimated" tile in `RunStatTiles` shows **`—`** (not "0m"), and the "~Xh estimated" segment on the dominant card is **omitted**. The remaining-estimate sub-line renders only when `totalEst > 0 && remEst > 0` — hidden on a completed Run (when there's no estimated work left) instead of showing "~0m left" (ET-1). The sub-line's **"Estimated:"** prefix scopes the estimate metric, distinguishing it from the "N left" task counter in the breakdown (ET-2). Mixed (partially estimated) — `EstimatedTotal`/`EstimatedRemaining` cover only the ones with an estimate. (Feature `run-estimated-time-totals`, ADR 0059/0060; hardened in ADR 0062/0063.)
- **Jumping to a step with unmet conditions** (clickable stepper): Focus with no tasks / Ranking with <2 stressors / Decompose with no stressors / Process with no tasks → the screen degrades to its empty state (→ `edgecases` diagnosis, whether the states are sufficient).
- **Leaving an active focus session via the stepper**: a ConfirmDialog asks when the session is live (`screen === 'session' && currentTask && running`); confirm = pause + persist the `focus:session` snapshot (resume via `SessionResumeBanner`); cancel = stay. A backward jump (e.g. Focus → Decompose) mid-session — the same mechanism. **Guard scope (CS-1, accepted)**: it asks only on a stepper click (the main in-funnel navigation); browser back / reload / header links leave silently — safe, because the session snapshot persists per-Run regardless of the exit path, so there's no data loss (resumable). Extending the guard to all exit paths (history-blocking / `beforeunload`) is deferred — fragile and unjustified for the MVP.
- **Skok nie aktualizuje `lastReachedStep`**: Continue nadal smart-routuje wg danych lejka, nie wg ostatniego skoku usera.
- **Current step in the stepper**: click = no-op.
- **IA consistency after the Details actions reorder**: archived state (read-only list, consistent actions above it — Unarchive available); completed state (`RunCompleted` / celebration CTA above the list).

Full audit and each gap's status: `docs/modules/run-edgecases.md` (after `proto-harden`: ✅ 6 implemented, ❌ 10 deferred for good reason). New task-list cases await `proto-edgecases`.

## Integration Points
- **capture**: tworzy Run implicite przy Create; brain dump to pierwszy krok lejka.
- **decompose / process**: funnel steps living inside the active Run; `lastReachedStep` advances with progress.
- **focus (shared `TaskOrder`)**: the task list on Details is sorted by the same `TaskOrder` as the focus queue (ADR 0036) — one source of truth for ordering everywhere.
- **decompose (write)**: the `run` module **mutates task states** for the first time via `updateTask` (`decompose/hooks/use-tasks.ts`) — a cross-module write (ADR 0037).
- **focus**: wynik sesji (completed/dismissed, czas) aktualizuje statystyki Runa (`timeSpent`, `progress`); zapauzowana sesja jest celem routing przy Kontynuuj.
- **dashboard**: launcher — a list of active runs (card = Continue + Details) + the archive/history screen; triggers `run` actions.
- **shared estimate aggregate (cross-module, feature `run-estimated-time-totals`)**: `estimatedTotalMin`/`estimatedRemainingMin` from `deriveRunStats` are a **single source of truth** — `RunStatTiles` (Details) and `DominantRunCard` (dashboard) read them from `run.stats`, while `focus` computes its subset (sum of `EstimatedTime` over `matchedTasks`) locally in `FocusView`. The `formatMinutes` formatter lives in **`src/shared/format.ts`**, not in the `run` module — so the `focus` funnel module doesn't import from inside `run` (keep the direction: run aggregates funnel data, not the reverse). ADR 0059/0060/0061.
- **shared `FunnelStepper` (clickable)**: the step bar rendered on the Core screens; navigates along the `STEP_ROUTE` routes (model in `run`); leaving an active focus session → pause + `focus:session` snapshot (shares infra with resume). ADR 0048.
