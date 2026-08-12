# Action Inventory

A complete list of actions the user can take — grouped by entity. Open format (not just CRUD): entity → action → description. State transitions are treated as actions.

## Roles
- **User**: The only role — the project's author; does everything. Single-user, local.

## Actions

### Run

| Action | Description | Role | Notes |
|--------|-------------|------|-------|
| Create Run | Start a new run through the funnel ("start fresh") from the dashboard. | User | `capture` creates the Run implicitly (name = date/time); starts with the brain dump. The Run becomes the **active one** (`activeRunId`) — its funnel is visible on the funnel screens; a new Run has an **empty funnel** (each Run has its own data). Run = a visible object with statistics (ADR 0020, 0044). |
| View Dashboard | Open the launcher: the dominant most-recently-worked-on run (progress in the foreground) + smaller active runs + an entrance to the archive. | User | The app's entry screen. Owner: the `dashboard` module. ~~Run comparison~~ dropped from the MVP (ADR 0027). |
| Continue (resume) | Return to a Run where you left off — smart-routing to the furthest step that has work. | User | From the Run card on the dashboard. **Sets the active Run** (its funnel is visible from now on). Routing: paused session → resume • ≥1 task → focus • none → process/decompose/ranking/brain dump • everything done → details. Attributes don't gate (ADR 0013). ADR 0022, 0044. |
| Navigate to funnel step | Jump to any step of the active Run via the clickable stepper on the funnel screens (Stressors/Ranking/Actions/Processing/Focus). | User | Current step = no-op. In an active focus session → ConfirmDialog (pause, per-Run snapshot, resumable via `SessionResumeBanner`). Doesn't change `lastReachedStep` (Continue still follows the data). Supersedes ADR 0001; ADR 0048. |
| View Details / Stats | Open the Run statistics screen: time spent (focus sum), completed (`completed + dismissed`), remaining, progress %. | User | The Run management screen ("Details"). |
| Rename Run | Set / edit the optional name. | User | Defaults to date/time; from Details. |
| Review | Go through the stressors / tasks and decide: still applies (relevant) vs to remove (stale). | User | **Only manually** from Details — not launched automatically on resume. ADR 0023. |
| Archive Run | Hide the Run from active runs into the archive (history). | User | Manually from Details; reversible (Un-archive). ADR 0021. |
| Un-archive Run | Restore an archived Run to active (you can Continue it again). | User | Manually from the archive. ADR 0021. |
| Delete Run | Permanently delete the whole run (from history/archive too). | User | The only terminal operation. **Cascade** with the whole funnel (stressors, tasks, next-actions, reasons, done-visions, focus data); if the deleted one was active — the active one is cleared, user lands on the Dashboard. ADR 0044. |

### Stressor

| Action | Description | Role | Notes |
|--------|-------------|------|-------|
| Add Stressor | Brain dump — type a stressor, Enter adds another. | User | Step 1. |
| Pick prompt suggestion | Click the rotating prompt banner to help yourself (pre-fill the field). | User | `PromptBanner`; rotates every few seconds. |
| Edit Stressor | Change the text. | User | |
| Delete Stressor | Delete (along with its children). | User | Keyboard: Backspace/Delete; **undo on by default** (Ctrl+Z). During review or at any time. |
| Rank Stressor | Order from most to least stressful. | User | Step 2; sets `rank`. Manually (drag/↑↓) or via `Pairing`. |
| Run Pairing | Run and complete a sequence of pairwise comparisons; the algorithm produces the final order. | User | Optional ranking method; a committed sequence (start → full pass); requires ≥2 stressors. |
| Mark relevant / stale | At review: confirm it still applies, or flag it for removal. | User | |

### Motivation (WHY — motivational material)

| Action | Description | Role | Notes |
|--------|-------------|------|-------|
| Add Reason | Add a reason why the stressor matters, with a valence: positive (gain) / negative (avoiding pain). | User | The WHY block in `decompose`; several per stressor. The `Reason` entity. |
| Add DoneVision | Describe a positive vision of the outcome — the completed state (vivid text + emoji). | User | Optional, 0..1 per stressor; the `doneVision` attribute on `Stressor`. |
| Skip motivation | Skip the WHY block and go to the next-actions. | User | WHY never blocks (nudge, not a gate). |

### NextAction

