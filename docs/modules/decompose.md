# Decompose

## Vision
The funnel's bridge: for each ranked stressor — **one at a time, individually**, starting from the most stressful — `decompose` helps answer two questions: **WHY this is important** and **HOW to smartly push it forward**. This is where the app's main driver plays out: **a large task paralyzes; it needs to be broken down** (primary persona = ADHD; also anyone overwhelmed).

Both halves of the module use **the same pattern — a prompt is shown, the user fills it in or skips it** (a nudge, not a gate; consistent with `capture`):
- **WHY** — motivational material (reasons + done vision), "charging the battery" that `focus` consumes later.
- **HOW** — next-actions written in **active, concrete language**, with big ones broken into small, doable tasks.

`decompose` doesn't just produce tasks — **it also stores the motivational fuel** that returns on the `focus` screen when the user faces a hard task ("remember why you're doing this").

`decompose` is also the place where you can see **work progress** on a stressor: tasks already resolved (`completed` / `dismissed` — set in `focus` or from the `run` list) appear in the action list **shown as resolved** (read-only), and a fully resolved next-action is visually de-emphasized. Returning to `decompose` after a session doesn't pretend nothing happened (ADR 0057).

## User Flows

### Per-stressor (repeats for each one, in ranking order)
1. The user enters `decompose` → sees **one stressor** (the most stressful first) pulled to the center of the screen.
2. **The WHY block (motivation)** shown immediately (not hidden):
   - the user adds **reasons** (a few), each with a **valence** — *positive* (gain: "what I gain when I finish this") or *negative* (costs of inaction: "what awaits me if I don't do this");
   - optionally a **positive done vision** — a vivid, sensory description (text + emoji) of the done state (payoff);
   - they can **skip** the whole block and move on.
3. **The HOW block (next-actions)**: the user types next-actions (Enter adds another, like brain dump in `capture`).
   - Each next-action **written in active, concrete language** (a verb at the start, physically doable).
   - Under each next-action a **"How can you break this down?" prompt** appears: the user types smaller steps (→ tasks) or **skips** (→ the next-action becomes 1 concrete task).
