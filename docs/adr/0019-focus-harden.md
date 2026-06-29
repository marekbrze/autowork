# 0019 - focus prototype hardened

**Date**: 2026-06-29
**Module**: focus
**Status**: Accepted

## Context
Moduł `focus` był zbudowany w `proto-lofi` (happy paths działały), a audyt `proto-edgecases`
(`docs/modules/focus-edgecases.md`) znalazł **10** nieobsłużonych ścieżek: 🔴 1 · 🟡 4 · 🟢 5.
Najpoważniejsza: handlery akcji (Done/Skip/Dismiss/Back/Clear) wołały `advance()` niezależnie
od wyniku zapisu `updateTask`/`deleteTask`, więc przy pełnym/wyłączonym LocalStorage UI szedł
dalej, a stan się nie zapisał → po reloadzie task wracał jako `pending` (cicha utrata danych).

## Decision
Wdrożono **9** z 10 gapów (1 odroczony z powodem). Pełna mapa: `docs/modules/focus-edgecases.md`
(sekcja „Hardening status"). Kluczowe decyzje:

- **#1 Honest persistence** — każdy handler sprawdza wynik `updateTask`/`deleteTask` i przy awarii
  zapisu **nie advance'uje / nie zmienia ekranu** (wzorzec `ProcessView.tsx` `if (!ok) return`).
  `StorageStatusToast` z retry zostaje widoczny, user zostaje na tasku. Usunięto największą
  kruchtość prototypu.
- **#2 Resume sesji** (decyzja designu) — snapshot sesji (`queue` + `cursor`) persystowany w
  `focus:session`; wejście w `/focus` z przerwaną sesją pokazuje **opt-in banner** „Wznów sesję"
  nad filtrem (Exit / refresh / browser-back). Spełnia obietnicę ze spec („wznowienie od tego
  samego taska"). Lo-fi trzyma bieżący task jako `pending` — stan `active` celowo **nieużywany**
  w proto (utrzymana spójność z filtrem `attributed`).
- **#3 Undo Dismiss na summary** — toast undo przeniesiony z `FocusTaskScreen` na poziom
  `FocusView`, więc przeżywa skok do podsumowania przy dismiss ostatniego taska (ADR 0017).
- **#4 Rozdzielenie empty-state** — „nic nie opisano" vs „wszystko zrobione — brawo" + CTA
  do `process`.
- **#5 Rekonsyliacja mid-session** — task rozwiązany w innej karcie (storage event) nie zostaje
  pokazany jako bieżący; `firstPendingFrom` przewija do następnego `pending` (albo kończy sesję).
- **#9 Back nie un-dismissuje** — Back otwiera na nowo tylko `completed`/`skipped`; `dismissed`
  pozostawia (od-cofnięcie Dismiss to osobna ścieżka undo).
- **#10 Awaria odczytu** — `ReadErrorState` (jasny komunikat + Odśwież) zamiast mylnego
  empty-state listy przy `readError`.

Wydzielono komponenty prezentacyjne stanów pomocniczych (`DismissUndoToast`,
`SessionResumeBanner`, `ReadErrorState` w `FocusStates.tsx`), by każdy stan miał własną story.

### Odroczone
- **#6 Skróty klawiaturowe** (Done/Skip/Dismiss/Back/Pauza) — nowa modalność wejścia, nie obsługa
  ścieżki błędnej (poza zakresem harden = „nie dodawaj cech"). Do osobnego passu feature/polish.

### Uwagi modelowe
- **Brak nowej domeny** — `dismissed`/`Dismiss` już w modelu (ADR 0017). `SessionSnapshot` to
  artefakt persystencji UI (nie encja domenowa) — NIE trafia do `ENTITY_MAP`/`ACTIONS`.
- **`focus:session` best-effort** — awaria zapisu snapshotu celowo **nie** agregowana w
  `StorageStatusToast` (utrata bookmarka ≠ utrata danych; fałszywy „nie zapisano" przy udanym
  zapisie stanu Task byłby mylny). Krytyczne zapisy (stany `Task`) są bramkowane uczciwie.

## Impact
Prototyp `focus` obsługuje teraz każdą ścieżkę równo z happy path — awarie zapisu/odczytu, puste
stany, zmiany mid-session, martwe punkty nawigacji. Happy path zachowany (handlery bramkują tylko
przy porażce; `activeCursor === cursor` w normalnym przepływie). Wizualny polish to osobny
przyszły `proto-design`. Po zmianach — uruchomić `proto-edgecases` ponownie dla świeżego baseline'u.
