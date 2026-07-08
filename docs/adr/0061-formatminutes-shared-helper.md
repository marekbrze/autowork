# 0061 - formatMinutes lives in shared, not in module run
**Date**: 2026-07-08
**Module**: run / cross-cutting
**Status**: Accepted

## Context
Feature `run-estimated-time-totals` (ADR 0059/0060) potrzebuje formattera minut → „2h 35m" / „45m" na **trzech** powierzchniach w trzech modułach: `RunStatTiles` (`run`), `DominantRunCard` (`dashboard`) i `SessionFilter` (`focus`).

Moduł `run` już ma `formatDuration(seconds)` w `run/types/run.ts`. Naturalny impuls — dodać `formatMinutes` obok niego. Ale `dashboard` już importuje z `run` (`@/modules/run/types/run`), a **`focus` nie** — moduł lejka `focus` dziś nie sięga do `run`. Wczenie `formatMinutes` w `run` + użycie w `focus` stworzyłoby nową zależność `focus` → `run`, przeciwną do kierunku architektury: `run` agreguje dane lejka, moduły lejka nie importują z `run` (`run/stats.ts` czyta localStorage bez hooków lejka właśnie po to, by nie tworzyć cyklu).

## Decision
`formatMinutes(totalMinutes: number): string` siedzi w **nowym pliku `src/shared/format.ts`** (współdzielona warstwa), nie w module `run`. Algorytm: minuty → „2h 35m" (h+m), „45m" (tylko m), „0m" (0) — równoległy do `formatDuration`, ale wejście w minutach.

`formatDuration` (sekundy, dziś w `run/types/run.ts`) pozostaje na miejscu — poza scopem tego ficzera; ewentualne przeniesienie go do `shared` (razem z de-duplikacją) to osobna decyzja.

## Impact
Nowy plik `src/shared/format.ts`. `run`/`dashboard`/`focus` importują `formatMinutes` z `@/shared/format` — brak nowej zależności między-modułowej (`focus` → `run`), kierunek architektury zachowany. Residual edit (lokalizacja) rozpisany w planie feature'u.
