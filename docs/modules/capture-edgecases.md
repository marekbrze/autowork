# Capture — Edge Cases

Diagnoza prototypu `capture` (brain dump + ranking + parowanie) pod kątem nieobsłużonych przypadków brzegowych, a po zahardowaniu (`proto-harden`) — status wdrożenia każdej luki.

## Coverage
- **Spec już ujął** (`docs/modules/capture.md` Edge Cases): pusta lista („Dalej" off) · jeden stresor (ranking trywialny, parowanie ≥2) · omyłkowe skasowanie (undo Ctrl+Z) · duplikaty (nieblokowane) · bardzo długi tekst (truncate + pełny przy edycji) · banner zignorowany (rotuje dalej).
- **Już obsłużone w kodzie przed harden**: pusta lista (`BrainDump.tsx:113-119`, `:148-153`; `Ranking.tsx:48-51`), jeden stresor/parowanie ≥2 (`Ranking.tsx:30`, `PairingFlow.tsx:69-73`), undo na delete (`BrainDump.tsx`), duplikaty (celowy), truncate długich tekstów (`StressorItem.tsx:89-90`), rotacja banera (`PromptBanner.tsx:38-42`).
- **Luki znalezione przez `proto-edgecases`**: **15**.
- **Po `proto-harden`**: ✅ **12 wdrożone** · ❌ **3 odroczone** (z uzasadnieniem).
- **Po severity**: 🔴 2 (oba ✅) · 🟡 9 (✅ 7 · ❌ 2) · 🟢 4 (✅ 3 · ❌ 1).

## Inventory

Legenda: ✅ wdrożono (link do miejsca, gdzie teraz żyje) · ❌ odroczone (powód).

| # | Status | Severity | Category | Edge case | Decyzja / gdzie teraz |
|---|--------|----------|----------|-----------|------------------------|
| 1 | ✅ | 🔴 | Prototype-specific | Zapis do LocalStorage zawodzi | Honest persistence: stan nie zmienia się przy nieudanym zapisie + `writeError`; toast z retry. `src/shared/hooks/use-local-storage.ts` (`setValue`, `retry`), `src/modules/capture/components/StorageStatusToast.tsx` |
| 2 | ✅ | 🔴 | Errors | Uszkodzony/niepoprawny JSON w storage | `readError` zamiast cichego fallback do `[]`; toast informacyjny. `use-local-storage.ts` (init + `readError`), `StorageStatusToast.tsx` |
| 3 | ❌ | 🟡 | Cross-module / lifecycle | Stresory nie scope'owane do Runa | **Odroczone** — wymaga zbudowania modułu `run` (cross-module feature, poza scope hardenu `capture`). Do rozwiązania razem z `run`. |
| 4 | ✅ | 🟡 | Prototype-specific | Multi-tab last-write-wins | Nasłuch zdarzenia `storage` → synchronizacja stanu z innych kart. `use-local-storage.ts` (`useEffect` storage) |
| 5 | ❌ | 🟡 | Forms / Navigation | Draft w polu ginie przy „Dalej" | **Odroczone** — designer wybrał „odrzuć draft" (zachowanie bez zmian). |
| 6 | ✅ | 🟡 | Navigation & flow | Touch/mobilne: brak reorder | Jawne przyciski ↑/↓ na wierszu (działają na touch i z klawiatury; strzałki na focuście przycisku). Drag + klawiatura bez zmian. `src/modules/capture/components/Ranking.tsx` |
| 7 | ✅ | 🟡 | Action outcomes | Brak Ctrl+Z (tylko toast 6 s) | Globalny Ctrl/Cmd+Z → cofnij ostatnie usunięcie (z godem na pola tekstowe — tam natywne undo). `BrainDump.tsx` (`useEffect` keydown) |
| 8 | ✅ | 🟡 | Action outcomes | Edycja do pustego = ciche usunięcie | Pusty draft przy commicie = anuluj edycję (zostaw oryginał); usuwanie to osobna jawna akcja. `src/modules/capture/components/StressorItem.tsx` (`commit`) |
| 9 | ✅ | 🟡 | Flow | Parowanie do przerwania mid-sequence bez ostrzeżenia | Licznik postępu (Pytanie N, Stresor X z Y) + potwierdzenie przerwania. `src/modules/capture/components/PairingFlow.tsx` (`requestClose`, `confirmAbandon`) |
| 10 | ✅ | 🟡 | Action outcomes | Szybkie usunięcie kilku → cofnąć tylko ostatnie | Stos undo: wszystkie szybkie usunięcia cofnalne; licznik pozostałych. `BrainDump.tsx` (`undoStack`), `src/modules/capture/components/UndoToast.tsx` |
| 11 | ✅ | 🟡 | Errors | `crypto.randomUUID` wymaga secure context | Fallback gdy `randomUUID` niedostępny. `src/shared/types/index.ts` (`generateId`) |
| 12 | ✅ | 🟢 | Polish | Błędna polska pluralizacja | Helper `pluralize` (1 / 2-4 / 5+) w licznikach. `src/lib/utils.ts`, użyte w `BrainDump.tsx`, `PairingFlow.tsx` |
| 13 | ✅ | 🟢 | Polish | „Pytanie 0" off-by-one | `Pytanie {count + 1}`. `PairingFlow.tsx` |
| 14 | ✅ | 🟢 | Data states | Długi tekst w polu edycji, brak `maxLength` | `maxLength={300}` na polach brain dump i edycji. `BrainDump.tsx`, `StressorItem.tsx` (textarea/auto-grow celowo pominięte — to polish) |
| 15 | ❌ | 🟢 | Loading & async | Bardzo długa lista — brak wirtualizacji | **Odroczone** — akceptowalne dla prototypu; niski priorytet. |

### Sprawdzone kategorie — bez uwag / N/A po harden
- **Loading / in-flight (skeletons, spinners)**: N/A — persystencja capture jest synchroniczna (localStorage w `useState` initializer), więc nie ma asynchronicznego ładowania ani akcji w locie; skeletony i disable+spinner byłyby sztuczne.
- **Znaki specjalne / unicode / emoji / RTL**, **wartości brzegowe** (brak pól liczbowych), **niepoprawne formaty** (jedno pole tekstowe), **podwójny submit** (gardowany), **pola opcjonalne** (N/A), **feedback sukcesu** (lista = feedback), **przejścia stanów** (brak FSM), **uprawnienia/role** (single-user), **offline** (działa), **pusta kolekcja** (solidny empty-state).
- **a11y (marginalne)**: focus-trap w modalu PairingFlow pozostaje nieobsłużony (niski priorytet); reszta a11y (aria-live, aria-label, role, fokus) zachowana/poprawiona.

## Priority list (status)
1. ✅ **Cicha utrata zapisu w LocalStorage** (#1, #2) — honest persistence + toast z retry + read-error.
2. ❌ **Brak scope'owania do Runa** (#3) — odroczone do modułu `run`.
3. ✅ **Ctrl+Z undo** (#7) + draft przy „Dalej" (#5 odroczony z wyboru designu).
4. ✅ **Touch: ranking** (#6) — przyciski ↑/↓.
5. ✅ **Ciche usunięcie przy edycji-do-pustego** (#8) + **wielokrotne undo** (#10).
6. ✅ **Porzucenie parowania** (#9) — potwierdzenie + postęp.
7. ✅ **Multi-tab overwrite** (#4) + **`crypto.randomUUID`** (#11).
8. ✅ **Polish** (#12-#14) · ❌ wirtualizacja (#15).

## Harden outcome
12/15 luk wdrożonych, 3 odroczone (2 decyzją designu/scope: #3, #5; 1 polish: #15). Największa usunięta kruchość: **cicha utrata danych w warstwie LocalStorage** — zapis nie udaje się już „pomyślnie" w UI, a uszkodzony odczyt nie zeruje listy po cichu; oba stany mają toast z drogą odzysku. Happy path bez zmian.

Nowe stany mają story w Storybooku: `Capture/StorageStatusToast` (Write/Read error), `Capture/UndoToast` (single/multiple), `Capture/PairingFlow` (intro/mid-sequence/abandon-confirm/done).
