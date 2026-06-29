# 0018 - focus-edgecase-baseline

**Date**: 2026-06-29
**Module**: focus
**Status**: Accepted

## Context
Moduł `focus` został zbudowany w `proto-lofi` (happy paths działają), ale nie był jeszcze systematycznie streszczany pod kątem edge case'ów. `proto-detail` celowo odłożył ten audyt („nie wymuszaj systematycznego audytu — to proto-edgecases").

## Decision
Audyt wykonany w `docs/modules/focus-edgecases.md`. Znaleziono **10** gapów: 🔴 1 · 🟡 4 · 🟢 5. Top priorytety:
- 🔴 **Honest persistence** — handlery akcji ignorują wynik `updateTask`/`deleteTask`; przy awarii zapisu UI idzie dalej, a kolejna akcja nadpisuje `pendingRef` → cicha utrata danych (względem `ProcessView.tsx:185-199`, który sprawdza `if (!ok) return`).
- 🟡 **Brak persystencji sesji** — Exit/refresh/browser-back gubią pozycję w sesji; spec obiecuje Exit → `active` + resume (lo-fi odkłada `pending` i porzuca).
- 🟡 **Undo Dismiss nieosiągalne dla ostatniego taska** — skok do summary odmontowuje toast (ADR 0017 obiecuje undo).
- 🟡 **Mylny empty-state** — „Brak atrybutów" pokazuje się też gdy wszystkie taski rozwiązane.

## Impact
`proto-harden` wdroży listę priorytetową (na początek #1 persistence + #2 resume + #3 undo-na-summary + #4 rozdzielenie empty-state). Po zmianach w prototypie — uruchomić `proto-edgecases` ponownie dla świeżego baseline'u.
