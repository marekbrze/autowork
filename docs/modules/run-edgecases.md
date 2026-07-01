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

---

## Re-audit: per-Run funnel isolation (proto-edgecases, 2026-07-01)

**Zakres**: koncept **aktywnego Runa** (`activeRunId`) + per-Run własność danych lejka (feature `per-run-funnel-isolation`, ADR 0044; spec w `run.md` po proto-detail, ADR 0045). To **audit pre-implementation** — feature **jeszcze niezbudowany** (residual step 0 + `proto-lofi` przed nami), więc „Where" wskazuje strefę kodu, która **musi** obsłużyć dany przypadek (istniejący plik + planowane nowe lokacje z `docs/changes/per-run-funnel-isolation.md`), a „Behavior today" = przewidywane zachowanie po naiwnej implementacji bez guardów. Decyzje UX już potwierdzone z userem: brak aktywnego → Dashboard · delete aktywnego → brak aktywnego · draft w brain dumpie przy switchu → nie persystuje · archive aktywnego → czyści aktywnego.

**Ten feature ROZWIĄZUJE odroczone CM-1 / CM-2 / CM-3** z oryginalnego audytu (statystyki / `lastReachedStep` / źródło review spięte z realnymi danymi lejka — wymagały `runId`, czego dostarcza ten feature). Poniżej nowe luki, których wprowadza.

### Coverage (feature)
- **Spec capture'owana** (`run.md` §Edge Cases, dodane w proto-detail): brak aktywnego Runa → Dashboard · switch mid-funnel (draft ulotny) · wiele aktywnych runów z własnym lejkiem.
- **Już obsłużone w kodzie**: brak — feature niezbudowany.
- **Nowe luki**: 14 · 🔴 2 · 🟡 9 · 🟢 3.

### Inventory (feature)

