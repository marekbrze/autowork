# Feature: Focus — live background timer + time in the tab title

## Type
Feature (planned by proto-feature)

## User goal
The user works in a focus session and often switches to another tab in Edge (real work alongside). Two pain points:
1. **The tab title doesn't show the time** — so they can see at a glance in Edge's tab bar how long they've been on a task, without returning to the tab.
2. **The timer stops counting in the background** — Edge throttles/sleeps an inactive tab (the main-thread `setInterval` is throttled, and Sleeping Tabs can suspend a tab entirely). On return the timer is "behind", because it counted ticks, not time. The user wants the tab to **not go dark** and the timer to **keep running** even on an inactive tab.

## MVP scope
**MUST work (MVP):**
- The tab title shows the timer's live elapsed during a session (`12:34 — Autowork`), with a state suffix (`· paused` / `· over`). Outside a session / in the summary = the normal title (`Autowork`).
- The timer is **always correct** on return to the tab — a timestamp-based model (counts wall-clock time, not ticks). Zero drift even if the tab slept for 5 min.
- The timer **ticks live in the background** (the title updates every 1 s on an inactive tab): a Web Worker drives the tick + a Wake Lock keeps the screen/tab alive when visible. Resync on `visibilitychange`.

**Deferred (Later):**
- Any in-app keep-alive status indicator (e.g. a "tab active" icon). Invisible in the MVP; see the Design section.
- A system notification / sound on overtime or session end in the background (a separate feature).
- A 100% guarantee — from JS you can't forcibly forbid Edge from sleeping a tab after a very long time. The maximum: Worker + Wake Lock + resync. A return always snaps to the correct time (see Edge cases).

## Impact map
- **New module?**: **no** — extends `focus`.
- **Modules affected**: `focus` (the `Timer` mechanism + the tab-title side effect). No other module changes; `run`/`dashboard` unchanged (the title is browser chrome, not an app surface).
- **Cross-module integration**: **no** new entity relation. The risky point is **internal** to `focus` — the timestamp resync logic and visibility/pause in the rewritten `use-focus-timer.ts` (this is where correctness lives and where bugs hide).
- **Shared-doc additions** (written by `proto-detail`):
  - `ENTITY_MAP.md` — a note by the `Timer` entity: the timestamp-based mechanism (wall-clock, not ticks) + background correctness + Wake Lock behavior; the `timerElapsed` semantics unchanged (still an absolute number of seconds).
  - `ACTIONS.md` — by the `Timer` actions: addenda "stays accurate when tab is backgrounded/slept; resyncs on return" (Start/Pause-Resume) and System "keeps ticking in background via Web Worker; screen held awake via Wake Lock".
  - `GLOSSARY.md` — an addendum to `Timer` (background: correctness on return, the tab title, keep-alive) + possibly a "Keep-alive (background timer)" row.
  - `docs/modules/focus.md` — a new Edge case "Background tab / sleeping tab" + an addendum to the existing "Early exit / refresh / browser-back" and "Mid-session state change (another tab)".

## Per-module changes

### focus

#### Data
- **No new entities, no new fields.** `Timer` exists (ENTITY_MAP); `timerElapsed` (per `Task`) is semantically unchanged — still an absolute number of seconds, persisted throttled.
- The change is **mechanical, not model-level**: how it counts (ticks → wall-clock timestamp) and keeping the tab alive are an implementation detail of `Timer`, not new data.

#### Actions
- The `Timer` actions (Start / Pause / Resume / counts-past-estimate) are unchanged from the user's perspective.
- **New system behaviors** (a note in ACTIONS):
  - The timer stays correct when the tab is backgrounded / asleep; on return it snaps to the correct time.
  - The timer keeps ticking in the background via a Web Worker; the screen is held awake by a Wake Lock when the tab is visible.

#### Screens & flows
- **No new screens, no changes to existing screens.** `FocusTimer.tsx` (presentational) is unchanged.
- The tab title is a **side effect** of the session state — a side-effect, not a screen. Scope: only when `screen === 'session' && currentTask` (running or paused).
- Navigation unchanged.

#### States
- **No new user-facing states** (empty/error/loading). Fallbacks (no Worker / no Wake Lock) degrade **silently** to a main-thread interval / no sleep block — no UI, no message.
- One new, correct behavior on return from a long background period: the timer snaps forward (may jump into `overtime`). This is a correct result, not an error state.

#### Edge cases (the user's instincts + the obvious; full diagnosis → `proto-edgecases`)
- **Sleeping tab (Edge Sleeping Tabs)** — ticks may not fire at all; `visibilitychange` → visible forces a recompute from the timestamp → correct time immediately. (The correctness guarantee is independent of keep-alive.)
- **Pause in the background / resume in the background** — `running` flips; the hook must (re)capture `resumedAt` and freeze `baseElapsed` correctly even when the tab is hidden.
- **Return after a long background period** — snap forward (may land in overtime); an immediate persistence flush so nothing is lost.
- **Two tabs of the same session** — both tick → a `timerElapsed` write conflict (last wins). Related to the existing mid-session reconciliation (`storage` event). → `edgecases`.
- **No Wake Lock / Worker support** (old browser, no secure context) — silent degradation; the timer is still correct (timestamp).
- **Rapid transitions** (Done → next task quickly, Back, Skip) — `initialElapsed` changes; the `base` + `resumedAt` reset must be idempotent and not lose a second.