| Action | Description | Role | Notes |
|--------|-------------|------|-------|
| Add NextAction | List what will push the stressor forward (there can be several). | User | Step 3; **active, concrete language** (a verb, doable) — ADR 0006. |
| Decompose into Tasks | Break a coarse NextAction into concrete Tasks. | User | The "How could you break this down?" prompt under a next-action; skip = 1 Task (concrete = 1). |
| Edit NextAction | Change the text. | User | |
| Delete NextAction | Delete. | User | |

### Task

| Action | Description | Role | Notes |
|--------|-------------|------|-------|
| Create Task | From a NextAction breakdown or directly (concrete → 1 Task). | User | |
| Assign attributes (Processing) | Pin a `Context` (one), `Energy` (1–3), `EstimatedTime` (preset). | User | Step 4 (GTD inbox style). Option-card + key + Enter; one step per missing attribute (the `dopadone` `ProcessingView` pattern — ADR 0012). |
| Skip attribute | Skip a given attribute in Processing — leave it null (Esc). | User | Nudge, not a gate (ADR 0007); a task without the attribute doesn't enter sessions that require it (ADR 0013). |
| Edit Task | Change attributes / text. | User | In Processing and during review-on-resume; **not** during an active focus session (execution mode). |
| Delete Task | Delete. | User | |
| Filter into session | Become a qualifier via the SessionFilter (Context(s) + energy levels). | User | Implicit, through filter selection. |
| Start → `active` | Become the current task on the screen under the timer. | User | In a FocusSession. |
| Done → `completed` | Mark as done; the next one starts automatically. | User | |
| Skip → `skipped` | Set aside; returns as `pending` at the next session. | User | Not appended to the current queue. |
| Back (reopen previous) | The previous task is `active` again; the current one → `pending`. | User | Undoing a Done / finishing up. |
| Dismiss → `dismissed` | Mark as stale (outdated / no longer makes sense); doesn't come back in later sessions. | User | Separate from Skip (temporary) and Done. Visible in `SessionSummary` (a separate section); counts toward progress; **undo** (like ADR 0004). ADR 0017. |
| ClearCompleted | Remove completed **and dismissed** tasks (the moment of celebration). | User | From SessionSummary. |
| Reorder queue | Reorder the matched tasks (drag / ↑↓) on the focus filter list. | User | Updates `TaskOrder` — one shared ordering model (ADR 0036); default = stressor rank. Honest persistence on a write failure. |
| Reset queue order | Clear `TaskOrder` → return to stressor-rank order. | User | From the focus filter (and inherited by the run list); available when a manual order is active. |
| View run task list | See all tasks with their real state on Run Details (grouped, sorted by `TaskOrder`). | User | `run` reads tasks cross-module (the `decompose` store). ADR 0036/0037. |
| Mark task done (from details) | `pending`/`skipped`/`active` → `completed` from the list on Details. | User | `run` mutates task state (the first time — ADR 0037); counts toward progress. |
| Mark task not-relevant (from details) | → `dismissed` from the list on Details. | User | Terminal; undo; counts toward progress (ADR 0017). |

### FocusSession

| Action | Description | Role | Notes |
|--------|-------------|------|-------|
| Start Session | Begin focus after picking a SessionFilter. | User | Step 5→6. The queue is ordered by stressor rank (most stressful → first). |
| Pause / Resume | Pause the session's flow; resume where you left off. | User | Via the Timer. |

### Timer

| Action | Description | Role | Notes |
|--------|-------------|------|-------|
| Start | Begin counting up from 0 for the active task. | User | Model B (ADR 0016). |
| Pause / Resume | Remember the position; resume from the saved value. | User | State per Task (`timerElapsed`). |
| (counts past estimate) | After crossing `EstimatedTime` it keeps counting up; red render (`overtime`). | System | Model B (ADR 0016). |
| (stays accurate in background) | The timer stays correct when the tab is in the background / asleep (Edge Sleeping Tabs); on return it snaps to the right time. The background tick is driven by a Web Worker; Wake Lock holds the screen while the tab is visible; `document.title` shows the live elapsed time. | System | Timestamp-based, not ticks (ADR 0053). |

### SessionSummary

| Action | Description | Role | Notes |
|--------|-------------|------|-------|
| View Summary | See the completed tasks + total time. | User | Step 7 (celebration). |
| ClearCompleted | Remove the finished tasks. | User | The moment of celebration. |
