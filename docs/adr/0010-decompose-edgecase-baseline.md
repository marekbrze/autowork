# 0010 - Decompose edge-case baseline
**Date**: 2026-06-28
**Module**: decompose
**Status**: Accepted

## Context
The `decompose` prototype handles happy paths (optional WHY, HOW gated by ≥1 next-action, skip-breakdown = 1 task, a safety-net materializing bare next-actions), but it hadn't yet been stress-tested for edge cases. `proto-edgecases` ran a systematic audit of spec + code.

## Decision
Audyt zapisany w `docs/modules/decompose-edgecases.md`. Znaleziono **14** luk (🔴 2 · 🟡 6 · 🟢 6).

Top priorities:
1. 🔴 **Cicha utrata danych w LocalStorage** — cztery hooki `decompose` (`use-tasks`, `use-reasons`, `use-next-actions`, `use-done-visions`) wyrzucają 4. element `useLocalStorage` (status `writeError`/`readError`/`retry`), mimo że warstwa persystencji jest „uczciwa". Zapis nie udaje się „pomyślnie" w UI, a uszkodzony odczyt fallbackuje po cichu. Tożsame z blokerami, które `capture` usunęło w ADR 0009 (`StorageStatusToast`).
2. 🟡 **No undo on deletion** — delete next-action (with tasks) and delete reason with no undo; inconsistent with `capture` (ADR 0004).
3. 🟡 **Edycja-do-pustego = ciche usunięcie** (`NextActionItem.commit`).
4. 🟡 **Cross-module lifecycle** — usunięty stressor sieroci dane `decompose` (brak kaskady); ponowne rozbicie rekreuje ID tasków i zmaże przyszłe atrybuty (`context`/`energy`/`estimatedTime`) — latentne, rozwiązać z `run`/przed `process`.

## Impact
`proto-harden` implements the priority list from `docs/modules/decompose-edgecases.md` (starting with surfacing the storage status + undo), without changing the happy path. The biggest fragility: the same **silent data loss in the LocalStorage layer** that `capture` just hardened — `decompose` has its counterpart. After the prototype changes, re-run `proto-edgecases` to refresh the baseline.
