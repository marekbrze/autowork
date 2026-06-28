# Decompose — Edge Cases

Diagnoza prototypu `decompose` (WHY: powody + wizja efektu ‖ HOW: next-actiony → taski) pod kątem nieobsłużonych przypadków brzegowych. Stress-test z `proto-edgecases` przed hardenem (`proto-harden`). Każdy wiersz ma `file:line` — gdzie luka *powinna* być obsłużona.

## Coverage
- **Spec już ujął** (`docs/modules/decompose.md` Edge Cases): brak pomysłu na next-action (wymóg ≥1) · pominięta motywacja (WHY opcjonalny) · next-action bez rozbicia (skip = 1 task) · zbyt ogólny next-action (aktywny język w promptach/przykładach) · jeden stresor (trywialny przepływ) · bardzo dużo next-actionów/tasków (jeden stresor na ekran).
- **Już obsłużone w kodzie**: pusty zbiór stresorów — empty-state + CTA „Idź do brain dump" (`DecomposeView.tsx:37-51`); brak next-actionów — placeholder w HOW (`HowBlock.tsx:106-109`); brak powodów — hint w kolumnie (`ReasonColumn.tsx:81-83`); brak kroków w modalu — hint + ścieżka „Pomiń → 1 task" (`DecomposeModal.tsx:129-133`, `:137-139`); skip rozbicia → 1 konkretny task (`DecomposeModal.tsx:51-54`); safety-net „Dalej" materializuje gołe next-actiony (`use-tasks.ts:72-82`, `DecomposeView.tsx:68-77`); gating „Dalej" przy 0 next-actionach z hintem (`DecomposeView.tsx:61`, `:169-177`); przykłady aktywnego języka jako nudge (`HowBlock.tsx:10-11`, `:89-104`); cascade delete tasków przy usuwaniu next-actionu (`DecomposeView.tsx:63-66`); clamp indeksu przy zmianie liczby stresorów (`DecomposeView.tsx:53`); truncate długich next-actionów w liście (`NextActionItem.tsx:80`); klawiatura w edycji inline (Enter/Escape) (`NextActionItem.tsx:58-68`); Escape zamyka modal (`DecomposeModal.tsx:31-37`).
- **Luki znalezione**: **14**.
- **Po severity**: 🔴 2 · 🟡 5 · 🟢 7.
- **Po `proto-harden`**: ✅ **8 wdrożone** · ◑ **1 częściowo** · ❌ **3 odroczone** · — **2 by-design (bez zmian)**.

> Największe źródło kruchości: **warstwa persystencji jest „uczciwa" w `useLocalStorage`, ale cztery hooki `decompose` wyrzucają jej status** (`writeError`/`readError`/`retry`) — więc błędy zapisu/odczytu są tu ciche. To dokładnie te same dwie 🔴 luki, które `capture` właśnie zahardowało (`StorageStatusToast`); `decompose` ma ich odpowiednik.

## Inventory

