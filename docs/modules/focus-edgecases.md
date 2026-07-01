# Focus — Edge Cases

## Coverage
- **Spec already captured** (`docs/modules/focus.md` → Edge Cases): 0 dopasowań w filtrze · wczesne wyjście (active+resume) · overtime · sesja 1-zadaniowa · undo Dismiss · motywacja brakująca · Back na pierwszym zadaniu.
- **Already handled in code**:
  - 0 dopasowań → `SessionFilter.tsx:60-61, 115-116` („Zacznij" zablokowany + info)
  - overtime → `FocusTimer.tsx` (czerwono po progu oszacowania)
  - sesja 1-zadaniowa → `FocusView.tsx:104-110` (`advance` → summary na ostatnim)
  - undo Dismiss → `FocusView.tsx:127-144` (+ toast `FocusTaskScreen.tsx:175-188`) — z zastrzeżeniem: luka #3
  - motywacja brakująca → `MotivationPanel.tsx` (empty state)
  - Back na pierwszym → `FocusTaskScreen.tsx:89` (`disabled={!canGoBack}`)
  - zniknięcie bieżącego taska (usunięty z innej karty) → `FocusView.tsx:266-275` (safeguard)
- **Spec case NOT handled**: „wczesne wyjście → task zostaje `active` + wznowienie" — lo-fi odkłada task jako `pending` i porzuca sesję (patrz #2).
- **New gaps found**: 10
- **By severity**: 🔴 1 · 🟡 4 · 🟢 5

## Inventory

| # | Severity | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|----------|----------|-----------|----------------|--------------------|-------|
| 1 | 🔴 | Prototype-specific (persistence) | Storage write fails (quota/disabled) mid-action | `updateTask`/`deleteTask` zwracają boolean (honest persistence), ale handlery **ignorują wynik** — `done/skip/dismiss` wołają `advance()` niezależnie, a kolejna akcja nadpisuje `pendingRef` w `useLocalStorage`. UI idzie dalej (Done→następny), a stan się nie zapisał → po reloadzie task wraca jako `pending`. Klasyczna cicha utrata danych. | Jak w `ProcessView.tsx:185-199` (`if (!ok) return;`): przy nieudanym zapisie **nie advance'uj / nie zmieniaj ekranu** — zostań na tasku, pozwól `StorageStatusToast` (już widocznemu) obsłużyć retry. Dotyczy też `persistElapsed` timera. | `FocusView.tsx:113-203` (`done/skip/dismiss/back/undoDismiss/clearCompleted/returnSkippedToPool`), `:79-81` (`persistElapsed`) |
| 2 | 🟡 | Navigation & flow | Sesja nie jest persystowana — Exit / refresh / browser-back porzucają bieżącą sesję | Stan sesji (`screen/queue/cursor/running`) jest efemeryczny (`FocusView.tsx:37-43`). Exit odkłada bieżący task jako `pending` i resetuje wszystkie skipped (`:167-172`). Refresh/back → powrót do filtra, pozycja w sesji stracona; do 5 s timera może być niezapersistowane (flush co ~5 s). Stan `active` nigdy nie jest ustawiany. | Persystuj snapshot sesji (screen/queue/cursor/activeId) do localStorage i wznawiaj przy wejściu w `/focus` — albo dopasuj spec do lo-fi (Exit = porzucenie). Spełnia obietnicę „wznowienie od tego samego taska". | `FocusView.tsx:37-43`, `:167-172`; spec `focus.md:42-43, 67` |
| 3 | 🟡 | Action outcomes / state | Dismiss ostatniego taska → undo niedostępne | Dismiss na ostatnim tasku: `advance(true)` skacze od razu do summary (`:127-133`), a toast undo żyje tylko w `FocusTaskScreen` (`:175-188`), który się odmontowuje → undo ginie. Undo obsługuje też tylko ostatni Dismiss. | Pokazuj undo Dismiss też na ekranie summary (dopóki nie kliknięto „Usuń skończone"), albo utrzymuj toast na poziomie `FocusView`. | `FocusView.tsx:127-133`; `FocusTaskScreen.tsx:175-188` |
| 4 | 🟡 | Data states | Puste „atrybuty", choć taski są — mylny komunikat | Gdy taski istnieją, ale żadne nie są `pending`+atrybuowane (wszystkie done/skipped/dismissed), `attributed.length === 0` → komunikat „Brak zadań opisanych atrybutami" (`SessionFilter.tsx:72-78`) jest mylny (są opisane, tylko rozwiązane). | Rozróżnij „brak atrybuowanych w ogóle" od „wszystkie rozwiązane" — np. „Wszystkie zadania zrobione — brawo." + CTA do dashboardu/procesowania. | `SessionFilter.tsx:72-78`; `FocusView.tsx:49-59` (`attributed`) |
| 5 | 🟡 | Cross-module / lifecycle | Zmiana stanu taska z innej karty mid-session nie jest rekonsyliowana | `currentTask` jest szukany po `id` bez walidacji stanu (`:69`). Task rozwiązany (completed/dismissed) w innej karty może zostać pokazany jako bieżący w sesji. (Przypadek *usunięcia* jest obsłużony safeguardiem `:266`; zmiana *stanu* — nie.) | Przy lądowaniu na tasku sprawdź jego stan; jeśli już rozwiązany — przewiń do następnego pending w kolejce. | `FocusView.tsx:69` (brak walidacji stanu); `:266` (safeguard tylko dla usunięcia) |
| 6 | 🟢 | Loading & async / a11y | Brak skrótów klawiaturowych na ekranie zadania | Akcje Done/Skip/Dismiss/Back/Pause są tylko przyciskami — brak handlera klawiatury, podczas gdy `ProcessView` jest keyboard-first (Enter/Esc/strzałki). | Dodaj skróty (np. Enter/D = Done, S = Skip, X = Dismiss, ← = Back, Spacja = Pauza) z `aria-keyshortcuts`, nie przechwytując przy fokosie na przycisku. | `FocusTaskScreen.tsx:160-170` (brak globalnego keydown) |
| 7 | 🟢 | Data states | Ucięty tekst taska w podsumowaniu bez tooltipa | Lista zrobionych ucina tekst (`truncate`) bez `title` → długie nazwy niedo odczytu. | Dodaj `title={t.text}` (jak breadcrumb w `FocusTaskScreen.tsx:114`). | `SessionSummary.tsx:60` |
| 8 | 🟢 | Data states | „Sesja zakończona" + ✓ przy sesji z 0 zrobionych | Nagłówek celebracyjny renderuje się zawsze, też gdy wszystko skipnięte (0 done, 0 dismissed) — mylny ton. | Tonuj nagłówek/generuj inny, gdy nic nie zrobiono (np. „Nic z tego nie teraz — OK"). | `SessionSummary.tsx:34-50` |
| 9 | 🟢 | State transitions | Back cicho odkłada (un-dismisses) wcześniej odrzucony task | `back()` ustawia poprzedni task na `pending` niezależnie od stanu (`:152`) — Dismissed task można przywrócić do puli bez użycia undo, omijając affordance. | Przy Back rozróżnij: reopen tylko completed/skipped; dla dismissed zostaw ostrzeżenie lub użyj tej samej ścieżki undo. | `FocusView.tsx:146-156` |
| 10 | 🟢 | Errors | Mylny empty-state przy błędzie ODCZYTU storage | Przy `readError` hook fallbackuje do `[]` → `attributed` puste → „Brak zadań opisanych atrybutami", choć to awaria odczytu, nie brak danych (toast `readError` pokazuje się obok). | Gdy `readError` — pokaż stan błędu zamiast empty-state listy. | `SessionFilter.tsx:72-78`; `FocusView.tsx:208-213` |

*Dodatkowo odnotowano (poza tabelą): długa nazwa taska na ekranie zadania zawija się w wielu liniach (`FocusTaskScreen.tsx:124`, `break-words`) — do rozważenia `line-clamp`/scroll; `pluralZadanie` zduplikowane w `SessionFilter`/`SessionSummary` (DRY, poza zakresem edge-case).*

## Priority list
1. **🔴 #1 — Honest persistence**: handlery ignorują wynik `updateTask`/`deleteTask`; przy awarii zapisu UI idzie dalej, a kolejna akcja nadpisuje `pendingRef` → cicha utrata. Największy wpływ, najniższe ryzyko naprawy (skopiować wzorzec `if (!ok) return` z `ProcessView`).
2. **🟡 #2 — Brak persystencji sesji**: Exit/refresh/back gubią miejsce w sesji; spec obiecuje wznowienie. Najczęstsza droga utraty pracy mid-focus.
3. **🟡 #3 — Undo Dismiss nieosiągalne dla ostatniego taska**: ADR 0017 obiecuje undo, ale dismissing ostatniego skacze do summary i toast ginie.
4. **🟡 #4 — Mylny empty-state**: „Brak atrybutów" pokazuje się też gdy wszystko zrobione — frustrujące na końcu lejka.
5. **🟡 #5 — Rekonsyliacja stanu mid-session**: task rozwiązany w innej karty może wyskoczyć jako bieżący.

## Hardening status (proto-harden, 2026-06-29)

| # | Status | Gdzie teraz |
|---|--------|-------------|
| 1 | ✅ | `FocusView.tsx:192-240` (`done`/`skip`/`dismiss`/`back`/`undoDismiss` — `if (!updateTask) return`), `:279-296` (`clearCompleted` — przerwij pętlę `deleteTask` przy awarii) |
| 2 | ✅ | `FocusView.tsx:56-57` (snapshot `focus:session`), `:130-145` (sync + walidacja), `:171-178` (`resumeSession`); `types/focus.ts` (`SessionSnapshot`); `FocusStates.tsx` (`SessionResumeBanner`) |
| 3 | ✅ | `FocusView.tsx:215-225` (`undoDismiss` wraca do sesji), `:417-418` (`DismissUndoToast` na poziomie `FocusView`); `FocusStates.tsx` (`DismissUndoToast`) |
| 4 | ✅ | `SessionFilter.tsx` (`resolvedAttributed` + stan „Wszystko zrobione — brawo" + CTA `/process`); `FocusView.tsx:77-80` |
| 5 | ✅ | `FocusView.tsx:96-126` (`firstPendingFrom` + reconcile effect: task rozwiązany w innej karcie → przewiń / zakończ) |
| 6 | ❌ | Odroczone — skróty klawiaturowe (Done/Skip/Dismiss/Back/Pauza). To nowa modalność wejścia, nie obsługa ścieżki błędnej (poza zakresem harden = „nie dodawaj cech"). Do osobnego passu feature/polish. |
| 7 | ✅ | Już obecne w kodzie — `SessionSummary.tsx:66` (`title={t.text}` na skróconym elemencie) |
| 8 | ✅ | Już obecne w kodzie — `SessionSummary.tsx:40-54` (ikonka/tytuł/napis różnicowane przy 0 done) |
| 9 | ✅ | `FocusView.tsx:227-240` (`back` otwiera na nowo tylko `completed`/`skipped`; `dismissed` pozostawia — undo to osobna ścieżka) |
| 10 | ✅ | `FocusView.tsx:328-330` (render `ReadErrorState` zamiast listy przy `readError`); `FocusStates.tsx` (`ReadErrorState`) |

**Zamknięte: 9 · Odroczone: 1 (#6, z powodem).** Decyzja designu (#2): **wznowienie sesji** (persystencja snapshotu + opt-in banner na filtrze).

## Hand-off to proto-harden
Najwyższy priorytet do zaimplementowania w `proto-harden`:
- **#1 (persistence)** — obowiązkowo jako pierwsze: sprawdzać wynik zapisu w każdym handlerze i nie advance'ować przy porażce; zostawić `StorageStatusToast` z retry.
- **#2 (resume sesji)** — persystencja snapshotu sesji + wznowienie (spełnia obietnicę Exit→resume).
- **#3 (undo Dismiss na summary)** — przenieść toast undo na poziom `FocusView`, żeby przetrwał do summary.
- **#4 (rozdzielenie empty-state)** — rozróżnić „brak atrybuowanych" vs „wszystkie rozwiązane".

Pozostałe (🟢) to polish — do ewentualnego wdrożenia razem z powyższymi lub osobno.

> ✅ Zrealizowane w `proto-harden` (patrz tabela wyżej). Największa usunięta kruchtość: **#1** — handlery akcji wołały `advance()` niezależnie od wyniku zapisu, więc przy pełnym/wyłączonym LocalStorage UI szedł dalej (Done→następny), a stan się nie zapisał → po reloadzie task wracał jako `pending` (cicha utrata).

---

## Re-audit: session-queue-order feature (proto-edgecases, 2026-07-01)

**Zakres**: nowe powierzchnie feature'u ADR 0035 w `focus` — lista dopasowanych (`SessionTaskList`) + ręczny `TaskOrder` (+ interakcja z resume/kolejką). Powierzchnie sprzed feature'u obsłużone wyżej i w harden — nie dubluję.

### Coverage (feature)
- **Spec już capture'owana** (`focus.md` §Edge Cases, dodane w proto-detail): lista 1-elementowa · taski dodane po `TaskOrder` (doklejane na końcu wg defaultu) · `TaskOrder` wskazuje usunięte taski (prune) · `TaskOrder` wskazuje taski poza filtrem (pozycje zachowane) · awaria zapisu `TaskOrder` (toast) · reset (confirm/undo → harden).
- **Już obsłużone w kodzie**:
  - taski dodane po `TaskOrder` → doklejane wg defaultu (`FocusView.tsx` `orderKey` = MAX dla nieobecnych w `TaskOrder`).
  - awaria zapisu `TaskOrder` → toast (`FocusView.tsx` `storageView` włącza `taskOrderStorage`).
  - reset czyści `TaskOrder` (`removeTaskOrder`); „Reset to default" widoczny tylko przy aktywnym porządku ręcznym.
  - taski poza bieżącym filtrem → niewidoczne na liście, pozycje w `TaskOrder` zachowane (`reorderMatched`).
- **Nowe luki**: 7 · 🔴 0 · 🟡 2 · 🟢 5.

### Inventory (feature)

| # | Sev | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|-----|----------|-----------|----------------|--------------------|-------|
| F2-1 | 🟡 | Action outcomes | „Reset to default" bez confirm/undo | Jedno kliknięcie trwale czyści `TaskOrder` (`removeTaskOrder`); utrata ręcznego porządku bez drogi powrotu | `ConfirmDialog` albo undo-toast (wzorzec `ClearCompleted`) | `FocusView.tsx` (`resetOrder`), `SessionFilter.tsx` (przycisk Reset) |
| F2-2 | 🟡 | Navigation/state | Resume ignoruje live `TaskOrder` | `resumeSession` przywraca `snapshot.queue` (zamrożone przy Starcie); przełożenie filtra PO pauzie nie wpływa na wznawianą sesję | Dokumentuj (resume = kontynuacja jak było) ALBO przebuduj kolejkę z bieżącego `TaskOrder` przy resume | `FocusView.tsx` (`resumeSession`) |
| F2-3 | 🟢 | Data/a11y | Drag nie działa na touch | HTML5 DnD nie wspiera touch; uchwyt wygląda na przeciągalny, ale na mobilnym działają tylko ↑↓ | Ukryj/zablokuj uchwyt na touch (lub nota „drag na desktopie"); ↑↓ pokrywają mobilne | `SessionTaskList.tsx` (uchwyt GripVertical) |
| F2-4 | 🟢 | Data states | Lista 1-elementowa: martwe kontrolki | n=1: ↑↓ zablokowane, drag = no-op; uchwyt/DnD wiszą bezcelowo | Ukryj kontrolki reorder gdy n===1 | `SessionTaskList.tsx` |
| F2-5 | 🟢 | Data states | Stale/usunięte ID gromadzą się w `focus:taskOrder` | ID usuniętych tasków zostają w `TaskOrder` (harmless — wypadają z `attributed`; prune tylko przy reorderze) | Prune nieistniejących ID przy odczycie/zapisie | `FocusView.tsx` (`matchedTasks`/`reorderMatched`) |
| F2-6 | 🟢 | Loading/a11y | Brak ogłoszenia SR po przełożeniu | ↑↓/drag przesuwa wiersz bez komunikatu dla czytnika ekranu | Region `aria-live` ogłaszający „przeniesiono na pozycję N z M" | `SessionTaskList.tsx` |
| F2-7 | 🟢 | Data states | Długa lista dopasowanych grzebie „Start" | Wiele dopasowań → wysoki `<ol>` spycha „Start" w dół; brak max-height/scroll | Cap wysokości + scroll (lub collapsible) | `SessionFilter.tsx` (blok listy) |

*Cross-module znane (ADR 0020): `TaskOrder` jest globalny — przełożenie w jednym Runie wpływa na wszystkie. Udokumentowane w `focus.md`/`run.md`.*

### Priority (feature)
1. **F2-1** — reset bez undo (utracony porządek; łatwy fix confirm/undo).
2. **F2-2** — resume vs live `TaskOrder` (decyzja designu: dokumentować vs przebudować przy resume).
3. (🟢 polish: F2-3…F2-7).

### Hand-off
- **F2-1** → `proto-harden` (confirm/undo dla reset).
- **F2-2** → decyzja designu w `proto-harden` (dokument vs rebuild-on-resume).
- **F2-3…F2-7** → `proto-polish` / osobny pass.
