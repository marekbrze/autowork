# Run — Edge Cases

## Coverage
- **Spec już捕获 (`run.md` → Edge Cases)**: pusty Run → brain dump · task bez atrybutów gotowy (ADR 0013) · Run ukończony 100% bez auto-archive · resume zapauzowanej sesji · wiele aktywnych runów.
- **Już obsłużone w kodzie**:
  - Empty states na 3 ekranach — `RunsList.tsx:54`, `ArchivedRuns.tsx:38`, `ReviewRun.tsx:45`.
  - Potwierdzenie usunięcia (terminalnego) — `RunDetails.tsx:182`, `ArchivedRuns.tsx:78` (`ConfirmDialog`).
  - Status persystencji (toast write/read error + retry) na 4 ekranach — np. `RunsList.tsx:97`; hook raportuje `use-runs.ts:142`.
  - Stan „nie znaleziono Runa" — `RunDetails.tsx:43`, `ReviewRun.tsx:17`.
  - Badge „Ukończony" (wyliczany z progresu, bez auto-archive) — `RunDetails.tsx:201` (`isRunCompleted`).
  - gating nawigacji przy awarii zapisu dla create/delete — `use-runs.ts:37`, `RunDetails.tsx:63`.
- **Nowe luki znalezione**: 16.
- **By severity**: 🔴 0 · 🟡 9 · 🟢 7.
- **Po `proto-harden`**: ✅ 6 wdrożone · ❌ 10 odłożone (z racją). Szczegóły w sekcji *Resolution* na dole.

> Brak 🔴 — lo-fi obsłużył podstawy (empty states, potwierdzenia, toast persystencji). Największa fragmentaryczność: **Run jest w prototypie odłączony od realnych danych lejka** (CM-1/2/3) oraz **brak walidacji/feedbacku formularza rename** i mylny empty-state przy błędzie odczytu storage.

## Inventory

