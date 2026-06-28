# 0014 - Process edge-case baseline

**Date**: 2026-06-28
**Module**: process
**Status**: Accepted

## Context
Prototyp `process` (3-ekranowa maszyna stanów: summary → processing → done, wzorzec `dopadone`) obsługiwał happy paths i większość edge-case'ów była już uwzględniona w specyfikacji modułu, a wiele z nich — w tym obsługa błędów LocalStorage (toast + retry) — było już zaimplementowanych mimo adnotacji „po `proto-harden`". Brakowało jednak systematycznego stresstestu gotowych ekranów.

## Decision
Przeprowadzono audyt (`proto-edgecases`) — wynik w `docs/modules/process-edgecases.md`. Znaleziono **10 luk** (🔴 1 · 🟡 3 · 🟢 6). Luki skupiają się wokół jednego korzenia: integracja przepływu processing z honest-persistence warstwy storage.

Top priorytety (hand-off do `proto-harden`):
1. **#1 (🔴)** — `commit` advance'uje krok i stawia ✓ także przy **nieudanym zapisie** atrybutu (quota/disabled) → UI kłamie, atrybut po refresh znika. `updateTask`/`deleteTask` zwracają `void` i nie raportują sukcesu zapisu.
2. **#2 (🟡)** — usuwanie taska bez potwierdzenia/undo, mimo że `decompose` ma wielokrotnie używalny `ConfirmDialog`.
3. **#3 (🟡)** — globalny handler Enter „double-fires" przy sfokusowanym przycisku (option-card / Edit / Trash); guard wyklucza tylko INPUT/TEXTAREA.
4. **#4 (🟡)** — brak powrotu do summary z pierwszego kroku processing.

## Impact
`proto-harden` wdraża listę priorytetową (zalecane najpierw #1, #2, #3). Po zmianach w prototypie — uruchomić ponownie `proto-edgecases`, by odświeżyć baseline (szczególnie weryfikacja #1 po ew. zmianie sygnatury `updateTask`).
