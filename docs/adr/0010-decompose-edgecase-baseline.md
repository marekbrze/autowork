# 0010 - Decompose edge-case baseline
**Date**: 2026-06-28
**Module**: decompose
**Status**: Accepted

## Context
Prototyp `decompose` obsługuje happy paths (WHY opcjonalny, HOW z gatingiem ≥1 next-action, skip rozbicia = 1 task, safety-net materializacji gołych next-actionów), ale nie był jeszcze stresstestowany na przypadki brzegowe. `proto-edgecases` przeprowadził systematyczny audyt spec + kodu.

## Decision
Audyt zapisany w `docs/modules/decompose-edgecases.md`. Znaleziono **14** luk (🔴 2 · 🟡 6 · 🟢 6).

Top priorities:
1. 🔴 **Cicha utrata danych w LocalStorage** — cztery hooki `decompose` (`use-tasks`, `use-reasons`, `use-next-actions`, `use-done-visions`) wyrzucają 4. element `useLocalStorage` (status `writeError`/`readError`/`retry`), mimo że warstwa persystencji jest „uczciwa". Zapis nie udaje się „pomyślnie" w UI, a uszkodzony odczyt fallbackuje po cichu. Tożsame z blokerami, które `capture` usunęło w ADR 0009 (`StorageStatusToast`).
2. 🟡 **Brak undo na usuwanie** — delete next-action (z taskami) i delete reason bez cofnięcia; niespójne z `capture` (ADR 0004).
3. 🟡 **Edycja-do-pustego = ciche usunięcie** (`NextActionItem.commit`).
4. 🟡 **Cross-module lifecycle** — usunięty stressor sieroci dane `decompose` (brak kaskady); ponowne rozbicie rekreuje ID tasków i zmaże przyszłe atrybuty (`context`/`energy`/`estimatedTime`) — latentne, rozwiązać z `run`/przed `process`.

## Impact
`proto-harden` wdraża priority list z `docs/modules/decompose-edgecases.md` (zaczynając od surface'owania statusu storage + undo), nie zmieniając happy pathu. Największa kruchość: ta sama **cicha utrata danych w warstwie LocalStorage**, którą `capture` właśnie zahardowało — `decompose` ma jej odpowiednik. Po zmianach w prototypie uruchomić ponownie `proto-edgecases`, żeby odświeżyć baseline.
