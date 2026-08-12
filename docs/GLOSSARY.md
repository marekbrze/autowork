# Domain Glossary

Terms and concepts specific to this project. Used across all project skills to maintain a consistent language.

| Term | Code Name | Definition | Avoid saying |
|------|-----------|------------|--------------|
| Stressor (a stressful thing) | `Stressor` | A single thing entered in the brain dump — something that's stressing you right now. The raw input of the funnel, before it gets broken into actions. | "task" (task = `Task`/`NextAction` after processing), "problem" |
| Brain dump | `BrainDump` | First step: emptying your head of all stressors, one after another, without judgment. | "list", "entry" |
| Rotating prompt banner | `PromptBanner` | An interactive banner in the brain dump that changes every few seconds; it suggests categories / example stressors ("finances", "What about a loan payment?") to draw out what slips away. Clickable — helps fill the field. | "hints", "tooltip" |
| Stress ranking | `StressRanking` | Step 2: ordering stressors from most to least stressful. Determines the processing order. | "sorting", "priority" (priority follows from stress) |
| Pairing (pairwise ranking) | `Pairing` | Optional ranking method: a committed sequence of pairwise comparisons ("which is more stressful: A or B?"); once you go through it all, a smart algorithm (e.g. insertion/merge sort, ELO ranking) produces the final order. Alongside manual list ordering. | "voting", "sorting" |
| Motivation (motivational material) | `Motivation` | The WHY in `decompose`: the reasons this stressor matters + a vision of the outcome. "Charges the battery" that `focus` later spends as a reminder of "why you're doing this". | "description", "comment" |
| (Motivational) reason | `Reason` | A single reason this stressor matters to the user. Carries a valence: positive (gain) or negative (avoiding pain). Several per stressor. | "pro", "con" |
| Motivation valence | `Valence` | The type of motivation: `positive` (approach — gain) or `negative` (avoidance — avoiding pain). | "positive/negative" |
| Done vision | `DoneVision` | A positive visualization of the stressor's completed state — a vivid, sensory description (text + emoji). The payoff. | "goal", "dream" |
| Next-action (a step forward) | `NextAction` | A concrete action under a stressor that will push it forward — **written in active, concrete language** (a verb, doable). A stressor can have several. They likely become the units on the focus list. | "step" (too generic), "subtask" |
| Processing (inbox / GTD) | `Processing` | Step 4: giving each task a context, energy, and time — a GTD inbox style (like in the *dopadone* app). | "sorting", "tagging" |
| Context | `Context` | The place / mode in which a task can be done. Categories to pick from (see below). Multi-select when choosing a session. | "tag", "category", "label" |
| — phone | `Context.Phone` | A task to do by phone. | |
| — message | `Context.Message` | A task that involves sending a message. | |
| — creative | `Context.Creative` | A task that requires creative thinking. | |
| — errands | `Context.Errands` | Tasks around town / shopping (a GTD term). | |
| — home | `Context.Home` | A task to do at home. | |
| — city | `Context.City` | A task that requires going out into the city. | |
| Energy | `Energy` | The amount of energy / effort a task needs. A **1–3** scale (Low / Medium / High), rendered as **batteries** (1 = one battery, 3 = three). Used as a session filter (**multiple** levels selectable). | "difficulty", "effort" |
| (Estimated) time | `EstimatedTime` | The estimated time a task needs. The source of the timer value in a focus session. | "time", "deadline" |
| Estimated total time | `EstimatedTotal` | The sum of `EstimatedTime` across a Run's **estimated** tasks — the size of the work in the whole run. Derived live (`estimatedTotalMin`); shown on the dashboard (dominant card), in `RunStatTiles` (Details), and in the focus session filter (sum over `matchedTasks`). | "time spent" (that's `timeSpent`), "time sum" |
| Estimated remaining time | `EstimatedRemaining` | The sum of `EstimatedTime` across tasks **not yet done** (state ∉ `completed`/`dismissed`) — how much is estimated to be left. `estimatedRemainingMin`; a sub-line on Run Details. | "left" (that's the task counter), "time spent" |
| Session selection / filter | `SessionFilter` | Step 5: picking context(s) and energy, which filters the long list down to a set for this session. | "filtering", "settings" |
| Focus session | `FocusSession` | Step 6: going through the filtered set, one task on screen at a time, under a timer. | "work mode", "pomodoro" |
| Timer | `Timer` | The counter on the focus screen — counts **up from 0:00**; `EstimatedTime` is the threshold beyond which it renders red (model B, ADR 0016). Runs in the background and **is always correct when you come back** (timestamp-based, not ticks); during a session the time also shows in the **tab title** (`12:34 — Autowork`, + `· paused` / `· over`); the screen holds a **Wake Lock**, and the background tick is driven by a **Web Worker** (ADR 0053). | "stopwatch", "clock" |
| Skip | `Skip` | Setting the current task aside — it stays on the list for later. | "skip forever", "delete" |
| Done (completed) | `Complete` / `Completed` | The task is done; the next one starts automatically. | "close", "delete" (deleting is `ClearCompleted`) |
| Stale (dismissed) | `Dismiss` / `dismissed` | A task that no longer makes sense (outdated, someone else handled it, circumstances changed) — marked in `focus` as not-to-do. Separate from `Skip` (set aside for later) and `Done`. It doesn't come back in later sessions, has undo, counts toward progress, and gets its own section in `SessionSummary` (ADR 0017). | "deleted" (deleting = `ClearCompleted`), "cancelled" |
| "Clear completed" | `ClearCompleted` | An action on the summary screen: remove the completed tasks. A moment of celebration. | "archive" (if it means something else) |
| Celebration / summary | `SessionSummary` | The screen at the end of a session: list of completed tasks + total time spent on tasks + `ClearCompleted`. | "report", "statistics" |

| Run | `Run` | One full run through the funnel (brain dump → celebration). A **visible object with statistics** (ADR 0020): durable, resumable, with progress (`(completed + dismissed) / total`), time spent, and an optional name (defaults to date/time). Many runs live in parallel, **each with its own set of stressors/tasks**; states `in_progress` \| `archived`. Run history serves comparison and motivation. | "session" (session = `FocusSession`), "pass" |
| Active Run | `activeRunId` | The Run whose funnel (stressors, tasks, …) the user currently sees on the `capture`/`decompose`/`process`/`focus` screens. Set on **Create / Continue**; cleared when the active one is Deleted/Archived (→ Dashboard). Switching happens via the Dashboard (Continue a different Run). ADR 0044. | "selected run", "open run" |
| Task | `Task` | An atomic, executable unit — an item on the focus list. Comes from a `NextAction` (a 1..N breakdown; a concrete NextAction = 1 Task). Carries `Context`, `Energy`, `EstimatedTime`. | "step" (too generic), "task" generically |
| Task state | `TaskState` | Cycle: `pending` → `active` → `completed` \| `skipped` \| `dismissed`. `Skip` returns to `pending` at the next session; `Back` reactivates the previous one (`active`); `Dismiss` = terminally stale (doesn't come back, undo, counts toward progress — ADR 0017). | "status" |
| Manual queue order | `TaskOrder` | One shared model of task ordering within a Run (an ordered list of IDs). Default (empty / after reset) = stressor rank; manual reordering (drag / ↑↓) overrides it. The same order is visible in the focus filter, the session queue, and the task list on Run Details. Win = flexibility (grouping related tasks, sequencing dependencies), not a nudge. ADR 0036. | "sorting", "default order" |
| Run task list | `RunTaskList` | A view of all tasks with their real state on Run Details — grouped by state (To do / Done / Not relevant), sorted within each group by `TaskOrder`. Actions from the list: done / not-relevant (the `run` module mutates task states). ADR 0037. | "task list", "statistics" (those are aggregates) |
| Task status (on the action list) | `TaskStatusIndicator` | A read-only task-state marker next to its entry in the `decompose` HOW block: `completed` → ✓, `dismissed` → ⊘ + "not relevant" (muted, neutral — not red). State is mutated in `focus`/`run`; `decompose` only displays it. ADR 0057. | "badge", "state label" |
| Resolved next-action | `ResolvedNextAction` | A next-action whose **all** tasks are `completed`/`dismissed` — in the `decompose` HOW block it gets strike-through + muted (de-emphasis) and an `X/N done` counter; still editable (read-only refers to task state, not CRUD). ADR 0057. | "completed", "done next-action" |
| Dashboard | `Dashboard` | The entry screen / launcher (launch runway): a dominant card for the most recently worked-on run (progress in the foreground) + active runs + an entrance to the archive. One click returns you to work; motivation = mostly progress momentum. | "panel", "home page", "list of runs" |
| Review-on-resume | `Review` | A Run review: you go through the stressors / tasks and decide what still applies (relevant) and what to remove (stale / outdated). **Only manually** from Details — not launched automatically on resume (ADR 0023). | "cleanup", "archiving" |
| Continue (resume) | `Continue` | Smart-routing resume of a Run from the dashboard to the furthest funnel step that has work (paused session → resume • ≥1 task → focus • none → process/decompose/ranking/brain dump • everything done → details). Attributes don't gate (ADR 0013). ADR 0022. | "start", "open" |
| Run Details | `RunDetails` | The statistics and management screen for a single Run: time spent (sum from focus), completed (`completed + dismissed`), remaining, progress % + actions (rename, review, archive/unarchive, delete). | "run panel", "statistics" |
| Archive | `Archive` / `archived` | Run state: hidden from active runs on the dashboard, but kept in the archive/history (statistics + comparison visible, can be un-archived). Manual, reversible. ADR 0021. | "finish", "hide" |
| Un-archive | `Un-archive` | Restoring an archived Run to active (you can Continue it again). ADR 0021. | "restore" |
| Funnel step | `FunnelStep` | A level reached in the funnel (brain dump → ranking → decompose → process → focus → celebration); held on the Run as `lastReachedStep`, drives Continue routing. | "stage", "phase" |
| Clickable funnel stepper | `FunnelStepper` | A bar of 5 funnel steps (Stressors › Ranking › Actions › Processing › Focus) on the funnel screens — **clickable navigation** across the steps of the active Run (free jumps; current = no-op; leaving an active focus session → ConfirmDialog, the session pauses and survives to be resumed). Supersedes "guided funnel without breadcrumbs" (ADR 0001); ADR 0048. | "breadcrumbs", "step menu" |

## Project modules (code namespaces)

Module names = folders / namespaces in code. Details: `docs/MODULES.md`.

| Module | What it covers |
|------|-----------|
| `capture` | Brain dump + stress ranking (`Stressor`). |
| `decompose` | WHY (motivation: reasons + done vision) and HOW (next-actions → tasks) — `Reason`, `DoneVision`, `NextAction`, `Task`. |
| `process` | GTD processing — context / energy / time (`Task`). |
| `focus` | Session filtering + focus session + timer + summary (`FocusSession`, `Timer`, `SessionSummary`). |
| `run` | Run lifecycle — creation / resume / progress / review (`Run`). |
| `dashboard` | Run history, progress, comparison / motivation. |

## External references
- **dopadone** — the inspiration app for the processing style (GTD inbox). Not part of the code; a UX reference for step 4.