4. **≥1 next-action required** to move to the next stressor (otherwise there's nothing to process).
5. **"Next"** → next stressor; the Run progress stepper advances (ADR 0001).

### Exiting the module (`decompose` → `process`)
1. After the last stressor → hand-off of the tasks (with their next-action/stressor affiliation) to `process`.
2. The condition is automatically met: ≥1 next-action per stressor yields ≥1 task, so there's always something to process.

## Screens (rough)
- **Single-stressor view**: the stressor prominent in the center; below it the **WHY block** — a list of reasons with a valence marker (positive/negative), a field for the done vision (text + emoji) and a "skip"; lower down the **HOW block** — a field to add next-actions (Enter) with the list of added ones, and under each a "How can you break this down?" prompt with the resulting tasks; a **"Next"** button (disabled without ≥1 next-action) + a progress indicator (which stressor of N).
- **Task status in the HOW block (read-only, ADR 0057)**: next to each task under a next-action, a **state marker** when it's `completed` (✓) or `dismissed` (⊘ + a "not relevant" label, muted — neutral, **not** red); next to the next-action a **progress counter** `X/N done` (where done = `completed` + `dismissed`, consistent with `Run.progress`), shown when ≥1 task is resolved; a next-action whose tasks are **all** resolved → strike-through + muted (de-emphasis), but still fully editable (edit / break down / delete). States `skipped` / `active` are invisible in the MVP (rendered neutrally).

## Actions

| Action | Description | Entity | Notes |
|--------|-------------|--------|-------|
| Add Reason | Add a reason why the stressor is important, with a positive (gain) or negative (avoiding pain) valence. | Reason | WHY block; a few per stressor. |
| Add DoneVision | Describe a positive done vision — the done state, vivid text + emoji. | Stressor | Optional, 0..1 per stressor (`doneVision`). |
| Skip motivation | Skip the whole WHY block and go to next-actions. | — | WHY never blocks. |
| Add NextAction | List what will push the stressor forward (Enter adds another). | NextAction | **Active, concrete language** (a verb, doable). |
| Decompose into Tasks | Under a next-action: answer the "How can you break this down?" prompt → smaller tasks. | Task | Prompt + skip; skip = 1 task. |
| Edit / Delete NextAction | Change text / delete. | NextAction | |
| Proceed ("Next") | Next stressor; after the last one → `process`. | — | Per stressor: ≥1 next-action. |
| View task status (read-only) | Task state marker under a next-action (`completed` ✓ / `dismissed` ⊘ "not relevant"); `X/N done` counter; a fully resolved next-action — de-emphasized. | Task | **Read-only** — state is mutated by `focus` (Done/Dismiss) and `run` (Mark done/not-relevant); `decompose` only displays it. ADR 0057. |

## Edge Cases
- **No idea for a next-action ("I don't know how to start this")**: a real state for an overwhelmed/ADHD user — but the module **requires ≥1 next-action** to move on. The app guides with prompts ("How can you break this down?" + examples of active actions: "call…", "send…", "deposit…") to get unstuck, instead of forcing invention on a blank slate.
- **Skipped motivation**: nothing happens — the WHY block is optional; `focus` simply has no motivational material to show for this stressor.
- **Next-action without break-down**: skip "How can you break this down?" → next-action = 1 concrete task.
- **Too generic/vague next-action**: the app models active language in prompts and examples, pulling the user toward concrete, doable phrasings (standard: ADR 0006).
- **Single stressor**: trivial flow (one single view → `process`).
- **Very many next-actions/tasks**: break-down should help, not drown — keep **one stressor per screen** (not the whole list).
- **LocalStorage read/write error** *(after `proto-harden`)*: a toast over the screen + retry on a failed save (quota/disabled), information on a corrupted read; the UI state always reflects what is actually saved (honest persistence).
- **Deleting a next-action (with its tasks) / a reason** *(after `proto-harden`)*: a confirmation dialog (AlertDialog-style), not undo — a design decision different from `capture`/ADR 0004.
- **Editing a next-action to empty** *(after `proto-harden`)*: an empty draft cancels the edit (keeps the original), doesn't silently delete — deletion is a separate explicit action.
- **Re-breaking-down the same next-action** *(after `proto-harden`)*: tasks with unchanged text keep their identity (id + any attributes), so returning to `decompose` after `process`/`focus` won't wipe assigned `context`/`energy`/`estimatedTime`.
- **Next-action without tasks**: no progress counter (`0/0` would be confusing) — a "to break down" label remains.
- **Mix of states under a next-action** (e.g. 1 done, 1 pending): `1/2 done` counter, no de-emphasis (de-emphasis only when **all** tasks are resolved).
- **Re-breaking-down a next-action with done tasks** *(after `proto-harden`)*: `replaceTasksForNextAction` diff-by-text preserves `state` for tasks with unchanged text → their marker survives; removed text = removed task (state disappears with it); the same text added again = a fresh `pending`. De-emphasis and the counter are computed live, so they self-correct.
- **Task without `state` (old/migrated data) or an unknown state**: rendered neutrally (like `pending`) — a guard, doesn't crash.
- **`dismissed` ≠ `completed`**: a distinct glyph + label, but **both calm** — irrelevant is NOT red (DESIGN.md: anti-ref "harsh red alarm").
- **a11y of state**: state conveyed via glyph + text (e.g. `aria-label="…: done"` / "…: not relevant"), not only by color/strike-through.
- **A fully resolved next-action is still editable**: read-only applies to the **state** of tasks, not to next-action CRUD — text edit, break-down, and deletion work as usual.

## Integration Points
- **`capture`**: entry — takes the ordered (ranked) stressors.
- **`process`**: exit — hands off the tasks (with their next-action/stressor context) to be described with attributes (Context / Energy / EstimatedTime).
- **`focus`**: **consumer of the motivational material** (Reasons + DoneVision) — surfaces it e.g. on a hard task as "remember why you're doing this". `decompose` charges the battery that `focus` consumes.
- **`focus` / `run` → `decompose` (state read)**: `completed` / `dismissed` set in `focus` (Done/Dismiss) and from the `run` list (Mark done/not-relevant) are now **visible** in the `decompose` HOW block as read-only markers + a progress counter (ADR 0057). It's the same shared `Task` entity — `decompose` only reads `state`.
- **`run`**: lives inside the active Run; the progress stepper (ADR 0001) guides through the stressors.
- **App shell (ADR 0001)**: the stage renders in `AppShell`; no free navigation links — guidance, not a menu.
