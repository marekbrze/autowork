# 0012 - process replikuje step-walkthrough inboxa z dopadone

**Date**: 2026-06-28
**Module**: process
**Status**: Accepted

## Context
Podczas detailing `process` user wskazał jednoznaczne źródło wzorca: **„dokładnie jak w moim projekcie `marekbrze/dopadone` (`ProcessingView`)"** — inny zestaw kroków, ale ta sama logika wyświetlania. Kluczowy akcent: **nawigacja przód/tył** ma być wierna referencji. Do tej pory `MODULES.md` opisywał `process` tylko ogólnie („przypisuje się Context/Energy/EstimatedTime, styl inbox GTD"), bez określenia mechaniki ekranów i nawigacji.

## Decision
Zastosować w `process` mechanikę `dopadone` `ProcessingView` 1:1:
- **3 ekrany** (maszyna stanów): `summary` (stat-cards „do przetworzenia" + „Rozpocznij") → `processing` → `done` (celebracja);
- **płaska kolejka mikrokroków** `allSteps[]` — po jednym kroku `{task, kind}` na **brakujący** atrybut; nie „formularz na task";
- **option-card grid** z badge'ami klawiszy + **pending → confirm (Enter)** + **skip (Esc)** — ta sama pamięć mięśniowa co brain-dump w `capture` (nudge, ADR 0007);
- **nawigacja**: advance (commit/skip → `idx+1`, na końcu `done`), goBack (← / „Wstecz", pre-fill), jump (klik w sidebarze), delete (skok do następnego taska).

Kroki `dopadone` (`area` / `project` / `energy` / `context` / `date`) → u nas **Context → Energy → EstimatedTime** (3 kroki; brak area/project — nie ma ich w domenie). Świadome odejścia od referencji: **brak timera** w `process` (tożsamość timera należy do `focus`), **brak mark-done** (done w `focus`) i **brak convert-to-project** (brak projektów).

## Impact
- `docs/modules/process.md`: utworzony — wizja, flow (summary / processing / done), nawigacja przód/tył, ekrany, akcje, edge cases.
- `ACTIONS.md`: notka przy `Assign attributes` (wzorzec `dopadone` + klawiatura) + nowa akcja `Skip attribute`.
- Referencja: `marekbrze/dopadone` `src/components/ProcessingView.tsx` (prywatne repo autora; inspekcja przez GitHub API).