| # | Sev | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|-----|----------|-----------|----------------|--------------------|-------|
| CM-1 | 🟡 | Cross-module | Statystyki Runa nigdy nie odzwierciedlają realnego postępu | `stats` są mockiem zapisanym na obiekcie; ukończenie tasków / sesja focusa **nie aktualizują** czasu/wykonanych/progresu — „widoczny obiekt ze statystykami" kłamie | Prawdziwa derywacja z danych lejka (suma `timerElapsed`, `completed+dismissed`, total), ALBO jawne oznaczenie statystyk jako ilustracyjnych. Decyzja scope: architektoniczne (cross-module) | `use-runs.ts:31` (stats statyczne); brak integracji z `capture`/`focus` |
| CM-2 | 🟡 | Cross-module | `lastReachedStep` nigdy się nie przesuwa | `createRun` ustawia `brain-dump`, scenariusze seedują wartość, ale nic jej nie bumpuje wg postępu → Kontynuuj route jest **stale** po realnym przejściu lejka | Hook `setLastReachedStep` wywoływany z kroków lejka (capture→…→focus) gdy user osiąga krok; bez tego resume zawsze trafiałoby w to samo miejsce | `use-runs.ts` (brak settera); użycie `RunsList.tsx:38`, `RunDetails.tsx:141` |
| CM-3 | 🟡 | Cross-module | Review nie do napęłnienia z UI | `reviewItems` pochodzą tylko ze scneariusza (`addReviewItem` nieużywane w komponentach) → w `empty`/`minimal` Review zawsze puste; flow nie jest testowalny end-to-end | Źródło pozycji do przeglądu z danych lejka (np. taski/stresory zmodyfikowane dawno temu), albo Add-item w UI do ręcznego dopisywania | `use-runs.ts:116` (`addReviewItem` nieużywane); `ReviewRun.tsx` |
| LE-1 | 🟡 | Prototype-specific | Uszkodzony `run:runs` (zły JSON) / błąd odczytu | Pokazuje mylny empty-state „Nie masz aktywnych Runów" + toast `readError`; brak stanu błędu (focus ma `ReadErrorState`) i brak realnej naprawy (`retry` nie czyta ponownie) | Osobny stan błędu odczytu (jak `ReadErrorState` w `focus`) zamiast empty-state; „załaduj ponownie" jako jedyna droga | `use-runs.ts:18` (initialValue `[]`); `RunsList.tsx:54` |
| FI-1 | 🟡 | Forms | Rename do pustego/samych spacji | Milcząco zostawia starą nazwę (`trimmed \|\| r.name`), zamyka edycję, bez komunikatu — user myśli, że nic się nie stało | Inline walidacja: przycisk „Zapisz" disabled przy pustym draft + komunikat „nazwa nie może być pusta", albo placeholder/keep-open z toastem | `use-runs.ts:45-48`; `RunDetails.tsx:58-60` |
| ST-1 | 🟡 | State transitions | Ukończony Run (100%) siedzi w aktywnych bez celebracji/nudge | Filtr listy traktuje ukończone jak aktywne; Details pokazuje tylko badge, bez momentu celebracji ani sugestii archiwizacji (spec mówi o celebracji) | Na Details ukończonego Runa: celebracyjny stan / CTA „Archiwizuj ten przejazd"; opcjonalnie sekcja „ukończone" na liście z nudge | `RunsList.tsx:25` (filtr); `RunDetails.tsx:201` (tylko badge) |
| AO-2 | 🟡 | Action outcomes | „Usuń przeterminowane" — bulk bez potwierdzenia i undo | Jedno kliknięcie usuwa wszystkie oflagowane pozycje na stałe; brak `ConfirmDialog` i undo | Potwierdzenie (jak ClearCompleted w focus) albo undo-toast z przywróceniem | `ReviewRun.tsx:99-105` |
| FI-2 | 🟡 | Forms | Niezapisany rename tracony przy nawigacji | Edycja nazwy + klik „← Moje Runy" / Kontynuuj / inny link odrzuca draft bez pytania | Prompt „odrzucić zmiany?" (lub blokada nawigacji) gdy draft ≠ nazwa i tryb edycji aktywny | `RunDetails.tsx` tryb `editing` (brak guardu) |
| AO-1 | 🟡 | Action outcomes | Brak feedbacku sukcesu archive/unarchive/rename | Tylko implicit zmiana stanu (przycisk się flipuje); brak toastu „przeniesiono do archiwum" / drogi do archiwum po archiwizacji | Toast potwierdzający + (po archiwizacji) link „Zobacz w archiwum" | `RunDetails.tsx:155-163` |
| AO-3 | 🟢 | Action outcomes | Niegated mutacje opierają się tylko na toast | archive/unarchive/setStale/clearStale nie sprawdzają wyniku; confirm w ArchivedRuns zamyka się nawet przy awarii zapisu | Spójne honest-persistence (gating jak w `FocusView`); confirm zamykać tylko po udanym zapisie | `ArchivedRuns.tsx:83-86`; `use-runs.ts:55-71` |
| DS-1 | 🟢 | Data states | Bardzo długa lista runów | Wszystkie aktywne/archiwalne stackują się w `<ul>`; brak grupowania (data), wyszukiwania, paginacji | Grupowanie po dacie / filtrowanie nazwą; priorytet niski (narzędzie osobiste, mało runów) | `RunsList.tsx:64`, `ArchivedRuns.tsx:43` |
| DS-2 | 🟢 | Data states | Bardzo długa nazwa Runa | Input rename bez `maxLength`; w karcie/detail nazwa się zawija (OK), ale brak obcięcia/truncate w wąskiej karcie | `maxLength` na input + `truncate` w `RunCard` tytule | `RunDetails.tsx:87`; `RunCard.tsx:28` |
| DS-3 | 🟢 | Data states | Puste statystyki świeżego Runa (`0 / 0`, `0%`) | Kafelki pokazują „0 / 0" i „0%" — chłodne, nie podpowiada akcji | Dla `totalTasks === 0`: „—" / „zacznij pierwszy krok" zamiast „0 / 0" | `RunStatTiles.tsx:21-25` |
| DS-4 | 🟢 | Data states | Zduplikowane nazwy dozwolone | Brak unikalności; domyślna nazwa = timestamp → kolizja przy tworzeniu w tej samej minucie; rename do istniejącej nazwy OK | Dopuszczalne (nazwa nie jest identyfikatorem), ew. dopisek „(2)" przy kolizji domyślnej | `use-runs.ts:14,28,48` |
| LE-2 | 🟢 | Data states | Daty bez czasu względnego | `toLocaleDateString` → sama data; „ostatnia aktywność: dziś" nie różni się od wcześniejszych dni w czytelnym skanie | Czas względny („dziś", „2 dni temu") dla `lastActiveAt` | `RunDetails.tsx:169-172` |
| NF-1 | 🟢 | Navigation | ReviewRun „nie znaleziono" linkuje do `/run` | Link wstecz prowadzi do listy, nie do Szczegółów tego Runa | „← Szczegóły Runa" gdy istnieje kontekst (tu i tak nie znaleziono — niski priorytet) | `ReviewRun.tsx:21` |

