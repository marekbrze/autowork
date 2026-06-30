# Bug: Skip removes tasks from the available pool (acts like „Not relevant")

## Type
Bug (diagnosed by proto-bug)

## Severity
🔴 high — Skip and Dismiss („Not relevant") are **two different actions by design** (ADR 0017): Skip = „nie teraz, wrócę" (task lives, returns as `pending` next session); Dismiss = terminal, never returns. In practice, the moment the user leaves a focus session by **any path other than the Exit / New-session / Clear buttons** — i.e. navigating to the Dashboard (the app's primary „Continue" loop), refreshing, or abandoning the resume snapshot — every skipped task is **stuck in `skipped` forever**, invisible in the filter and never re-queued. There is **no in-UI recovery**: skipped tasks persist in `decompose:tasks` but nothing surfaces them again, so to the user Skip is indistinguishable from Dismiss. A silent loss of access to work on a core action, and it collapses the key Skip/Dismiss distinction the spec is built around. Not true deletion (data sits in storage), hence arguably 🟡 — but the user reports it as exactly the wrong behaviour on a primary flow, so 🔴.

## Reproduction
1. `npm run dev`, go to `/focus`, pick a filter with ≥2 attributed tasks, **Start**.
2. On a task screen, click **Skip** → task becomes `skipped` (`FocusView.tsx:226`), session advances.
3. **Do not** click Exit / New session / Clear. Instead click **← Dashboard** (`FocusView.tsx:427`) or any FunnelStepper link → `FocusView` unmounts (`App.tsx:41`, route swap). (Equivalently: refresh the page, or come back later via Dashboard → Continue, or abandon the „Resume" banner.)
4. Re-enter `/focus`.

**Expected**: the skipped task is **still in the available pool** — counted in the filter's match count and queued when you Start the next session — because Skip is „nie teraz, wrócę… przy następnej sesji / następnym filtrowaniu" (`docs/modules/focus.md:26,33,57`; `docs/GLOSSARY.md:38`; `docs/ACTIONS.md:65`; `src/modules/run/stats.ts:19`).
**Actual**: the skipped task is **gone from the pool** — filter match count excludes it, Start never queues it. It behaves exactly like Dismiss („Not relevant"), which is the *only* action meant to remove a task permanently.
**Reliability**: every time, for any task, as long as the user leaves via a non-button path (which is the norm in a Dashboard-„Continue"-driven app). Skip works *only* if the user exits the session through the Exit button, the summary's „New session", or Clear-completed.
**Location**: pool definition `src/modules/focus/components/FocusView.tsx:79` (admits only `state === 'pending'`); the only reset path `returnSkippedToPool` `FocusView.tsx:270-272`, called from just three handlers — `exit` (`:277`), `clearCompleted` (`:314`), `onNewSession` (`:416`). Module: `focus`, screen: SessionFilter / FocusTaskScreen, action: Skip → navigate away → return.

## Root cause
**Class**: logic — **the „skip returns to pending" reset is wired to the wrong set of triggers** (three specific buttons) instead of to the actual session boundary / pool definition.

**Cause**: The pool of workable tasks is `attributed`, defined as `tasks.filter((t) => t.state === 'pending' && …attributes)` (`FocusView.tsx:79`). So a task is „in the pool" **iff it is `pending`**. Skip sets `skipped` (`:226`), which immediately drops it out of `attributed` — out of the match count, out of the next queue. The only thing that ever brings a skipped task back is `returnSkippedToPool()` (`:270-272`), which flips all `skipped → pending`.

That reset is invoked from **only three places**: `exit()` (`:277`), `clearCompleted()` (`:314`), and the summary's `onNewSession` (`:416`). Every other way of „coming back to the filter" never calls it:

- **Navigate away (the common case)** — clicking **← Dashboard** (`:427`) or any FunnelStepper link swaps the route (`App.tsx:41`) and **unmounts `FocusView`**. There is **no unmount cleanup** (only three `useEffect`s at `:140,153,166`, none returns a destructor), so skipped tasks stay `skipped`.
- **Refresh / browser-close mid-session** — fresh mount, `screen` resets to `'filter'` (`:58`); no reset runs.
- **Abandon the resume snapshot** — `onAbandon={removeSnapshot}` (`:362`) only deletes the snapshot; skipped tasks from that session are not restored.
- **Session exhausts → summary, then navigate away** — `advance()` reaches summary (`:208-212`) without resetting; only the summary's „New session" button resets, so leaving summary any other way leaks.
- **Snapshot auto-pruned as non-resumable** — the effect at `:166-168` removes a dead snapshot but does not reset skipped tasks.

So the design's correctness hinges on the user always exiting through one of three buttons. In a Dashboard-„Continue"-centric app, they routinely don't — and every such departure silently strands skipped tasks in `skipped`, which `attributed` (`:79`) then excludes forever. The data model treats `skipped` as „resolved enough to hide", but the spec says `skipped` is **temporary** and must return (`focus.md:26`: *„wraca jako `pending` przy następnej sesji (nie doklejane do bieżącej kolejki)"*; `stats.ts:19`: *„`skipped` NIE liczy się (wraca w kolejnej sesji)"*).

**Evidence**:
- `src/modules/focus/components/FocusView.tsx:79` — pool filter `t.state === 'pending'` ⇒ `skipped` excluded; this is the line that makes a skipped task „disappear".
- `src/modules/focus/components/FocusView.tsx:226` — `skip()` sets `state: 'skipped'`.
- `src/modules/focus/components/FocusView.tsx:270-272` — `returnSkippedToPool`, the *only* restore path; called from `:277`, `:314`, `:416` and nowhere else (grep `returnSkippedToPool` → 1 definition + 3 call sites).
- `src/modules/focus/components/FocusView.tsx:427` — `<Link to="/">` ← Dashboard; raw navigation, no reset. Combined with route swap at `src/App.tsx:41` (unmount, no cleanup at `:140,153,166`).
- `src/modules/focus/components/FocusView.tsx:362` — `onAbandon={removeSnapshot}` (no reset); `:166-168` — snapshot prune (no reset); `:208-212` — exhaustion → summary (no reset).
- `src/modules/decompose/types/task.ts:19` — `TaskState` incl. `skipped` (non-terminal by design).
- Spec (intent): `docs/modules/focus.md:26,33,57` (Skip = temporary, returns `pending` next session), `docs/GLOSSARY.md:38` (`Skip` wraca do `pending`; `Dismiss` terminal), `docs/ACTIONS.md:65` vs `:67` (Skip vs Dismiss), `src/modules/run/stats.ts:19` (skipped not counted as done). Prior audit `docs/modules/focus-edgecases.md:22` noted Exit „resetuje wszystkie skipped" but only fixed *session-position* persistence (the snapshot) — the cross-unmount skip leak was never addressed.

## Fix plan
**Chosen direction**: make the pool treat `skipped` as **available** (a deferral, not a resolution), and restore `skipped → pending` at the **start of each new session** — the true „następna sesja" boundary the spec names. This makes skipped tasks always visible in the filter and re-queued next session, and it **does not depend on which button the user clicks or on component-unmount timing**.

Three edits in `src/modules/focus/components/FocusView.tsx`:

1. **`:79` — include `skipped` in the pool.**
   - now: `.filter((t) => t.state === 'pending' && t.context && t.energy && t.estimatedTime)`
   - change to: `.filter((t) => (t.state === 'pending' || t.state === 'skipped') && t.context && t.energy && t.estimatedTime)`
   - why: a skipped task is still work-to-do; it must remain visible in the filter's match count (`matchCount`, `:105`) and eligible for the next queue, matching *„przy następnym filtrowaniu będę je robić"*.
2. **`:91` — stop counting `skipped` as „resolved".**
   - now: `.filter((t) => t.context && t.energy && t.estimatedTime && t.state !== 'pending')`
   - change to: `.filter((t) => t.context && t.energy && t.estimatedTime && (t.state === 'completed' || t.state === 'dismissed'))`
   - why: `resolvedAttributed` drives the „All tasks done — well done" empty-state branch (`SessionFilter.tsx:84-99`). With `skipped` now in the pool, it must not also count as resolved, or that branch mis-fires.
3. **`:182` (`start()`) — restore skipped → pending for the new session, before building the queue.**
   - add as the first line of `start()`: `returnSkippedToPool();`
   - why: with edit 1, skipped IDs enter `matched`, but the live session only advances on `pending` (`firstPendingFrom`, `:119-125`), so a still-`skipped` task would be queued yet never shown. Restoring to `pending` at the „new session" moment (Start; *not* Resume) makes them appear — and only here, so they do **not** re-appear in the session they were skipped in (spec: *„nie doklejane do bieżącej kolejki"*).

**Why not the surgical alternative** (add `returnSkippedToPool()` to unmount / abandon / exhaustion): an unmount cleanup captures a stale `tasks` closure (empty-deps effect ⇒ initial render; `tasks`-deps effect ⇒ fires mid-session), and React state-set-after-unmount is unreliable; it also wouldn't make skipped tasks *visible in the filter* before Start. The pool-redefinition above is robust to all of that and is fewer conceptual moving parts.

**Spec impact**: none — the change makes the code match the existing spec (`focus.md:26,33,57`). Optional clarification: add a one-line note to `docs/modules/focus.md` §Edge Cases that `skipped` is restored at the next **Start** (not on navigation), so the resume-snapshot interaction is documented.

## Regression scope
- `src/modules/focus/components/SessionFilter.tsx:84-99` — empty-state branching reads `totalAttributed` / `resolvedAttributed` (now redefined). Verify: all-skipped ⇒ shows the filter (not „all done"); all completed/dismissed ⇒ still shows „All tasks done". (Expected correct after edits 1+2.)
- `src/modules/focus/components/FocusView.tsx:105-111` (`matchCount`) and `:182-186` (`start`'s `matched`) — both derive from `attributed`; they now include skipped IDs. Verify Start queues and presents previously-skipped tasks.
- `src/modules/focus/components/FocusView.tsx:277,314,416` (`exit`/`clearCompleted`/`onNewSession`) — these still call `returnSkippedToPool`; with edit 3 they become **redundant but harmless** (idempotent no-ops when nothing is skipped). Optionally remove for clarity; leaving them is safe. **Pre-existing quirk to be aware of (not introduced here, not reported)**: `exit()` resets skipped → pending *and* keeps the resume snapshot, so Skip → Exit → Resume re-shows the task. Aligns with „do it next time"; leave as-is unless the user wants Skip preserved across resume.
- `src/modules/run/stats.ts:22-42` (`deriveRunStats`) and the dashboard/run stat tiles — read `state` directly (`completed`+`dismissed` = done; `skipped` not counted). Unaffected; skipped tasks reset to `pending` at next Start still aren't counted as done. Verify dashboard counts unchanged after a skip-then-navigate cycle.
- `src/modules/focus/components/FocusView.tsx:250-263` (`back`) and `:230-248` (`dismiss`/`undoDismiss`) — unrelated state transitions; verify still correct (no shared mutable state touched by the edits).
- Storybook: `FocusView.stories.tsx` / `SessionFilter.stories.tsx` — if any story asserts pool/match counts or the „all done" state with skipped tasks, update the expectation.
- Related edge cases worth a `proto-edgecases [focus]` sweep: refresh / browser-close mid-session with skipped tasks (fixed by this change), abandon-snapshot with skipped tasks (fixed), multi-tab skip (global reset on Start is consistent with the prototype's global task store, `stats.ts:13`). No cluster found beyond the skip lifecycle.

## Routing
| Step | Skill / action | Target | What |
|------|----------------|--------|------|
| 1 | (direct edit) | `src/modules/focus/components/FocusView.tsx:79` | now: `t.state === 'pending'`; change to: `(t.state === 'pending' \|\| t.state === 'skipped')`; why: skipped is available work, not resolved. |
| 2 | (direct edit) | `src/modules/focus/components/FocusView.tsx:91` | now: `t.state !== 'pending'`; change to: `(t.state === 'completed' \|\| t.state === 'dismissed')`; why: keep „all done" empty-state correct. |
| 3 | (direct edit) | `src/modules/focus/components/FocusView.tsx:182` (`start`) | add `returnSkippedToPool();` as first line; why: restore skipped at the „next session" boundary so they're queued and shown. |
| 4 | proto-edgecases (optional) | `focus` | sweep skip lifecycle across refresh / abandon / multi-tab now that the model changed. |

This is a **logic fix** (reset wired to the wrong triggers + pool definition excludes a non-terminal state) — no proto skill covers arbitrary logic corrections, hence the direct-edit plan. It is **not** a missing empty/error/loading state (so not `proto-harden`) and **not** visual (so not `proto-polish`).

## Hand-off
Apply the three direct edits in `FocusView.tsx` (`:79`, `:91`, `:182`), then verify along the reproduction path above: Skip a task → go to Dashboard → return to `/focus` → confirm the task is back in the filter's match count and is queued when you Start. Then check the regression sites, especially `SessionFilter.tsx:84-99` („all done" branch) and the dashboard stat tiles.
