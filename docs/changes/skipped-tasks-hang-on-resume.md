# Bug: Skipped tasks "hang" on Resume (session shows "3 of 3")

## Type
Bug (diagnosed by proto-bug)

## Severity
🟡 medium — misleading on the main Continue/Resume loop, but the data is safe (skips are visible in the pool via edit-1 from ADR 0034; a fresh Start restores them). No data loss, hence not 🔴; the user reports it as a bug on a primary flow, hence higher than 🟢.

## Reproduction
1. `npm run dev` → enter `/focus` with a filter of ≥3 matched tasks → **Start**.
2. On the task screen click **Skip** ×2 (t0, t1 → `skipped`); reach t2.
3. Leave the session: either **Exit** (`FocusView.tsx:287`), or **← Dashboard** (unmount, `App.tsx` route swap).
4. Return to `/focus` → the **"Resume session"** banner shows the position (e.g. "3 of 3"). Click **Resume**.

**Expected** (the accepted model — Resume unchanged, ADR 0038): Resume lands where you left off (t2); the skipped t0, t1 are **deferred** and return on a fresh Start, and the position indicator **communicates that clearly** — not "3 of 3" suggesting t0, t1 are done.
**Actual**: Resume on t2, the indicator **"3 of 3"** — t0, t1 "hang" (look handled, but are only deferred). Additionally, after leaving via **Exit**, t0, t1 are already `pending` (the early reset `:290`), so in the pool they look like ordinary to-dos that Resume won't reach.
**Reliability**: every time, for any session with ≥1 skipped task before the current one.
**Location**: `src/modules/focus/components/FocusView.tsx` — `exit()` `:287-293` (the early `returnSkippedToPool` `:290`), `resumeSession()` `:207-213`, the position indicator passed to `FocusTaskScreen` `:399`. Module: `focus`, screen: FocusTaskScreen, action: Skip → exit → Resume.

## Root cause
**Class**: logic (+ a communication/UX indicator issue).

**Cause**: Two linked defects under the accepted model (Resume = where you left off; Skip = temporary, returns on a fresh Start, `start()` `:194`):

1. **`exit()` resets skips early** — `returnSkippedToPool()` (`:283-285`) called in `exit()` (`:290`) flips `skipped → pending` already on exit, not on a new session. This breaks the model (skips return at the *next session* = a fresh Start, not on Exit) and creates an inconsistent state: after Exit the skipped tasks are `pending`, but they sit **behind the resume cursor** (`firstPendingFrom` `:127-133` scans forward from the cursor; `resumableSnapshot` `:167-171`) → Resume won't reach them, and in the pool they look like ordinary to-dos. Leaving via **navigation to the Dashboard** (unmount) doesn't do this — skips stay `skipped` = correctly deferred. So two lawful exits give **different state**.

2. **The position indicator misleads** — `position={{ index: activeCursor, total: queue.length }}` (`:399`) renders "3 of 3", counting the deferred-behind tasks as if they were handled. The user sees "3 of 3" and assumes t0, t1 are done — hence the "hang" feeling.

This is exactly the **"resume-snapshot interaction with the restored-to-pending tasks"** that ADR 0034 foresaw in its Impact section as a deeper cause, and that the prior diagnosis's regression-scope (`skip-removes-task-from-pool.md:68`) flagged as a known quirk ("`exit()` resets skipped → pending *and* keeps the resume snapshot").

**Evidence**:
- `src/modules/focus/components/FocusView.tsx:290` — `returnSkippedToPool()` in `exit()`; early (the main restore moment is `start()` `:194`).
- `FocusView.tsx:127-133` — `firstPendingFrom` only advances on `pending`; a forward scan from `start`.
- `FocusView.tsx:167-171` — `resumableSnapshot` = `firstPendingFrom(snapshot.queue, snapshot.cursor)`; the cursor is past the skips.
- `FocusView.tsx:207-213` — `resumeSession` restores `snapshot.cursor`; doesn't reset skips.
- `FocusView.tsx:399` — `position={{ index: activeCursor, total: queue.length }}` → "3 of 3".
- `FocusView.tsx:161-163` — snapshot-sync writes `{ queue, cursor }` during the session (cursor past the skips).
- `FocusView.tsx:283-285` — `returnSkippedToPool` (the only `skipped → pending` path).
- Spec (intent): `docs/modules/focus.md` §"Early exit (Exit)" — *"resume → continues from the same task"*; §"Skip vs Dismiss" — Skip *"returns as `pending` at the next session (not appended to the current queue)"*; `src/modules/run/stats.ts:19` — *"`skipped` does NOT count (it returns in the next session)"*.

