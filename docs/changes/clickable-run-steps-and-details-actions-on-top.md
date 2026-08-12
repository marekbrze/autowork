# Feature: Clickable funnel stepper (navigation within a Run) + actions above the list on Run Details

## Type
Feature (planned by proto-feature)

## User goal
1. **Navigation within a Run via breadcrumbs (clickable stepper).** Today the funnel steps (Stressors › Ranking › Actions › Processing › Focus) are already rendered on the funnel screens (`FunnelStepper`), but **only for display** — you can't click them; movement is only via the "Next"/"Back" buttons. The user wants these already-displayed steps to be **simply clickable** — a jump to any step of the active Run.
2. **Actions above the list on Run Details.** Today on `/run/:runId` the order is: stats → task list (the longest) → Continue → Review/Archive/Delete at the very bottom. The user has to scroll a lot to reach the actions. All actions should land **above the task list**.

## MVP scope
**MUST** (confirmed with the user):
- **Part 1 — clickable stepper**: all 5 `FunnelStepper` stages become clickable navigation (Link → the active Run's step route). No blocking/locking of future steps — the user said outright "they should just be clickable". The call sites of the 5 funnel screens are **unchanged** (they render `<FunnelStepper current=... />`).
- **Part 2 — actions above the list**: the Continue block (or `RunCompleted`) and the management block (Review / Archive|Unarchive / Delete) move **above** the "Tasks" section on `RunDetails`. The task list moves to the bottom.

**DEFERRED → Later**:
- Locking future (unreached) steps in the stepper (MVP = all clickable; if tests show "decision paralysis" in the ADHD persona — restore as a harden option).
- Clickable steps / a stepper **on the Run Details page** (today Continue does smart-routing; step-links on details = convenience, not MVP).
- A "sticky" action bar on Details (always visible without scrolling) — consider in design/polish, not MVP.
- A stepper in the header/shell globally (today per-screen; stays).

## Impact map
- **New module?**: **no** — extends `run` (owner of the funnel-step model: `STEP_ROUTE`/`STEP_LABEL`/resume, `RunDetails`) and the **shared** component `FunnelStepper` (rendered on all Core funnel screens).
- **Modules affected**: **`run`** (both parts — the step model + `RunDetails` IA), **shared `FunnelStepper`** (part 1). The Core screens (`capture`/`decompose`/`process`/`focus`) **don't change** — they only consume the clickable stepper.
- **Cross-module integration**: risk #1 is **jumping to a step with unmet preconditions** (e.g. Focus with no tasks, Ranking with <2 stressors, Decompose with no stressors). Every screen must degrade gracefully to its empty-state — this is where `proto-edgecases`/`harden` hits.
- **Reversible decision**: **ADR 0001** ("No breadcrumbs") + **UI-STRATEGY.md:10,30** ("Breadcrumbs: No", "funnel steps … are not free links"). This feature **supersedes** that record — the funnel becomes freely navigable within the active Run. A new ADR records this.
- **Shared-doc additions**: `UI-STRATEGY.md` ("Breadcrumbs: No" → "Yes — clickable stepper"), `ACTIONS.md` (+ "Navigate to funnel step" under `Run`), `GLOSSARY.md` (optionally a "Click-through funnel steps" term), `ENTITY_MAP.md` (**unchanged** — no new entity/relation).

## Per-module changes

### run (primary — both parts)
- **Data**: no new entities/fields. Part 1 reuses the existing `STEP_ROUTE` (`src/modules/run/types/run.ts:70-77`) — but note: the stepper keys (`capture`) vs `STEP_ROUTE` (`brain-dump`) differ; a stage→route map is needed (see residual).
- **Actions**:
  - **NEW** "Navigate to funnel step" — a jump to any step of the active Run via the clickable stepper (Stressors/Ranking/Actions/Processing/Focus). Implied navigation on the active Run (`activeRunId`); no `runId` in the funnel URL → consistent with today.
  - Part 2 adds no action — it only **changes the IA** of `RunDetails` (moves existing actions higher).
- **Screens & flows**:
  - **Part 1**: `FunnelStepper` (shared, but spec-wise belongs to `run`) — `<span>` → `<Link to={route}>`. The active stage keeps `aria-current="step"`. Visual distinction of current/reached/unreached + hover/focus → design/polish.
  - **Part 2**: `RunDetails` — reorder the sections (see residual). Flow/entry unchanged (Continue still smart-routes).
- **States**: conditionally new (if `edgecases` finds gaps) — e.g. a micro-empty/orientation on a jump up to an empty step ("No tasks yet — start with breakdown"). Most screens already have empty-states; `harden` only fills gaps.
- **Edge cases** (→ `proto-edgecases run`): a jump to Focus with no tasks / Ranking <2 stressors / Decompose with no stressors / Process with no tasks; a backward jump during a paused session (the per-Run snapshot must survive); clicking the current step (no-op); the no-active-Run guard (`RequireActiveRun`); `RunDetails` consistency after the reorder in the archived (read-only) and completed (`RunCompleted`/celebration CTA now higher) states.
- **Design**: (1) clickable stepper — a low-noise affordance (ADHD persona: calm > loud, ONE brand-green accent, keyboard-reachable, ring token); distinguish current vs reached vs unreached without rainbow clutter. (2) the action group above the list — Continue primary (brand-green, chunky), Review/Archive secondary, Delete destructive; Things-3 spacing rhythm; possibly sticky on a long list (consider). Respect `DESIGN.md` (snappy/warm/rounded, Nunito, `--radius`, anti-slop).

### shared/FunnelStepper (part 1 — a cross-cutting component)
- A shared component, rendered by `BrainDump.tsx:109`, `Ranking.tsx:33`, `DecomposeView.tsx:73,121`, `ProcessView.tsx:406`, `FocusView.tsx:406`. Call sites **unchanged** (they pass `current`).
- **Edit**: `STAGES` gets a `route` per stage; render `<span>` → `<Link>`. See residual #1.

## Routing — which proto skill builds what
| Step | Skill | Target | What it does |
|------|-------|--------|--------------|
| 1 | proto-detail | `run` | Spec both parts: the clickable stepper (behavior, stage→route, MVP = all clickable, supersedes "no breadcrumbs") + the actions-above-list IA on `RunDetails`. Write shared-doc: `UI-STRATEGY` (the flip), `ACTIONS` (+navigate), `GLOSSARY` (optional), register a new ADR superseding 0001. |
| 2 | (direct edit — residual) | `FunnelStepper.tsx`, `RunDetails.tsx` | The mechanical foundation: spans→Links + a per-stage route (part 1); reorder the action blocks above the list (part 2). See residual below. |
| 3 | proto-edgecases | `run` (+ lightly the Core funnel) | Diagnose jumps to steps with unmet conditions, a backward jump vs a paused session, no-op on current, the active-run guard, archived/completed consistency after the reorder. |
| 4 | proto-harden | `run` | (Conditionally) implement new empty/orientation states if `edgecases` finds gaps beyond the existing empty-states. |
| 5 | proto-design → polish | `run` | Hi-fi: the clickable-stepper affordance (current/reached/unreached, hover/focus, calm) + the action group above the list (primary/secondary/destructive hierarchy, spacing, possibly sticky). |

## Residual — direct edits not covered by a proto skill

### #1 — Clickable `FunnelStepper` (part 1)
- **[`src/shared/components/FunnelStepper.tsx:8-14`]** — today: `STAGES` has only `{ key, label }`. **change**: add a `route` per stage — `capture`→`/capture`, `ranking`→`/capture/ranking`, `decompose`→`/decompose`, `process`→`/process`, `focus`→`/focus`. **why**: the stepper needs a navigation target; directly reusing `STEP_ROUTE` (`run/types/run.ts:70`) doesn't work because of a key mismatch (`capture` vs `brain-dump`) — an explicit `route` per stage is simplest and avoids a shared→module dependency. (Alternative: import `STEP_ROUTE` + a `capture→'brain-dump'` map.)
- **[`src/shared/components/FunnelStepper.tsx:27-39`]** — today: each stage is a `<span>` (display-only). **change**: render as `<Link to={s.route}>` (from `react-router-dom`); keep `aria-current={isActive ? 'step' : undefined}` and the current active/done styles. **why**: the user wants the already-displayed steps to be clickable — that's the whole of part 1.
- **Header comment (`FunnelStepper.tsx:1-7`)** — update: from "leading, not a menu (no links)" to "clickable navigation across the active Run's steps (supersedes ADR 0001)".

### #2 — Actions above the list on `RunDetails` (part 2)
- **[`src/modules/run/components/RunDetails.tsx:182-248`]** — today the section order is: stats (`182-184`) → Tasks (`188-203`) → Continue/`RunCompleted` (`206-226`) → management grid Review/Archive/Delete (`229-248`). **change**: move the Continue/`RunCompleted` block (`206-226`) and the management grid (`229-248`) so they sit **right after the stats section** (after `184`), and **before** the Tasks section (`188`). Target: header → stats → **Continue + management actions** → Tasks (list) → footer (`250-253`). **why**: the task list is the longest section; today Continue/Archive/Delete land under it → the user scrolls. Surfacing all actions above the list fixes the pain.
- **Reorder notes**: the `completed && !archived ? <RunCompleted> : <Continue block>` condition (`206`) and `archived ? Unarchive : Archive` (`236-244`) move to the new spot untouched; `ConfirmDialog` (`269`), `StorageStatusToast` (`255`), `DismissUndoToast` (`279`) are position-independent — untouched. In the archived state the list stays read-only (`R2-3`), the actions above it — consistent.

## Later (deferred)
- Locking unreached steps in the stepper (MVP = all clickable; restore if ADHD-persona tests show decision paralysis).
- Clickable steps/stepper on the Run Details page (alongside the Continue smart-route).
- A "sticky" action bar on Details (always visible without scrolling).
- A stepper/breadcrumbs globally in the shell header (today per-screen).

## Hand-off
Run in order: **(1) `proto-detail run`** — spec both parts + write shared-doc + a new ADR superseding "no breadcrumbs". **(2) residual direct edits** (`FunnelStepper.tsx`, `RunDetails.tsx`) — the mechanics. **(3) `proto-edgecases run`** → **(4) `proto-harden run`** (conditionally) → **(5) `proto-design`/`polish run`**. If the scope changes (e.g. locking steps or a stepper on details) — run `proto-feature` again, the plan will refresh. This doc is the base the next skills read.