| # | Severity | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|----------|----------|-----------|----------------|--------------------|-------|
| 1 | 🔴 | Prototype-specific | Zapis do LocalStorage zawodzi (quota/disabled) | Hooki `decompose` destrukturyzują tylko `[value, setValue]` i ignorują 4. element `status`; `useLocalStorage` słusznie nie aktualizuje stanu i ustawia `writeError`, ale nikt go nie czyta. Draft pola czyści się bez warunku (`HowBlock.tsx:54`, `ReasonColumn.tsx:31`), a wpis „nie wchodzi" na listę → **cicha utrata wpisu**. | Wystawić `storage` z każdego hooka + renderować `StorageStatusToast` (wznowić komponent z `capture`) w `DecomposeView`; czyścić draft tylko gdy zapis się powiódł. | `use-tasks.ts:26`, `use-reasons.ts:12`, `use-next-actions.ts:11`, `use-done-visions.ts:16` (destrukturyzacja); konsumenci `HowBlock.tsx:50-56`, `ReasonColumn.tsx:27-32` |
| 2 | 🔴 | Errors | Uszkodzony/niepoprawny JSON w storage | `useLocalStorage` przy złym odczycie fallbackuje do wartości początkowej i ustawia `readError` (`use-local-storage.ts:31-33,38`) — ale hooki `decompose` go nie przekazują. User widzi pusty WHY/HOW bez informacji, że zapisane dane były uszkodzone; może wszystko wpisać od nowa. | Ten sam `StorageStatusToast` z wariantem read-error („nie udało się wczytać — startuję od pustej listy"). | `use-tasks.ts:26`, `use-reasons.ts:12`, `use-next-actions.ts:11`, `use-done-visions.ts:16` |
| 3 | 🟡 | Action outcomes | Usuwanie bez undo (next-action + jego taski; reason) | `[×]` na next-action usuwa natychmiast razem z taskami, bez cofnięcia; `[×]` na powodzie usuwa natychmiast. `capture` ma undo na delete (ADR 0004, `UndoToast`) — `decompose` jest niespójne (brak jakiegokolwiek undo). | Undo-toast dla delete-next-action (z taskami) i delete-reason, wzorem `capture` (nie dialog potwierdzenia — spójnie z ADR 0004). | `NextActionItem.tsx:104-113`, `ReasonColumn.tsx:69-77` |
| 4 | 🟡 | Action outcomes | Edycja next-actionu do pustego = ciche usunięcie | `commit()` przy pustym drafcie wywołuje `onDelete` zamiast anulować (`NextActionItem.tsx:34-39`). Ten sam antywzór, który `capture` naprawiło (capture #8). | Pusty commit anuluje edycję (zostaw oryginał); usuwanie to osobna jawna akcja. | `NextActionItem.tsx:34-39` |
| 5 | 🟡 | Navigation & flow / Forms | Drafty + aktywny stresor giną przy wyjściu | Draft w polu HOW/WHY oraz indeks „który stresor z N" są stanem komponentu — znikają przy wyjściu (back przeglądarki, link „← Dashboard", „Dalej"). Zapisane dane przetrwają; giną tylko niezacommitowane drafty i pozycja. | Trzymać aktywny indeks stresora (resume tam, gdzie skończono) i/lub ostrzec przy niezacommitowanym drafcie. (`capture` odroczyło draft decyzją designu „odrzuć" — potwierdzić tę samą decyzję tutaj.) | `DecomposeView.tsx:34` (index), `:184` (link); `HowBlock.tsx:37`, `ReasonColumn.tsx:24` (drafty) |
| 6 | 🟡 | Cross-module / lifecycle | Usunięcie Stressora sieroci dane `decompose` | `deleteStressor` usuwa tylko wiersz z `capture:stressors` i nie kaskaduje do `decompose:reasons/nextActions/tasks` (osobne klucze). Sierota jest niewidoczna (filtr po istniejących `stressorId`, `DecomposeView.tsx:57-59`), ale gromadzi się w storage. ACTIONS.md obiecuje „razem z dziećmi" — usuwa się tylko wiersz. | Kaskadowe usuwanie dzieci (wymaga mechanizmu koordynacji) albo lazy-cleanup sierot przy starcie `decompose`. Ta sama klasa co odroczone capture #3 (brak scope'owania do Runa). | `src/modules/capture/hooks/use-stressors.ts:38-47`; filtr `DecomposeView.tsx:57-59` |
| 7 | 🟡 | Cross-module / lifecycle | Ponowne rozbicie rekreuje ID tasków → zmaże przyszłe atrybuty *(latentne)* | `replaceTasksForNextAction` usuwa wszystkie taski next-actionu i tworzy świeże z tekstów — nowe ID (`use-tasks.ts:56-66`). Dziś (process = placeholder) taski nie mają atrybutów, więc nic nie ginie. Gdy `process`/`focus` powstaną, powrót do `decompose` i zapis modala zmaże już przypięte `context`/`energy`/`estimatedTime`/`timerElapsed`/`state`. | Diff zamiast pełnego replace'u (zachować identyczność istniejących tasków) albo zablokować ponowne rozbicie, gdy taski mają już atrybuty. | `use-tasks.ts:56-66`, `DecomposeModal.tsx:46-49` |
| 8 | 🟢 | Forms / Data states | Brak `maxLength` na polach tekstowych | Pola next-action / reason / krok / wizja nie mają limitu — bardzo długi wklejony tekst rozpycha wiersze. `capture` dodało `maxLength={300}` (capture #14). | `maxLength` na inputach/textarea (wzorem `capture`). | `HowBlock.tsx:74-82`, `ReasonColumn.tsx:48-55`, `DecomposeModal.tsx:97-105`, `WhyBlock.tsx:73-81` |
| 9 | 🟢 | Errors / a11y | `DecomposeModal`: brak focus-trap, brak close na backdrop | Overlay `role="presentation"` bez `onClick` — klik w tło nic nie robi; Tab ucieka do tła. Escape zamyka (OK). | Focus-trap + zamykanie po kliku w backdrop (wzorzec z modala `PairingFlow`). | `DecomposeModal.tsx:57` |
| 10 | 🟢 | a11y | A/B tablist: niepełna semantyka tabów | `role="tab"` bez `role="tabpanel"`, `aria-controls`, nawigacji strzałkami. | Pełne spięcie tab/tabpanel albo degeneracja do przełącznika segmentowego. | `DecomposeView.tsx:104-124` |
| 11 | 🟢 | Data states | Duplikaty next-actionów / powodów dozwolone | Brak dedup — można dodać ten sam tekst dwa razy → dwa identyczne taski w dół lejka. | Zaakceptować jako celowe (postać `capture`: duplikaty nieblokowane) albo miękki hint. | `use-next-actions.ts:13-21`, `use-reasons.ts:14-22` |
| 12 | 🟢 | Data states | Bardzo długa lista next-actionów — brak wirtualizacji | Stresor z kilkunastoma next-actionami renderuje się jako jeden długi `<ul>`. | Akceptowalne dla prototypu (postać `capture` #15); opcjonalnie obszar przewijany. | `HowBlock.tsx:111-124` |
| 13 | 🟢 | Loading & async (multi-tab) | Lokalny stan wizji w `WhyBlock` zestarzał się międzykartowo | `useState(doneVision?.text)` inicjuje się raz; przy zmianie wizji w innej karcie dla tego samego otwartego stresora lokalny draft się nie re-synchronizuje (warstwa storage już się syncuje). | Re-sync lokalnego draftu, gdy prop `doneVision` się zmieni (albo zaakceptować — niska częstotliwość). | `WhyBlock.tsx:32-33` |
| 14 | 🟢 | Forms (soft) | Vague next-action: tylko statyczne przykłady | Aktywny język modelują tylko statyczne chipy przykładów; nic nie wykrywa „pomyśl o tym"/„ogarnij". | Zgodnie z filozofią spec/ADR 0006 (nudge, nie bramka) to **z założenia** wystarcza; opcjonalnie miękki heuristic hint. | `HowBlock.tsx:10-11`, `:89-104` |

### Sprawdzone kategorie — bez luk / N/A
- **Pusta kolekcja**: solidne — empty-state stresorów + CTA (`DecomposeView.tsx:37-51`), placeholdery WHY/HOW/modal.
- **Jeden vs wiele vs bardzo dużo**: jeden-stresor trywialny; wiele = jeden na ekran + licznik „Stresor X z N"; bardzo dużo → tylko 🟢 #12.
- **Znaki specjalne / unicode / emoji / RTL**: free-text, React-escapowany display, emoji w wizji — ✓.
- **Wartości brzegowe (zero/ujemne/max/ułamki)**: brak pól liczbowych w `decompose` (energy/time przypinane w `process`) — N/A.
- **Niepoprawne formaty**: brak pól formatu (sam free text) — N/A.
- **Podwójny submit**: persystencja synchroniczna; podwójny klik „Dalej" jest no-opem (`materializeBareNextActions` idempotentne) — ✓.
- **Pola opcjonalne**: cały blok WHY opcjonalny; wizja opcjonalna; zapis działa — ✓.
- **Feedback sukcesu**: lista sama w sobie jest feedbackiem (postać `capture`) — ✓.
- **In-flight state / Loading**: odczyt synchroniczny (`useRef` init w `useLocalStorage`), bez blank-screen, bez okna in-flight — N/A (skeleton sztuczny).
- **Przejścia stanów (FSM)**: `decompose` tworzy tylko taski `pending`; bez FSM w tym module — N/A.
- **`alert()` / unexpected error**: brak wywołań `alert()`; (nieoczekiwane błędy = storage → 🔴 #1/#2).
- **Dead ends**: zawsze jest droga dalej/wstecz/Dashboard — ✓.
- **Uprawnienia / role**: single-user — N/A.
- **Offline**: localStorage działa offline, brak wywołań sieciowych — ✓.

## Priority list
1. 🔴 **Cicha utrata danych w LocalStorage** (#1 zapis, #2 odczyt) — hooki `decompose` wyrzucają status persystencji. Wystawić `storage` + `StorageStatusToast` z retry. Największa kruchość modułu; tożsame z blokerami, które `capture` właśnie usunęło.
2. 🟡 **Brak undo na usuwanie** (#3) — delete next-action (z taskami) i delete reason bez cofnięcia; niespójne z `capture` (ADR 0004). Undo-toast wzorem `capture`.
3. 🟡 **Edycja-do-pustego = ciche usunięcie** (#4) — pusty commit anuluje edycję, nie usuwa (capture #8).
4. 🟡 **Orphan cascade + re-decompose** (#6, #7) — cykl życia cross-module: usunięty stressor zostawia sieroty; ponowne rozbicie zmaże przyszłe atrybuty tasków. Rozwiązać razem z modułem `run` / przed zbudowaniem `process`.
5. 🟡 **Drafty + pozycja przy wyjściu** (#5) — potwierdzić decyzję designu (odrzuć vs persystuj indeks), spójnie z `capture`.
6. 🟢 **Polish / a11y** (#8-#14) — `maxLength`, focus-trap modala, tablist a11y, reszta akceptowalna/by-design.

## Hand-off to proto-harden
Top-priority luki, które harden powinien wdrożyć jako pierwsze:
- **#1 + #2 — surface storage status**: wystawić `storage` z czterech hooków `decompose` i pokazać `StorageStatusToast` (przeniesiony/współdzielony z `capture`) w `DecomposeView`. Czyścić draft pola tylko po udanym zapisie. To jedne 🔴 i największy zysk.
- **#3 — undo na usuwanie**: undo-toast dla delete-next-action (z kaskadowymi taskami) i delete-reason, spójnie z `capture`/ADR 0004.
- **#4 — edycja-do-pustego**: pusty commit anuluje, nie usuwa.
- **#6 + #7 — cross-module lifecycle**: skoordynować z modułem `run` (kaskada przy usuwaniu stressora) i zabezpieczyć `replaceTasksForNextAction` przed zmatywaniem atrybutów, zanim `process`/`focus` powstaną.

## Harden outcome
Wdrożono **8/14** stanów (＋1 częściowo #9; 3 odroczone; 2 by-design). Designer wybrał **dialog potwierdzenia** zamiast undo na usuwanie (#3) — odmiennie niż `capture`/ADR 0004. Happy path bez zmian. Największa usunięta kruchość: **cicha utrata danych w warstwie LocalStorage** — cztery store'y `decompose` raportują teraz `writeError`/`readError` przez wspólny `StorageStatusToast` z retry (tożsame z `capture`, ADR 0009).

| # | Status | Gdzie teraz / powód odroczenia |
|---|--------|--------------------------------|
| 1 | ✅ | 4 hooki wystawiają `storage`; `DecomposeView` renderuje łączny `StorageStatusToast` (writeError) z retry. `use-{tasks,reasons,next-actions,done-visions}.ts`, `DecomposeView.tsx` |
| 2 | ✅ | Ten sam toast, wariant readError. Te same pliki |
| 3 | ✅ | **Dialog potwierdzenia** (decyzja designu, nie undo). `ConfirmDialog.tsx`; gate w `NextActionItem.tsx` (next-action + kaskada tasków) i `ReasonColumn.tsx` (powód) |
| 4 | ✅ | Pusty commit anuluje edycję (zostaw oryginał). `NextActionItem.tsx` (`commit`) |
| 5 | ❌ | **Odroczone** — spójnie z decyzją designu `capture` (odrzuć draft); zapisane dane przetrwają, giną tylko niezacommitowane drafty + aktywny indeks |
| 6 | ❌ | **Odroczone** do modułu `run` — wymaga koordynacji cross-module; lazy-cleanup obarczone ryzykiem zmatywania danych przy `readError` stressora |
| 7 | ✅ | `replaceTasksForNextAction` diff-po-tekście zachowuje ID tasków (obserwacyjnie neutralne dziś, chroni przyszłe atrybuty). `use-tasks.ts` |
| 8 | ✅ | `maxLength` (300 na inputach, 600 na textarea wizji). `HowBlock.tsx`, `ReasonColumn.tsx`, `DecomposeModal.tsx`, `WhyBlock.tsx`, `NextActionItem.tsx` |
| 9 | ◑ | Escape + explicit close + initial focus (jak `PairingFlow`). Backdrop-click-close **nie** dodane — konwencja modali w projekcie (`PairingFlow` tego nie robi). Focus-trap odroczony (spójnie z `capture`) |
| 10 | ✅ | A/B „tablist" zredukowana do przełącznika segmentowego (`role="group"` + `aria-pressed`). `DecomposeView.tsx` |
| 11 | — | **By-design** — duplikaty dozwolone celowo (postać `capture`). Bez zmian |
| 12 | ❌ | **Odroczone** — wirtualizacja akceptowalna dla prototypu (postać `capture` #15) |
| 13 | ✅ | `WhyBlock` re-sync lokalnego draftu wizji przy zmianie propa. `WhyBlock.tsx` (`useEffect`) |
| 14 | — | **By-design** — aktywny język to nudge, nie bramka (ADR 0006). Bez zmian |

Nowe stany mają story w Storybooku: `Decompose/ConfirmDialog` (DeleteNextAction / DeleteReason / Closed), `Decompose/StorageStatusToast` (Write / Read error). Po zmianach w prototypie uruchomić ponownie `proto-edgecases`, żeby odświeżyć baseline.
