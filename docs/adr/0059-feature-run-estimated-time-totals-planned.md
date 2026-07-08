# 0059 - Feature run estimated-time totals planned
**Date**: 2026-07-08
**Status**: Accepted

## Context
A feature request on the living system: user chce widzieć **łączny czas szacunkowy** zadań w Runie (sumę `EstimatedTime`) — **na dashboardzie** (motywacja/zobowiązanie przed wejściem w pracę) oraz **w filtrze sesji focus** (decyzja, na jak długi blok pracy się pisze, zanim kliknie Start). Wymagał impact scopingu przed implementacją.

## Decision
Zaplanowane w `docs/changes/run-estimated-time-totals.md`.

- **Zasięg:** pasywny display nowego agregatu — **bez nowych akcji usera**. Agregat wyprowadzany na żywo z istniejącego `Task.estimatedTime`.
- **Moduły:** rozszerza **3 istniejące** — `run` (właściciel agregatu: nowe pola `RunStats` + `deriveRunStats` + kafel w `RunStatTiles`), `dashboard` (segment w `DominantRunCard`), `focus` (licznik w `SessionFilter`).
- **Nowy moduł:** nie.
- **Cross-module:** niskiego ryzyka — nowa wartość przez istniejący `deriveRunStats`; `useLiveRuns` already rozdaje `stats` na karty/Szczegóły (nowe pola popłyną automatycznie), a focus liczy swój subset lokalnie. Brak nowej relacji między encjami.
- **MVP:** total na dashboardzie + Szczegółach + filtrze focus; remaining jako sub-linia na Szczegółach. Odłożone: prominentna „remaining", mini-karty, archiwum, ramowanie szacunek-vs-realny.
- **Routing:** `proto-detail run` (spec) → **residual direct-edits** (agregat + helper + 3 wyświetlenia) → `proto-edgecases run` → `proto-harden run` (stany braku szacunków) → opcjonalnie `proto-design`/`proto-polish`.
- **Residual:** 6 edytów w 5 plikach (+ ew. nowy `src/shared/format.ts` z `formatMinutes`).

Niskie ryzyko — cienki, read-only slice; główna uwaga to jednostki (estimate = minuty vs `timeSpent` = sekundy) i semantyka (total vs remaining), rozstrzygnięte w planie (total jako główna liczba; remaining tani, na sub-linii).

## Impact
`proto-detail`/`edgecases`/`harden`/`design`/`polish` działają na planie; trzon implementuje residual. Constraint z `DESIGN.md`: powierzchnie hi-fi, utrzymać tabular-nums i styl istniejących kafli/linii. Re-run `proto-feature`, jeśli scope się zmieni (np. akcje edycji szacunków, mini-karty/archiwum w MVP, prominentna „remaining").
