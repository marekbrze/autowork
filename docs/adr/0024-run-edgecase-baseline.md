# 0024 - run edge-case baseline

**Date**: 2026-06-29
**Module**: run
**Status**: Accepted

## Context
Prototyp `run` (zbudowany w `proto-lofi`) obsługiwał happy paths i podstawy (empty states, potwierdzenia usunięcia, toast persystencji, stany „nie znaleziono"), ale nie był jeszcze poddany systematycznemu stresstestowi edge case'ów.

## Decision
Przeprowadzono audyt do `docs/modules/run-edgecases.md`. Znaleziono **16 luk** (🔴 0 · 🟡 9 · 🟢 7). Największa grupa to **architektoniczne odłączenie Runa od realnych danych lejka** (statystyki mock, `lastReachedStep` nigdy nie advance'owany, review-items bez źródła z UI) — CM-1/CM-2/CM-3. Pozostałe 🟡: mylny empty-state przy błędzie odczytu storage (LE-1), rename-do-pustego bez walidacji (FI-1), brak celebracji/nudge dla ukończonych Runów (ST-1), bulk-usuwanie przeterminowanych bez potwierdzenia/undo (AO-2), guard niezapisanego rename (FI-2), brak feedbacku sukcesu archive (AO-1).

## Impact
`proto-harden` wdroży listę priorytetów. Najpierw wymagana **decyzja scope z designerem** dla CM-1/2/3: spiąć prawdziwą derywację danych lejka (cross-module) czy zostawić statystyki ilustracyjne + je oznaczyć. Po zmianach w prototypie uruchomić `proto-edgecases` ponownie dla świeżego baseline'u.