| # | Sev | Category | Edge case | Behavior (po naiwnej impl.) | Suggested behavior | Where |
|---|-----|----------|-----------|-----------------------------|--------------------|-------|
| PR-1 | 🔴 | Navigation / flow | Brak guardu „aktywnego Runa" na trasach lejka | Wejście w `/capture`/`/decompose`/`/process`/`/focus` bez `activeRunId` (świeża apka po deep-linku, albo aktywny właśnie usunięto/zarchiwizowano) → lejek scope'uje po `null`/starym id → pusty lub mylny ekran, brak drogi naprzód | Guard tras lejka: brak ważnego `activeRunId` → **przekieruj na Dashboard** (decyzja usera). Waliduj, że id istnieje i `state==='in_progress'` (PR-3) | `App.tsx` trasy `/capture`…`/focus` (brak guardu); `useActiveRun` (nowy) |
| PR-2 | 🔴 | Action outcomes / data | `deleteRun` bez kaskady = osierocone dane + niedotrzymana obietnica „terminalnego usunięcia" | `deleteRun` (`use-runs.ts:77`) dziś usuwa tylko rekord Runa. Po izolacji stresory/taski/nextActions/reasons/doneVisions/focus-data tego Runa **zostają** w storach → user myśli, że usunął Run na stałe, a dane drewnieją w localStorage (rosnąca objętość, ryzyko leaku przy błędnym filtrze) | Kaskadowe usuwanie **wszystkich** store'ów lejka tego Runa z **centralnej listy** (nie zapomnij o nowym storze w przyszłości); jeśli któryś zapis zawiedzie → toast retry (bez cichej utraty) | `use-runs.ts:77` (`deleteRun`); lista kaskady (nowa) |
| PR-3 | 🟡 | State / data | Stary `activeRunId` wskazuje na usunięty/zarchiwizowany Run | Po Delete/Archive aktywnego wskaźnik (jeśli nie wyczyszczony) trzyma nieistniejące/stare id → lejek scope'uje po nim → pusto lub praca nad zarchiwizowanym Runem | Waliduj `activeRunId` przy każdym odczycie (istnieje && `in_progress`); PR-1 redirect łapie resztę. Clear przy Delete/Archive aktywnego (zgodne z decyzją usera) | `useActiveRun` (nowy); `use-runs.ts:77` (delete), `:59` (archive) |
| PR-4 | 🟡 | Forms / unsaved | Switch Runa w trakcie wpisywania brain-dumpa gubi draft | `Continue` innego Runa podmienia dane; niezapisany tekst w polu capture (Enter) przepada bez słowa (decyzja: draft ulotny, `BrainDump.tsx:23` `useState`) | Zaakceptowane (decyzja usera). Opcjonalnie: lekki hint jeśli draft niepusty przy switchu; pole ulotne = spójne z dzisiaj | `BrainDump.tsx:23` (`draft`) |
| PR-5 | 🟡 | Cross-module / state | Zapauzowana sesja focus musi wznawiać per-Run | `Continue` Runa A musi wznowić **sesję A**, nie globalną/B. Jeśli `focus:session` (`FocusView.tsx:72`) nie zostanie scope'owane per-Run → switch Runów wznawia złą (globalną) kolejkę | Scope'uj `focus:session` per-Run; `useLiveRuns` czyta snapshot aktywnego Runa (`use-live-runs.ts:33`) | `FocusView.tsx:72`; `use-live-runs.ts:33,44` |
| PR-6 | 🟡 | Data / migration | Migracja nieidempotentna / podwójne uruchomienie | Jednorazowe przypisanie `runId` do starych globalnych danych musi być idempotentne (nie re-stampować co ładowanie, nie tworzyć drugiego „first run"); nie może się uruchomić po `loadScenario`, które czyści storage | Flag „zmigrowano" (albo `runId` już obecny = sygnał); migracja tylko gdy stare klucze istnieją bez `runId` | logika migracji (nowa); `loader.ts` (wzajemne wykluczanie ze scenario-load) |
| PR-7 | 🟡 | Data / migration | Migracja łączy wszystkie stare dane w JEDEN Run | User z wieloma „przejazdami" zleonymi w globalnym storze nie może ich rozdzielić — wszystkie lądują w najnowszym/seed-Runie | Jednorazowy notice („przenieśliśmy Twoje dane do Runa X"); uczciwe ograniczenie, nie do naprawy bez heurystyki | logika migracji (nowa) |
| PR-8 | 🟡 | Data / stats | Taski bez `runId` (sieroty / częściowy zapis) są niewidoczne w statystykach | Po migracji wszystkie taski mają `runId`, ale przyszła sierota (bug, częściowy zapis) spada z `deriveRunStats` wszystkich Runów — liczby cicho się nie zgadzają | Grupuj po `runId` w `useLiveRuns`; opcjonalnie: alert/sierocnik dla tasków bez `runId` | `use-live-runs.ts:49` (mapowanie globalnych stats na wszystkie → per-Run) |
| PR-9 | 🟡 | Cross-module | `lastReachedStep` re-derive musi karmić się danymi TEGO Runa | `deriveLastReachedStep` (`stats.ts:65`) bierze `FunnelSignals`; jeśli nakarmione globalnymi liczbami → zły krok resume (stary CM-2 powraca). Po izolacji sygnały muszą być per-Run | `useLiveRuns` (`use-live-runs.ts:37`) buduje `FunnelSignals` z danych aktywnego Runa; to **zamyka CM-2** | `stats.ts:65`; `use-live-runs.ts:37-47` |
| PR-10 | 🟡 | Visual / data | Chip aktywnego Runa w nagłówku przy braku aktywnego / długiej nazwie | Slot chipa (`AppShell.tsx:41`) dziś pusty; po impl. musi degradować gdy brak aktywnego (ukryty vs pusty chip — nie mylić) i nie wprowadzać w błąd; w MVP display-only (klik = Later) | Ukryj chip gdy brak `activeRunId`; `truncate` długiej nazwy; display-only (switch przez Dashboard) | `AppShell.tsx:41` (slot zarezerwowany, nieprzypięty) |
| PR-11 | 🟡 | State transitions | Un-archive nie powinien aktywować Runa | `unarchiveRun` (`use-runs.ts:67`) przywraca do listy aktywnych; niech nie ustawia `activeRunId` (aktywacja = Continue). Verify że archiwizacja aktywnego czyści wskaźnik (PR-3) | Un-archive = tylko powrót na listę; aktywacja wyłącznie przez Create/Continue | `use-runs.ts:67` (unarchive), `:59` (archive) |
| PR-12 | 🟡 | Data / referential | DoneVision / Reasons mogą leakować między Runami | `DoneVisionMap` keyed po `stressorId` (`use-done-visions.ts:13`), `Reason[]` (`use-reasons.ts:9`); jeśli nie scope'owane po aktywnym Runie → wizje/powody z innych Runów mogą się wyświetlić w `decompose` | Hooki filtrują po `activeRunId` (lub po zestawie stressorów tego Runa); id globalnie unikalne chroni przed kolizją, nie przed leakiem | `use-done-visions.ts:13`; `use-reasons.ts:9` |
| PR-13 | 🟡 | Prototype-specific | Awaria zapisu `activeRunId` (quota) milczy | Jeśli `useLocalStorage('run:active', …)` zawiedzie → aktywny nieustawiony, lejek pokazuje pusto/mylnie bez feedbacku | Re-use wzorca `writeError`+retry (jak inne hooki); toast, stan UI = niezapisany | `useActiveRun` (nowy); `use-local-storage.ts` (status już jest) |
| PR-14 | 🟢 | Data states | Wiele Runów → globalne tablice rosną (Design B) | Każdy Run dokłada do globalnych kluczy; przy wielu Runach localStorage rośnie → quota | Akceptowalne dla prototypu; Design A (key-per-run) byłby czystszy; paginacja/purge = Later | storage volume (Design B, ADR 0044) |
| PR-15 | 🟢 | Visual | Długa nazwa aktywnego Runa w chipie nagłówka | Długa nazwa rozsadza wąski slot chipa | `truncate` + `title` (hover), jak `RunCard` (DS-2) | `AppShell.tsx:41` |
| PR-16 | 🟢 | Data / referential | `TaskOrder` per-Run ze starymi id tasków | Ręczny porządek per-Run (`focus:taskOrder`) może trzymać id usuniętych tasków — istniejące zachowanie, teraz per-Run; verify brak cross-Run wpływu | Degrade grzecznie (ignoruj nieistniejące id, jak dziś) | `focus:taskOrder` per-Run (ADR 0036/0044) |

