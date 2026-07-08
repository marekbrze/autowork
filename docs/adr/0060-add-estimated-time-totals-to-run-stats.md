# 0060 - Add estimated-time totals to Run stats
**Date**: 2026-07-08
**Module**: run
**Status**: Accepted

## Context
Feature `run-estimated-time-totals` (plan: `docs/changes/run-estimated-time-totals.md`, ADR 0059) dodaje do Runa widoczny **łączny czas szacunkowy** — rozmiar pracy w przejeździe (suma `EstimatedTime`). `Run` jest już „widocznym obiektem ze statystykami" (ADR 0020), a jego statystyki (`timeSpent`, `progress`, …) są **wyprowadzane na żywo** z tasków w `deriveRunStats` (`run/stats.ts`). Nowy agregat musi wejść tym samym kanałem — jedno źródło prawdy, konsumowane przez Szczegóły, dashboard i filtr focus.

## Decision
Dodać do `RunStats` (`src/modules/run/types/run.ts`) dwa pola liczone w `deriveRunStats` (`src/modules/run/stats.ts`), w tej samej pętli co dziś `timeSpent`/`doneCount`:

- **`estimatedTotalMin`** — suma `t.estimatedTime` po taskach z `estimatedTime != null` (wszystkie stany). Rozmiar pracy.
- **`estimatedRemainingMin`** — suma `t.estimatedTime` po taskach z `estimatedTime != null` **i** stanie ∈ {`pending`, `active`, `skipped`} (czyli ∉ `completed`/`dismissed`). Definicja „nie-zrobionego" spójna z `doneCount` (completed+dismissed); `skipped` liczy się jako remaining („nie teraz", wraca do puli).

Jednostka = **minuty** (jak `EstimatedTime`, preset 5/15/30/45/60) — inna niż `timeSpentSec` (sekundy). Display przez `formatMinutes` (ADR 0061). Brak persystencji — czysto wyprowadzane, więc `useLiveRuns` rozda je automatycznie (już today spreads `deriveRunStats(tasks)`).

**Shared docs zaktualizowane**: `ENTITY_MAP.md` (atrybuty Run + diagram), `GLOSSARY.md` (`EstimatedTotal`, `EstimatedRemaining`), `docs/modules/run.md` (Vision, flow „View Details", ekran RunDetails, edge „brak szacunków", integration).

## Impact
`RunStats` rośnie z 4 do 6 pól. `deriveRunStats` + interfejs zmienione (residual edit, rozpisany w planie). Stany display przy braku szacunków (`estimatedTotalMin === 0` → kafel `—`, segment na karcie pominięty) trasowane do `proto-harden`. Nie dotyka persystencji ani innych encji — czysty agregat read-only.
