# 0022 - Kontynuuj: smart-routing resume do najdalszego kroku

**Date**: 2026-06-29
**Module**: run
**Status**: Accepted

## Context
Przy wznawianiu Runa („Kontynuuj" z karty na dashboardzie) trzeba zdecydować, na który ekran lądować. User zakotwiczył jedną zasadę: „jeśli są już taski procesowane i gotowe do robienia → na pewno ekran wykonywania". Pozostała otwartą kwestię, czy brak atrybutów blokuje wejście do focusa — ADR 0013 mówi, że **nie** (atrybuty opcjonalne, nudge-nie-bramka).

## Decision
**Kontynuuj** kieruje do najdalszego kroku lejka, w którym jest jeszcze praca:
1. trwa zapauzowana sesja focus → **wznów sesję** (timer od zapisanej pozycji);
2. ≥1 task → **focus** (filtr sesji / start) — **atrybuty nie bramkują** (ADR 0013): dowolny istniejący task jest „gotowy"; task bez danego atrybutu po prostu nie wpadnie do filtrów tego wymagających;
3. brak tasków, ale są nieprocesowane zadania → **process**;
4. zrankowane stresory bez NextActionów → **decompose**;
5. stresory nierankingowane → **capture / ranking**;
6. brak stresorów → **capture / brain dump**;
7. wszystko done → **Szczegóły** (stan „ukończony").

Run śledzi `lastReachedStep` (`FunnelStep`), co steruje routingiem.

## Impact
- `ENTITY_MAP.md`: Run zyskuje atrybut `lastReachedStep` (`FunnelStep`); dodany typ wartości `FunnelStep`.
- `ACTIONS.md`: `Resume Run` → `Continue (resume)` z opisem routingu.
- `docs/modules/run.md`: flow Continue.
