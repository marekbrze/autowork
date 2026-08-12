# Focus

## Vision
The heart of the app — the payoff of the whole funnel. After filtering tasks, the user enters a session where **one task chases the next** under a **gentle timer** (counts up, nothing "runs away"), and the motivational material (the WHY from `decompose`) is **always visible** on the task screen. This is where the tool's promise is realized: we lift the burden of deciding "what's next" off the person — the session itself leads through the set, the next task starts on its own (Done → immediately the next), and a moment of celebration waits at the end.

The timer counts **up from 0:00**; the estimated time (`EstimatedTime` from `process`) is the **threshold** past which the counter turns **red** (model B, ADR 0016 — a change from counting down). Restrained energy instead of the pressure of a ticking countdown; for an ADHD/overwhelmed persona, a "how long I've been at it" counter is gentler than "time is running away".

**The timer runs in the background and is always correct.** A timestamp-based mechanism (it counts wall-clock time, not ticks) — even when Edge sleeps an inactive tab (Sleeping Tabs) or throttles `setInterval`, on return the timer snaps to the correct time without drift. The tick is driven from a **Web Worker** (lives in the background), and a **Wake Lock** keeps the screen/tab alive when visible (feature `focus-timer-background-keepalive-and-tab-title`, ADR 0053).

**Timer time in the tab title.** During an active session (task under the timer, running or paused) `document.title` shows the live elapsed — `12:34 — Autowork` (+ `· paused` when paused, `· over` past the estimate). Outside a session / in the summary = the normal title. This way the user sees the time at a glance in Edge's tab bar without returning to the tab, and the ticking Worker updates the title in the background too.

The session order defaults to **by stressor rank** (most stressful → first), so the user starts with what weighs on them most.

**Manual order = flexibility, not a nudge.** On the filter screen the user sees a **list of matched tasks** and can **reorder it** (drag / ↑↓) — to group related tasks together or set up a sequence (one has to come earlier because another depends on it). This is pure agency: we don't suggest "easy first" or "worst first", we just hand over control. By default the order = stressor rank (as above); a manual order is an **override**. `TaskOrder` is **one shared model** — the same order is visible in the filter list, in the session queue after Start, and in the Run Details task list (ADR 0036). Reset to default is available. (Feature `session-queue-order-and-run-task-list`, ADR 0035.)

## User Flows