### Kategorie sprawdzone bez luk
- **State machine (przejścia)**: tylko `in_progress ↔ archived`, oba osiągalne; UI zapobiega redundancji (Details pokazuje Archive *albo* Un-archive). Brak niepoprawnych przejść.
- **Loading & async (initial load)**: `useLocalStorage` czyta synchronicznie przy pierwszym renderze — brak async, brak blank-screen, skeleton niepotrzebny.
- **Offline**: czysty client-side, brak zapytań sieciowych — działa offline.
- **Roles / permissions**: single-user, n/a.
- **`alert()` / `window.alert`**: brak w kodzie produkcyjnym (`window.confirm` tylko w dev `DevToolbar`).

## Priority list
1. **CM-1 — statystyki kłamią**: Run „widoczny obiekt ze statystykami" (ADR 0020) jest rdzeniem modułu, a w prototypie liczby nigdy nie ruszają. Największy efekt, ale **architektoniczne** — wymaga decyzji scope (derywacja vs. ilustracyjne).
2. **CM-2 — `lastReachedStep` stale**: bez tego Kontynuuj (resume) prowadzi zawsze w to samo miejsce; podważa routing ADR 0022. Architektoniczne (wspólne z CM-1).
3. **LE-1 — mylny empty-state przy błędzie odczytu**: lokalna poprawka, duży efekt czytelności (paradygmat z `focus`/`ReadErrorState`).
4. **FI-1 — rename pusty = milczące no-op**: lokalna walidacja, łatwe.
5. **ST-1 — ukończone Runy bez celebracji/nudge**: luka w obietnicy „moment celebracji" (spec).
6. **CM-3 — Review nietestowalny end-to-end**: wspólna przyczyna z CM-1/2 (brak źródła danych).
7. **AO-2 — bulk-usuwanie przeterminowanych bez potwierdzenia/undo**.
8. **FI-2 — guard niezapisanego rename przy nawigacji**.
9. **AO-1 — feedback sukcesu archive/unarchive/rename**.
10. (🟢 polish: DS-1…DS-4, LE-2, NF-1, AO-3).