## Fix plan
The accepted direction (Option 2, ADR 0038): **Resume unchanged** (where you left off) + **fix the state and the indicator**. Skips return on a fresh Start (already so, `:194`).

1. **`FocusView.tsx:290` — remove the early reset from `exit()`.**
   - now: `exit()` calls `returnSkippedToPool();`
   - change: remove that call from `exit()` (keep it in `clearCompleted` `:327` and `onNewSession` `:429` — those are session-end boundaries, idempotent).
   - why: skips should stay `skipped` (= deferred) until a fresh Start; the early reset creates `pending`-behind-the-cursor tasks unreachable on Resume and inconsistent with Dashboard-navigation. Removing it unifies the state (Exit and Dashboard give the same `skipped`).
2. **`FocusView.tsx:399` + `FocusTaskScreen` — a "deferred vs handled" indicator.**
   - now: `position={{ index: activeCursor, total: queue.length }}` → "3 of 3".
   - change: in `FocusView`, count the tasks in `queue` before `activeCursor` that are in the `skipped` state (deferred, not done) and pass it to `FocusTaskScreen` (e.g. `deferredEarlier`); render e.g. "Task 3 of 3 · 2 deferred (back next session)" only when `deferredEarlier > 0`.
   - why: "3 of 3" counts the deferred-behind tasks as handled → misleading.

**Spec impact**: none for change 1 (the code should match the spec). For change 2 — an optional one-line note in `docs/modules/focus.md` §Edge Cases that the indicator distinguishes deferred (skip) from handled (done).

## Regression scope
- `FocusView.tsx:327` (`clearCompleted`) and `:429` (`onNewSession`) — still call `returnSkippedToPool`; leave them (idempotent end-of-session safety). Verify: they don't need the early reset from `exit`.
- `attributed` (`FocusView.tsx:78-90`, admits `pending`||`skipped`) — removing the exit-reset doesn't affect it; skips still visible in the filter. Verify: after Exit the skips are still in `matchCount`.
- `start()` (`:190`, `:194`) — still restores skips on a fresh Start. Verify: after Exit → fresh Start → skips return to the queue.
- `resumeSession()` (`:207-213`) — behavior unchanged (where you left off); now consistent (skips stay `skipped`). Verify.
- `FocusTaskScreen` — a new `deferredEarlier` prop; verify other uses of `position` and that the deferred info shows only when > 0.
- Snapshot auto-prune (`:174-176`) — unchanged.
- Storybook (`FocusTaskScreen`/`FocusView`) — if there's a position-text assertion, update it.
- Related edge cases → `proto-edgecases [focus]`: Resume after skipping everything; Resume when Back restored a task before the skips; multi-tab skip + resume.

## Routing
| Step | Skill / action | Target | What |
|------|----------------|--------|------|
| 1 | (direct edit) | `src/modules/focus/components/FocusView.tsx:290` | remove `returnSkippedToPool();` from `exit()`; why: skips deferred until Start, unifies the state. |
| 2 | (direct edit) | `FocusView.tsx:399` + `FocusTaskScreen` | pass `deferredEarlier` (skipped before the cursor) + render "· N deferred"; why: the indicator should distinguish deferred from handled. |
| 3 | proto-polish (optional) | `focus` | final indicator copy/layout + a11y. |
| 4 | proto-edgecases (optional) | `focus` | a skip × Resume lifecycle scan (refresh, multi-tab, all-skipped). |

This is a **logic fix** (the early reset) + a **communication** one (the indicator) — not a missing state (→ not `proto-harden`), not purely visual (→ `proto-polish` optionally for copy).

## Hand-off
Apply direct-edit 1 (remove `returnSkippedToPool` from `exit()` `:290`) and 2 (a "deferred" indicator at `:399` + `FocusTaskScreen`). Then verify via the repro path: Skip ×2 → Exit → Resume → the indicator shows "· 2 deferred" (not "3 of 3"), and a fresh Start restores t0, t1. Regression sites: `clearCompleted`/`onNewSession` (`:327`, `:429`), `attributed` (`:78-90`), `start` (`:194`).