### Entry: SessionFilter → Start + manual order
1. User wchodzi w `focus` z `process` (przez „Dalej" / stepper, ADR 0001) → ekran **wyboru sesji**.
2. **SessionFilter (one screen, two parts)**:
   - **(a) Filtry**: wybiera **≥1 kontekst** (multi-select) i **≥1 poziom energii** (multi-select) — wszystko na raz, nie krok po kroku.
   - **(b) Matched list** (when `matchCount > 0`): tasks in **`TaskOrder` order** (default = stressor rank), each with attribute badges (context / energy / time) + a drag handle + ↑↓. Here the user **reorders** to their own needs (grouping related items, sequencing dependencies).
3. Sees the live **matched counter** (how many landed in the set).
4. Optionally **"Reset to default"** — when a manual order is active, it clears `TaskOrder` → back to stressor rank.
5. Clicks the large **"Start"** → the session starts; the queue is built in `TaskOrder` order.
   - **0 matches** → list hidden, "Start" **disabled** + an info message (empty state).

### Session: the task loop (the core)
After Start, the first task from the queue in `TaskOrder` order (default = most stressful first). The task screen:
1. **Task title** + its attributes (context, energy, time) — one task dominates the screen.
2. **Timer counting up from 0**; threshold = `EstimatedTime` → past it **red** (`overtime`).
3. **Motivation always visible**: reasons (with gain/pain-avoidance valence) + the outcome vision from `decompose` (the payoff of building the WHY).
4. Akcje przy tasku:
   - **Done** → task `completed`; **the next task starts immediately** (no pause/beat).
   - **Skip** → `skipped`; deferred, **returns as `pending` at the next session** (not appended to the current queue).
   - **Dismiss (nieaktualne)** → `dismissed` (terminalnie; nie wraca) — osobna akcja, ADR 0017.
   - **Back** → go back to the previous task (an accidental Done / wanting to finish it).
   - **Pause** → halt the timer/session; Resume from the saved position.
   - **Exit** → end early.

### Skip vs Dismiss (a key distinction)
- **Skip** = "not now, I'll come back" — the task lives, returns at the **next session** as `pending`.
- **Dismiss** = "this is no longer relevant, it lost its meaning" (deadline passed, someone else handled it, circumstances changed) — the task is **terminally `dismissed`**, **doesn't return**; **undo** (revert → `pending`, like ADR 0004); **counts toward** the Run's progress; in the summary in a **separate section**.

### Finish: celebration
- **Auto-summary** once you go through the whole set (or after **Exit**).
- **SessionSummary**: tasks done + **total time** spent on tasks + **Not-relevant in a separate section**.
- **"Remove finished"** (`ClearCompleted`) — clears `completed` **and** `dismissed` (the celebration moment).

### Early exit (Exit)
- You click **Exit** mid-session → the current task **stays `active`**; the session is paused.
- Resuming → continues from the same task; the timer remembers the position per task (`timerElapsed`).

## Screens (rough)
- **SessionFilter / start**: one screen, two parts. **(a)** Filters: choose contexts (multi) + energy (multi) + live match counter + a large **"Start"** (disabled when nothing is chosen or 0 matches + info). **(b)** Matched list (when `matchCount > 0`): task rows (text + context/energy/time badges + drag handle + ↑↓) in `TaskOrder` order; a **"Reset to default"** control visible when a manual order is active. Zero friction; sets the session's scope and order.
- **Task screen (focus)**: one task dominates (title + attributes). Below it a large **timer counting up** (threshold = estimate → red). **Motivation section always visible** (reasons with valence + outcome vision). Actions: Done / Skip / Dismiss / Back / Pause (+ Exit). Minimal distraction — we lead by the hand.
- **Summary (celebration)**: tasks done + **total time**; **Not-relevant in a separate section**; a **"Remove finished"** button (Done + Not-relevant).

## Actions

| Action | Description | Entity | Notes |
|--------|------------|--------|-------|
| Filter session | Wybierz konteksty + energie (multi), zobacz licznik dopasowanych. | SessionFilter | Jeden ekran; „Start" zablokowany przy 0 + info. |
| Reorder queue | Reorder matched tasks (drag / ↑↓) in the filter list. | `Task` (`TaskOrder`) | Updates `TaskOrder`; one shared model (ADR 0036); default = stressor rank. Honest persistence on write failure. |
| Reset queue order | Clear `TaskOrder` → back to stressor rank. | `TaskOrder` | Available when a manual order is active; the same reset applies to the run lists. |
| Start Session | Start a session from the filter; queue in `TaskOrder` order. | FocusSession | Default = stressor rank (most stressful → first). |
| Done → `completed` | Mark as done; the next starts immediately. | Task | No pause between tasks. |
| Skip → `skipped` | Defer; returns as `pending` at the next session. | Task | Temporary — different from Dismiss. |
| Dismiss → `dismissed` | Mark as not relevant (lost its meaning). | Task | Status (ADR 0017); doesn't return, undo, counts toward progress, separate section in the summary. |
| Back (reopen previous) | Go back to the previous task. | Task | Current → `pending`. |
| Timer Start / Pause / Resume | Count up from 0; pause/resume from the saved position. | Timer | Model B (ADR 0016); threshold = estimate → red. Background: timestamp-based, always correct on return; tick from a Web Worker, Wake Lock keeps the screen on, and `document.title` shows live elapsed (ADR 0053). |
| Exit (early) | End early; the current task stays `active`. | FocusSession | Resume from the same task. |
| View Summary | Auto after the set is exhausted (or after Exit). | SessionSummary | Done + total time + Not-relevant (separate section). |
| ClearCompleted | Remove `completed` + `dismissed`. | Task | The celebration moment. |

## Edge Cases
- **0 matches in the filter**: list hidden, "Start" **disabled** + an info message (empty state).
- **Everything resolved**: tasks are described, but none `pending` — an "All tasks done — well done" message + a CTA to `process` (different from "no attributes").
- **Early exit / refresh / browser-back**: the session snapshot (queue + position) is persisted in `focus:session`; on entering `/focus` with an interrupted session → a "Resume session" banner (opt-in). The timer remembers the position per task (`timerElapsed`). The lo-fi keeps the current task as `pending` (the `active` state is unused in the proto — see ADR 0019).
- **Write failure (LocalStorage full/disabled)**: an action (Done/Skip/Dismiss/Back/Clear/Reorder/Reset) **does not execute** on a failed write — the user stays on the task / the layout doesn't break, a `StorageStatusToast` with retry (no silent loss; pattern from `ProcessView`).
- **Read failure**: a corrupted read → an error state ("Failed to load tasks" + Refresh) instead of a misleading list empty state.
- **State change mid-session (another tab)**: a task resolved "behind your back" is not shown as current — reconciliation advances to the next `pending` in the queue (or ends the session).
- **Background tab / sleeping tab (Edge Sleeping Tabs)**: the timer is **always correct** on return — the timestamp-based model (wall-clock, not ticks) snaps to the correct time even when Edge sleeps the tab and no tick fires. The background tick is driven by a **Web Worker** (which also updates `document.title`), and a **Wake Lock** keeps the screen alive when the tab is visible. A full guarantee against sleeping over very long periods is beyond JS's reach — a resync always corrects the value (ADR 0053).
- **Overtime (timer > oszacowanie)**: tylko wizualnie czerwony (motywacja i tak zawsze widoczna — brak dodatkowego triggera).
- **Sesja 1-zadaniowa**: Done → od razu podsumowanie.
- **Undo Dismiss**: reverting `dismissed` → returns as `pending` (like undoing stressor deletion, ADR 0004). It works **from the summary screen too** (the undo toast lives at the `FocusView` level, surviving the jump to summary when the last task is dismissed).
- **Back on the first task**: no previous → action hidden/blocked (dead-end). Back only reopens `completed`/`skipped`; it does **not** un-dismiss (that's a separate undo path).
- **Missing motivation**: a task from a stressor with no WHY in `decompose` → the motivation section empty/omitted (a nudge, not an error — WHY never blocks, ADR 0007).
- **Single-element list**: nothing to reorder — reorder no-op / blocked (→ `harden`).
- **Tasks added after `TaskOrder` is set**: appended by default (stressor rank) at the end (→ `edgecases`).
- **`TaskOrder` points to deleted tasks**: prune on read (→ `edgecases`).
- **`TaskOrder` points to tasks outside the current filter**: hidden in the list, but positions preserved in the global order; reordering within a sub-filter reconfigures the global `TaskOrder` (→ `edgecases`).
- **Reset order** — a `ConfirmDialog` before clearing `TaskOrder` (harden, F2-1).
- **Skip clears at the start of a new session** (`FocusView.start` → `returnSkippedToPool`), not on exit. A known, separate **Resume cursor bug** (the session shows e.g. 3 of 3 because skipped tasks "hang" behind the cursor) — diagnosis in `docs/changes/skip-removes-task-from-pool.md` (ADR 0034), routed to `proto-bug`; **outside this feature**.

Full audit and each gap's status: `docs/modules/focus-edgecases.md` (after `proto-harden`: ✅ implemented, ❌ deferred for good reason). New `TaskOrder` cases await `proto-edgecases`.

## Integration Points
- **`process`**: input — receives attribute-described tasks (`Context` / `Energy` / `EstimatedTime`); these drive the filter and the **timer threshold**.
- **`decompose`**: supplies the **motivation** (Reasons + DoneVision per stressor) — **always visible** on the task screen (the payoff of building the WHY).
- **`capture`**: the default session queue ordered by **stressor rank** (most stressful → first); `TaskOrder` overrides this default.
- **`run` (shared `TaskOrder`)**: the same manual order is visible in the Run Details task list (ADR 0036) — one source of truth for ordering everywhere.
- **App shell (ADR 0001)**: the stage renders in `AppShell` (`/focus`); leading, not a menu.