## Hand-off to proto-harden
Top-priority luki do wdrożenia w `proto-harden`:
- **CM-1 / CM-2 / CM-3** — te trzy mają wspólną przyczynę (Run odłączony od danych lejka). Harden powinien zacząć od **decyzji scope z designerem**: (a) spiąć prawdziwą derywację statystyk + advance `lastReachedStep` + źródło review-items (duże, cross-module), czy (b) zostawić ilustracyjne + wyraźnie to oznaczyć (np. badge „dane poglądowe") i skupić harden na lokalnych lukach. Bez tej decyzji lokalne fixe ryzykują, że statystyki nadal wprowadzają w błąd.
- **LE-1** — stan błędu odczytu storage (przenieść wzorzec `ReadErrorState` z `focus`).
- **FI-1 / FI-2** — walidacja rename + guard niezapisanych zmian.
- **ST-1** — celebracja / nudge archiwizacji dla ukończonych Runów.
- **AO-2** — potwierdzenie/undo dla „Usuń przeterminowane".

Każdy wiersz wskazuje `file:line` gdzie luka żyje — `proto-harden` (lub designer) może działać od razu. „Suggested behavior" to punkt startowy, nie decyzja ostateczna; `proto-harden` potwierdza lub nadpisuje każde z designerem.

## Resolution (`proto-harden`)

### ✅ Wdrożone (6)
- **LE-1** — stan błędu odczytu storage zamiast mylnego empty-state. `RunStates.tsx:RunReadError`; wstawiony w `RunsList.tsx:55` i `ArchivedRuns.tsx:39` (gdy `storage.readError`). Story: `Run/RunStates → ReadError`, `Run/RunsList → ReadError`, `Run/ArchivedRuns → ReadError`.
- **FI-1** — walidacja rename: „Zapisz" disabled przy pustej nazwie, `aria-invalid` + `aria-describedby` + inline komunikat. `RunDetails.tsx` (`nameValid`, form). `maxLength={60}` (DS-2).
- **ST-1** — ukończony Run (`isRunCompleted && !archived`) → sekcja celebracji + CTA „Archiwizuj ten przejazd" zamiast „Kontynuuj". `RunStates.tsx:RunCompleted`; `RunDetails.tsx` (resume section). Story: `Run/RunDetails → Completed`.
- **AO-2** — `ConfirmDialog` na „Usuń przeterminowane" w Review. `ReviewRun.tsx` (`confirmClear`).
- **AO-3** — honest persistence: dialog usuwania w ArchivedRuns zamyka się tylko po udanym zapisie. `ArchivedRuns.tsx` (`onConfirm`).
- **DS-2** — `maxLength` na rename + `truncate` tytułu karty z `title` (hover). `RunDetails.tsx`, `RunCard.tsx:24`.

### ❌ Odłożone (10) — z racją
- **CM-1 / CM-2 / CM-3** — **cross-module feature** (statystyki / `lastReachedStep` / review-items spięte z realnymi danymi lejka wymaga `runId` na stresorach/taskach + partycji danych we wszystkich krokach lejka + scenariuszach). Poza zakresem harden (decyzja designu: oznaczyć jako poglądowe + odłożyć). Affordance uczciwości: dyskretny caption „Statystyki poglądowe…" na `RunStatTiles.tsx`. Realne spięcie w fazie integracji Runa (moduł `dashboard`).
- **FI-2** — guard niezapisanego rename przy nawigacji: rename jest niedestrukcyjny i natychmiast powtarzalny; pełny blocker nawigacji (react-router) jest nieadekwatny do ryzyka.
- **AO-1** — feedback sukcesu archive/unarchive/rename: implicit zmiana stanu (flip przycisku / badge / zamknięcie edycji) jest wystarczająca dla odwracalnych/lokalnych akcji; toasty sukcesu = polish dla `proto-design`.
- **DS-1** — długie listy runów (grupowanie/wyszukiwanie): polish, niska potrzeba (narzędzie osobiste, mało runów).
- **DS-3** — świeży Run pokazuje „0 / 0", „0%": poprawne, wystarczające; polish.
- **DS-4** — zduplikowane nazwy: nazwa ≠ identyfikator; nie jest realnym problemem.
- **LE-2** — czas względny dat („dziś", „2 dni temu"): polish.
- **NF-1** — link „nie znaleziono" w ReviewRun → `/run`: poprawne (run nie istnieje → lista jest właściwym celem).

> CM-1/2/3 to jedyne luki strukturalne — reszta odłożonych to świadomie zaakceptowane kompromisy polish/zakres, nie znalezione później błędy.

---

## Re-audit: run-task-list feature (proto-edgecases, 2026-07-01)

**Zakres**: nowe powierzchnie feature'u ADR 0035 w `run` — sekcja „Tasks" (`RunTaskList`) + akcje z listy (Done / Not relevant) + cross-module mutacja tasków. Powierzchnie sprzed feature'u obsłużone wyżej i w harden — nie dubluję.

### Coverage (feature)
- **Spec już capture'owana** (`run.md` §Edge Cases, dodane w proto-detail): pusta sekcja „Tasks" · task bez atrybutów („untagged") · done-na-done (no-op) · wpływ akcji na routing resume · dismiss z listy (confirm/undo → harden) · awaria mutacji (toast).
- **Już obsłużone w kodzie**:
  - empty list → „No tasks yet — start with a brain dump." (`RunTaskList.tsx`).
  - task bez atrybutów → badge „untagged" (`RunTaskList.tsx`).
  - done/dismiss z listy → task migruje do właściwej grupy na żywo (`updateTask`, instancja A).
  - awaria zapisu mutacji → `taskStorage` wpięty w `StorageStatusToast` (`RunDetails.tsx`).
- **Nowe luki**: 6 · 🔴 1 · 🟡 3 · 🟢 2.

### Inventory (feature)

| # | Sev | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|-----|----------|-----------|----------------|--------------------|-------|
| R2-1 | 🔴 | Cross-module/state | Statystyki + Continue NIE odświeżają się po akcjach z listy | `RunDetails` ma **dwie instancje `useTasks()`**: własną (mutacje) i wewnątrz `useLiveRuns` (statystyki). `useLocalStorage` nie synchronizuje instancji w tej samej karcie (event `storage` = cross-tab tylko) → po `markDone`/`markNotRelevant` `RunTaskList` się odświeża (instancja A), ale `RunStatTiles`/Continue czytają instancję B (stale) do refresha. Łamie obietnicę „live stats" (ADR 0035) | Wystaw `updateTask`/`deleteTask`/`storage` z `useLiveRuns` (już woła `useTasks`) i użyj jednej instancji w `RunDetails` → statystyki przeliczają się live; ALBO dodaj same-tab sync do `useLocalStorage` | `use-live-runs.ts:26` (tylko `tasks` destrukturyzowane), `RunDetails.tsx` (własny `useTasks()`) |
| R2-2 | 🟡 | Action outcomes | Dismiss z listy bez undo i bez confirm | `markNotRelevant` natychmiast → `dismissed`, bez drogi powrotu z listy (brak reopenu) i bez undo — niespójne z ADR 0017 (Dismiss ma undo) i focusem (`DismissUndoToast`) | Undo-toast (jak focus) albo `ConfirmDialog` | `RunDetails.tsx` (`markNotRelevant`), `RunTaskList.tsx` |
| R2-3 | 🟡 | State transitions | Akcje z listy aktywne na zarchiwizowanym Runie | `RunDetails` zarchiwizowanego Runa nadal pokazuje listę z aktywnymi Done/Not-relevant; mutacja tasków w „ukończonym" Runie dotyka globalnych danych | Gate'uj/zablokuj akcje listy gdy `run.state === 'archived'` (lub ostrzeż) | `RunDetails.tsx` (sekcja Tasks bez checku `archived`), `RunTaskList.tsx` |
| R2-4 | 🟡 | Action outcomes | Brak feedbacku po Done z listy | Task migruje grupy (implicit), brak toasta; z Done nie ma reopenu z listy (Later), więc klik jest ostateczny bez potwierdzenia | Toast (zwłaszcza undo dla Not relevant — patrz R2-2) | `RunDetails.tsx` (`markDone`) |
| R2-5 | 🟢 | Data states | Długa lista tasków rozciąga sekcję | Wiele tasków → sekcja „Tasks" długa, brak scrolla/paginacji | Cap wysokości + scroll wewnątrz sekcji | `RunTaskList.tsx` |
| R2-6 | 🟢 | Errors | Uszkodzony `focus:taskOrder` w run = milczący fallback | `RunDetails` czyta `focus:taskOrder` read-only; zły JSON → `[]` (sort po ranku stresora), `readError` niewidoczne w run (degraduje grzecznie) | Opcjonalnie surfaj `readError` (degradacja i tak OK) | `RunDetails.tsx` (`useLocalStorage('focus:taskOrder')`) |

*Mid-session external mutation (akcja z listy na task będący bieżącym w pauzowanej sesji focus): obsługiwane grzecznie przez rekonsyliację `FocusView.firstPendingFrom` (przewija do następnego pending). Niska uwaga.*

### Priority (feature)
1. **🔴 R2-1** — statystyki/Continue stale po akcjach z listy (regresja wprowadzona przez feature; obietnica ADR 0035 złamana na głównej interakcji). Fix mały i jasny (jedna instancja `useTasks` przez `useLiveRuns`).
2. **R2-2** — dismiss z listy bez undo/confirm (ADR 0017).
3. **R2-3** — akcje na zarchiwizowanym Runie.
4. **R2-4** — feedback/undo po Done.
5. (🟢 polish: R2-5, R2-6).

### Hand-off
- **R2-1** → **direct-edit / harden (priorytet)**: wystaw mutatory z `useLiveRuns` (lub same-tab sync w `useLocalStorage`) — bez tego sekcja Tasks kłamie w statystykach.
- **R2-2 / R2-4** → `proto-harden` (undo/confirm + toast).
- **R2-3** → `proto-harden` (gate `archived`).
- **R2-5 / R2-6** → `proto-polish`.

### Resolution (proto-harden, 2026-07-01)

| # | Status | Gdzie teraz |
|---|--------|-------------|
| R2-1 | ✅ | `use-live-runs.ts` (wystawia `tasks`/`updateTask`/`deleteTask`/`taskStorage` ze swojej instancji `useTasks`); `RunDetails.tsx` (jedna instancja przez `useLiveRuns` — kafelki/Continue przeliczają się live po akcjach z listy) |
| R2-2 | ✅ | `RunDetails.tsx` (`markNotRelevant` + `dismissUndo`/`undoDismiss` + `DismissUndoToast`; ADR 0017) |
| R2-3 | ✅ | `RunTaskList.tsx` (`readOnly` ukrywa akcje) + `RunDetails.tsx` (`readOnly={archived}` + hint) |
| R2-4 | ✅ | Honest persistence (`if (!updateTask) return` w `markNotRelevant`); Done = implicit feedback (migracja do grupy Done). Toast sukcesu → polish. |
| R2-5 | ❌ Odroczone — polish (długa lista / scroll). |
| R2-6 | ❌ Odroczone — polish (degraduje grzecznie do defaultu). |

**Zamknięte: 4 (R2-1, R2-2, R2-3, R2-4) · Odroczone: 2 (polish).**
