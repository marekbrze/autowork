# Process

## Vision
The funnel stage where raw tasks from `decompose` get what they need to enable a `focus` session: `Context`, `Energy`, `EstimatedTime`. Pattern **1:1 with `marekbrze/dopadone` (`ProcessingView`)** — not "one task per screen with a form", but a **flat queue of micro-steps, one missing attribute at a time**, driven by keyboard. Goal: zero friction — the same muscle memory as the brain-dump in `capture` (highlight → Enter), leading, not forcing (ADR 0007).

Three screens (state machine): **`summary`** (stat-cards "to process" + "Start") → **`processing`** (step walkthrough) → **`done`** (celebration). Option-card grid with key badges, **pending → confirm (Enter)**, **skip (Esc)**, **forward / back / jump** navigation — exactly like `dopadone`.

`dopadone`'s steps (`area`/`project`/`energy`/`context`/`date`) → here **3: Context → Energy → EstimatedTime** (no area/project — they don't exist in this domain). Deliberate departures from the reference: **no timer** in `process` (the timer's identity belongs to `focus`), **no mark-done** (done happens in `focus`), and **no convert-to-project** (no projects). Decisions: ADR 0012, ADR 0013.

## User Flows

### Entry: summary → start
1. User wchodzi w `process` (z `decompose` przez „Dalej" / stepper, ADR 0001) → ekran **podsumowania**.
2. Sees **stat-cards** "to process": how many tasks **without context** / **without energy** / **without time** (live from the data; card dimmed when 0).
3. **"Start [↵]"** → `buildSession()` builds the step queue → processing screen.
   - If nothing to do (everything described / no tasks) → **"All done — no tasks to process."** + "Next" straight to `focus`.

### Processing: walking through micro-steps (the core)
`buildSession`: for each task (in `decompose`'s order: most stressful stressor first → its next-actions → tasks) emits **one step per missing attribute**, in the fixed order **Context → Energy → EstimatedTime**. A task with all 3 attributes never enters the session.

Per krok:
1. **Sidebar** (left): session tasks + progress (`done / total`) + per-attribute tags (✓ when assigned); current highlighted; click = jump to that task's first step.
2. **Main** (right): **step breadcrumbs** for the task (Context · Energy · Time; current active, assigned ones with ✓; pre-filled if already set) + **task name** + context breadcrumb (stressor / next-action) + **option-card grid** for the current attribute.
3. Interaction (keyboard-first): highlight (hover / option key press / ↑↓) → **Enter = commit**; **Esc = skip** (leaves null); **← = back**.
4. After commit / skip → **advance** to the next step (next attribute of this task → first attribute of the next task → done screen).

Atrybuty jako option-cards:
- **Context** — 6 cards (Phone / Message / Creative / Errands / Home / Town), keys 1–6.
- **Energy** — 3 karty z **bateryjkami** (Low = 1 / Med = 2 / High = 3), klucze 1–3.
- **EstimatedTime** — 5 kart (5 / 15 / 30 / 45 / 60 min), klucze 1–5.

### Forward / back navigation (key — like `dopadone`)
- **Forward (advance)**: after commit or skip → `idx+1`; at the end of the queue → done screen. Pre-fill the next step from the task's current value.
- **Back (goBack)**: ← or the **"← Back"** button (hidden on the first step) → `idx-1`; pre-fill with the current value.
- **Jump**: click in the sidebar → first step of the selected task; existing progress (✓) preserved.
- **Delete**: task deleted → jump to the next task's first step (or done).
- **Edit**: inline-edit the task name — doesn't move the step cursor.

### Exit: done (`process` → `focus`)
1. After the last step → the **done** screen: "Processed N tasks" (celebration, like `SessionSummary` in `focus`).
2. **"Next"** → `focus` (session selection / `SessionFilter` — the next funnel step).

## Screens (rough)
- **Summary screen**: title "To process" + 3 stat-cards (without context / without energy / without time, dimmed when 0) + a large **"Start [↵]"**. Empty state: "All done" + "Next" to `focus`.
- **Processing screen** (two-column): **Sidebar** ("Tasks in session" + `n/total` + progress bar + task list: number, name, attribute tags, ✓ when assigned) | **Main** (step breadcrumbs + task name + stressor/next-action breadcrumb + option-card grid for the current attribute with the hint "Choose with a key or click, confirm ↵ · skip Esc" + **"← Back"** at the bottom).
- **Done screen**: ✓ + "Processed N tasks" + **"Next"** → `focus`.

## Actions

| Action | Description | Entity | Notes |
|--------|-------------|--------|-------|
| Assign Context / Energy / EstimatedTime | Assign the task an attribute (one Context, Energy 1–3, a time preset) in a processing step. | Task | Option-card + key + Enter; one step per missing attribute (ADR 0012). |
| Skip attribute | Skip a given attribute (Esc) — leave null. | Task | A nudge, not a gate (ADR 0007); a task without the attribute doesn't enter sessions that require it (ADR 0013). |
| Edit Task | Popraw tekst taska na miejscu. | Task | Inline w processing (ACTIONS.md: scope process). |
| Delete Task | Delete the task → jump to the next. | Task | |
| Start session ("Start") | Build the step queue and enter processing. | — | [↵] on the summary. |
| Back / Jump | ← wstecz o krok; klik w sidebarze = skok do taska. | — | Nawigacja 1:1 jak `dopadone`. |
| Proceed („Dalej") | Po done → `focus`. | — | Stepper Runu (ADR 0001). |

## Edge Cases
- **Nothing to process** (all tasks described / no tasks): empty state "All done" + "Next" straight to `focus`.
- **Task z wszystkimi 3 atrybutami**: nie trafia do sesji (`buildSession` pomija).
- **Skipped attribute (skip)**: the attribute stays null → the task won't appear in sessions filtered by that attribute (Context/Energy); without time → `focus` with no set time (default timer). A conscious user choice, not an error (ADR 0013).
- **Going back (Back) to an already-assigned step**: pre-fill with the current value — change it or leave it.
- **Jump to a task mid-session**: click in the sidebar → its first missing step; the others' progress (✓) preserved.
- **Deleting a task mid-session**: `ConfirmDialog` confirmation (consistent with `decompose`); after deletion, jump to the next, and emptying the session → summary (not done with zero).
- **Editing the name to empty**: an empty draft cancels the edit (keeps the original) — doesn't silently delete (like `decompose`).
- **Very long task name**: truncation in the sidebar; in main `line-clamp-2` + tooltip (design decision); the stressor header and breadcrumb shortened (`truncate` + tooltip).
- **Long session (many tasks/attributes)**: one step per screen — not a whole list; the sidebar provides orientation (list with `max-h` + scroll, current task auto-scrolled into view).
- **Going back from the first step**: "← Back" always visible; from `idx 0` → summary screen (no dead-end).
- **Keyboard and focus**: the global handler doesn't capture keys when a button/card/link is focused — Enter works via native activation (no double-fire).
- **LocalStorage read/write error**: toast + retry on a failed write; `commit`/`edit`/`delete` advance **only after a successful write** (honest persistence — the UI always reflects the saved state), and after a successful `retry` the effect completes the commit. The toast aggregates the status of three stores (tasks/stressors/nextActions).
- **Returning to `process` after `focus`**: `buildSession` recomputes missing attributes; changing an attribute here overwrites (Edit Task within process scope). *(Position in the session — `screen`/`cursorIndex` — is ephemeral; refresh returns to summary. No work is lost.)*

## Integration Points
- **`decompose`**: input — receives tasks (with stressor/next-action membership), in stress-rank order.
- **`focus`**: output — passes attribute-described tasks (Context / Energy / EstimatedTime) to `SessionFilter`. **`EstimatedTime` = the source of the timer value** in the session.
- **`capture` / `decompose` (motivation)**: no direct flow; `process` is purely about attributes.
- **`run`**: lives inside the active Run; the progress stepper (ADR 0001) leads through the funnel steps.
- **App shell (ADR 0001)**: the stage renders in `AppShell` (`/process`); no free-floating nav links — leading, not a menu.
- **External pattern**: `marekbrze/dopadone` `src/components/ProcessingView.tsx` — the reference for display and navigation logic (ADR 0012).