### Kategorie sprawdzone bez nowych luk (feature)
- **State machine `activeRunId`**: to wskaźnik (set/clear), nie automat stanów — przejścia = Create/Continue (set), Delete/Archive aktywnego (clear). Brak niepoprawnych przejść do zablokowania.
- **Walidacja `runId` na encjach**: id generowane globalnie-unikalnie (`generateId`) → brak kolizji między Runami (leak PR-12 to kwestia filtrowania, nie kolizji).
- **Referential `stressorId`/`nextActionId`**: globalnie unikalne → join wewnątrz Runa poprawny; cross-Run join nie zachodzi (scope po `runId`).
- **Roles/permissions, offline, `alert()`**: jak w bazowym audycie — n/a / OK.

### Priority (feature)
1. **🔴 PR-1** — guard „brak aktywnego Runa" na trasach lejka (dead-end / mylny ekran). Pierwszy do wdrożenia; bez tego izolacja tworzy puste ekrany przy każdym wejściu bez aktywacji.
2. **🔴 PR-2** — kaskadowe usuwanie danych lejka w `deleteRun` (niedotrzymana obietnica „terminalnego usunięcia" + rosnące sieroty).
3. **PR-3 / PR-5 / PR-9** — integralność active-run: walidacja wskaźnika, per-Run wznowienie sesji, per-Run re-derive kroku (razem zamykają stare CM-2/CM-3).
4. **PR-6 / PR-7 / PR-8** — migracja (idempotentność, uczciwe ograniczenie scalania, sieroty w statystykach).
5. **PR-12** — leak DoneVision/Reasons między Runami.
6. **PR-10 / PR-11 / PR-13** — UX wskaźnika (chip, un-archive nie aktywuje, awaria zapisu active).
7. **PR-4** — (zaakceptowane) ulotny draft przy switchu.
8. (🟢 polish: PR-14, PR-15, PR-16).

### Hand-off
Większość tych luk to **guardy i integralność warstwy danych**, nie stany UI — więc trafiają głównie do **residual (direct-edits, krok 0 planu)** i `proto-lofi`, a nie do `proto-harden`. Kolejność:
- **PR-1, PR-2, PR-3, PR-5, PR-8, PR-9, PR-11, PR-12** → **residual / `proto-lofi`** (fundament warstwy danych + wiring): guard tras, kaskada delete, walidacja wskaźnika, per-Run sesja/stats/re-derive, scope DoneVision/Reasons, semantyka un-archive. To implementacyjne, nie stany.
- **PR-6, PR-7** → **residual (migracja)** + `proto-harden` (notice/toast migracji, PR-7).
- **PR-10, PR-13, PR-15** → `proto-lofi` / `proto-polish` (chip w nagłówku: degradacja braku aktywnego, awaria zapisu, truncate).
- **PR-4, PR-14, PR-16** → świadome kompromisy / `proto-polish`.

> Feature **rozwiązuje odroczone CM-1/CM-2/CM-3** (statystyki / `lastReachedStep` / review spięte z danymi lejka) — po wdrożeniu residual + lofi zdejmij z nich flagę „odłożone" w sekcji *Resolution* bazowego audytu i odznacz caption „Statystyki poglądowe" na `RunStatTiles`.

### Resolution
*Pending* — feature niezbudowany. Odśwież tę sekcję po wdrożeniu residual (krok 0) + `proto-lofi`/`proto-harden`.
