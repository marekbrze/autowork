# 0012 - process replikuje step-walkthrough inboxa z dopadone

**Date**: 2026-06-28
**Module**: process
**Status**: Accepted

## Context
Podczas detailing `process` user wskazał jednoznaczne źródło wzorca: **„dokładnie jak w moim projekcie `marekbrze/dopadone` (`ProcessingView`)"** — inny zestaw kroków, ale ta sama logika wyświetlania. Kluczowy akcent: **nawigacja przód/tył** ma być wierna referencji. Do tej pory `MODULES.md` opisywał `process` tylko ogólnie („przypisuje się Context/Energy/EstimatedTime, styl inbox GTD"), bez określenia mechaniki ekranów i nawigacji.

## Decision
Apply the `dopadone` `ProcessingView` mechanics 1:1 in `process`:
- **3 screens** (state machine): `summary` ("to process" stat-cards + "Start") → `processing` → `done` (celebration);
- **a flat micro-step queue** `allSteps[]` — one `{task, kind}` step per **missing** attribute; not a "form per task";
- an **option-card grid** with key badges + **pending → confirm (Enter)** + **skip (Esc)** — the same muscle memory as the brain-dump in `capture` (a nudge, ADR 0007);
- **navigation**: advance (commit/skip → `idx+1`, at the end `done`), goBack (← / "Back", pre-fill), jump (click in the sidebar), delete (jump to the next task).

The `dopadone` steps (`area` / `project` / `energy` / `context` / `date`) → here **Context → Energy → EstimatedTime** (3 steps; no area/project — they don't exist in the domain). Deliberate departures from the reference: **no timer** in `process` (the timer's identity belongs to `focus`), **no mark-done** (done in `focus`), and **no convert-to-project** (no projects).

## Impact
- `docs/modules/process.md`: created — vision, flow (summary / processing / done), forward/back navigation, screens, actions, edge cases.
- `ACTIONS.md`: notka przy `Assign attributes` (wzorzec `dopadone` + klawiatura) + nowa akcja `Skip attribute`.
- Referencja: `marekbrze/dopadone` `src/components/ProcessingView.tsx` (prywatne repo autora; inspekcja przez GitHub API).