#### Design
- **No surface to design/polish.** The title = browser chrome; Wake Lock = invisible. `DESIGN.md` is **untouched**, no designed surface changes → this feature doesn't go through `proto-design`/`proto-polish`.
- (Later) any in-app keep-alive indicator would be a new surface → then `design`+`polish`. Deliberately omitted in the MVP.

## Routing — which proto skill builds what

This feature is **mainly a logic/mechanism change** (it adds no screens). So the classic `lofi → harden → design` funnel doesn't apply — the core is a residual direct-edit, and `detail`/`edgecases`/`harden` play a supporting role.

| Step | Skill | Target | What it does |
|------|-------|--------|--------------|
| 1 | `proto-detail` | focus | Spec the deltas: the timer mechanism (timestamp), the tab title, keep-alive (Worker + Wake Lock + resync). Write notes into ENTITY_MAP / ACTIONS / GLOSSARY + a new Edge case in `focus.md`. **Light.** |
| 2 | **(residual direct-edit)** | focus | Build the mechanism — see the Residual section below. This is the feature's core. |
| 3 | `proto-edgecases` | focus | Diagnose the background/visibility/pause/multi-tab edge cases on the built mechanism (`focus-edgecases.md` re-audit). |
| 4 | `proto-harden` | focus | **Only conditionally** — if `edgecases` finds a user-facing gap. Most fallbacks are silent; likely minimal. |

**Deliberately omitted:** `proto-lofi` (no new screens), `proto-design` / `proto-polish` (no on-screen change), `proto-highlevelui` (no impact on the shell/nav).

**Sequence:** `detail` (spec) → residual (build the mechanism) → `edgecases` (stress-test) → `harden` (if needed). You can skip `detail` and go straight to residual if the user wants to move fast — the plan has enough detail.

## Residual — direct edits not covered by a proto skill

The implementation core. All files in `src/modules/focus/`.

- **[`src/modules/focus/hooks/use-focus-timer.ts:19-45`]** — **RISKY, this is where correctness lives.** Today: tick accumulation (`setInterval(prev => prev + 1)`, 1000 ms). Change to a **timestamp-based model**:
  - Add refs: `baseRef` (seconds frozen on pause/task-change) and `resumedAtRef` (wall-clock ms of the last resume).
  - `compute() = baseRef + floor((Date.now() - resumedAtRef)/1000)` when running, otherwise `baseRef`.
  - `running` → true: `resumedAtRef = Date.now()`, start the tick (Worker, fallback: main-thread `setInterval`). `running` → false: `baseRef = compute()`, stop the tick.
  - The reset effect on `initialElapsed` (`:27-30`): also reset `baseRef = initialElapsed` and `resumedAtRef = running ? Date.now() : null`.
  - A `visibilitychange` listener: when `visible && running` → `setElapsed(compute())` (force a snap — a safeguard in case ticks were entirely dropped by a sleeping tab) + an immediate flush.
  - `onPersist` (throttled every ~5 s), unmount-flush, and the `flush()` API are **unchanged** — consumers (`FocusView`) untouched.
- **[`src/modules/focus/workers/timer-tick.worker.ts`]** — **new file.** A Worker with `setInterval(() => postMessage('tick'), 1000)`; the Worker's tick is throttled far less in the background than the main-thread one. Created via `new Worker(new URL('./timer-tick.worker.ts', import.meta.url), { type: 'module' })` (Vite supports this natively). Fallback: if `typeof Worker === 'undefined'` or construction throws → main-thread `setInterval` (timestamp correctness is guaranteed regardless). The Worker is terminated in cleanup.
- **[Wake Lock]** — in the hook or a new `src/modules/focus/hooks/use-wake-lock.ts`: when `running && !document.hidden` → `navigator.wakeLock.request('screen')` (keeps the screen/tab alive when visible — the lever on "the tab can't go dark"); release on pause/hidden/unmount; re-acquire on `visibilitychange → visible`. Guard `if ('wakeLock' in navigator)`. Silent degradation when unavailable.
- **[`src/modules/focus/hooks/use-focus-tab-title.ts`]** — **new file.** `useFocusTabTitle({ active, clock, paused, over })`: on mount it reads `document.title` (base = `Autowork` from `index.html:6`); when `active` it sets `${clock}${paused ? ' · paused' : ''}${over ? ' · over' : ''} — ${base}`; on unmount it restores the base. UI copy in English (per the app convention).
- **[`src/modules/focus/components/FocusView.tsx:214-218`]** — right after `useFocusTimer`, wire `useFocusTabTitle({ active: screen === 'session' && !!currentTask, clock: formatClock(elapsed), paused: screen === 'session' && !running, over: currentTask?.estimatedTime != null && elapsed > currentTask.estimatedTime * 60 })`. Import `formatClock` from `../types/focus`.

## Later (deferred)
- An in-app keep-alive status indicator (a new surface → then `design`+`polish`).
- A notification/sound on overtime or session end when the tab is in the background.
- A full guarantee against Edge sleeping the tab after a very long time (beyond JS's reach; resync always corrects the value on return).

## Hand-off
Run in order: `proto-detail focus` (spec the deltas + shared-doc notes) → the residual direct-edits above (the core) → `proto-edgecases focus` → possibly `proto-harden focus`. The plan is the base those skills read. If the scope changes — run `proto-feature` again.
