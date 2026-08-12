# Dashboard

## Vision
The Dashboard is a **launch runway, not a neutral list**. Its first job: get the user back to work in one click. The user opens the app and immediately sees **an opportunity to act** — the dominant card of the most recently worked-on run (large, with Continue on top), and next to it a deliberate "Start new" button. Below, smaller cards of the other active runs; at the very end of the list — the entry to the archive/history.

Motivation on the dashboard is **mainly momentum from progress** (the bar, how much done / how much left, %), lightly supported by time spent ("2h already put in"). WHY/done vision and contrast between runs **don't live** on this screen — contrast/"Compare runs" was dropped from the MVP (ADR 0027).

This is the app's entry screen — it sets the tone just like `capture`, only from the "get back to work" side, not "start from scratch".

## User Flows

### Open dashboard (land) → resume work
1. The user opens the app → lands on the dashboard.
2. Sees the **dominant card of the most recently worked-on run** (sorted by `lastActiveAt` — ADR 0028) with progress and a **Continue** button.
3. Clicks Continue → smart-routing to the furthest funnel step with work (routing belongs to `run` — see `run.md` / ADR 0022).
4. In one click they're back at work, with no step selection.

### Start new run
1. The user clicks **"Start new"** (button next to the dominant card, deliberate, secondary).
2. The app creates a Run (name = date/time, state `in_progress`, `progress = 0`, `lastActiveAt = now`).
3. The user lands in `capture` (brain dump) — the first funnel step.

### Continue any run (from a smaller card)
1. The user scrolls to a smaller card of an active run.
2. Clicks **Continue** on that card → smart-routing per-Run (as above).

### View Details (from any card)
1. The user clicks **Details** on a run card (dominant or smaller).
2. The Run management screen opens (`run.md` → Run Details): stats + actions (rename, review, archive, delete).

### Enter archive / history
1. The user scrolls the list of active runs to the very bottom.
2. Clicks the entry to the **archive**.
3. Sees a passive list of archived runs with stats; can **Un-archive** (restore to active) or just browse. No dedicated comparison UI (ADR 0027).

### First-ever open (zero runs)
1. The user opens the app for the first time (no runs).
2. Sees a **large, work-inviting button** (start fresh) → creates the first Run → `capture`.

## Screens (rough)
- **Dashboard (launcher)**: dominant card of the most recently worked-on run at the top; next to it a "Start new" button; below, smaller cards of the other active runs (each Continue + Details, ordered by `lastActiveAt` desc); at the end of the list, the entry to the archive/history.
- **Dominant run card**: large format, **progress front and center** — progress bar + "X of Y done" + "N left" + %; a light accent on **time spent** as a supporting motivator; **Continue** as the primary CTA, **Details** secondary. WHY/vision/contrast — not here.
- **Mini run card**: name + progress (mini-bar / %) + **Continue** and **Details**. Same actions as the dominant one, just a smaller format.
- **Archive / history**: list of archived runs with mini-stats; **Un-archive** action; no comparison UI.
- **Empty state (zero runs)**: a large, work-inviting button (start fresh). First contact from the dashboard side — sets the tone.

## Actions

| Action | Description | Entity | Notes |
|--------|-------------|--------|-------|
| View Dashboard | Open the launcher: dominant last run + active ones + archive entry. | `Run` | The app's entry screen. |
| Continue (resume) | Smart-routing to the furthest step with work. | `Run` | On every run card (dominant and smaller). ADR 0022. |
| View Details / Stats | Stats screen + Run management. | `Run` | On every run card. Details in `run.md`. |
| Start new Run | Start a new run through the funnel. | `Run` | Button next to the dominant card; deliberate choice. `capture` creates the Run implicitly. |
| Enter archive | Enter the history of archived runs. | `Run` | Entry at the end of the active runs list. |
| Un-archive Run | Restore an archived Run to active. | `Run` | From the archive; reversible. ADR 0021. |
| ~~Compare runs~~ | ~~Comparing runs for motivation.~~ | — | **Dropped from the MVP** (ADR 0027). Archive = passive list. |

## Edge Cases
- **Zero runs (first open)**: a large, work-inviting button → start fresh → `capture`.
- **One active run**: it's the dominant card, the smaller-cards list is empty; the archive entry is still visible (empty, if nothing is archived).
- **All runs archived (none active)**: empty active list + "no active runs" message + a prominent archive entry + "Start new".
- **Run completed (100%) but not archived**: on the dominant card the primary CTA switches to "Archive this run" (harden #1); on smaller cards Continue → funnel step. No auto-archive.
- **Run without tasks (`totalTasks=0`) as dominant**: instead of breaking down zeroes it shows "No tasks yet — start with a brain dump" (harden #3).
- **Storage read error** (corrupted `run:runs`): error state (`RunReadError`) instead of a misleading empty-state; refresh as the recovery path (like `run.md`).
- **Many active runs**: sorted by `lastActiveAt` desc; dominant card = max(`lastActiveAt`). The prototype has no pagination — a long list will need to be handled in lofi.
- **Overview statistics**: in the prototype the Run's `stats` and `lastReachedStep` are **derived live** from global funnel data (`run.md` §Integration, `run/stats.ts`) — the dominant/mini card shows real progress. The funnel data is global (without `runId`), so all Runs show the same progress; `lastActiveAt`/ordering still come from the Run container. Deferred to the per-Run phase (ADR 0020): scoping data by `runId`.

## Integration Points
- **run**: the dashboard reads runs (state, progress, `lastActiveAt`) and triggers run-lifecycle actions — Continue (smart-routing), Create/Start new, View Details, Enter archive, Un-archive. Dominant card = run with the largest `lastActiveAt`.
- **capture / decompose / process / focus**: launched indirectly via Continue (smart-routing drops the user into the relevant funnel step inside the active Run). Start new → `capture`.
- **dashboard ↔ run**: the dashboard is a view layer over the Run lifecycle described in `run.md`; it takes over the launcher and the list/archive, while `run` holds the logic for states, statistics, and resume routing.
