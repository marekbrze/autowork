# Run

## Vision
Run to **widoczny, statystyczny obiekt** — nie cicha warstwa persystencji. Każdy Run to jeden pełny przejazd lejka (brain dump → celebracja), ale user świadomie nim zarządza: widzi, ile czasu poświęcił, ile zadań zrobił, ile zostało **i jaki to rozmiar pracy (łączny czas szacunkowy)**. **Wiele runów żyje równolegle**, odpalanych z dashboardu; każdy ma nazwę (domyślnie data/godzina), progres i historię sesji. Run można **archiwizować (odwracalnie)**, gdy uznasz go za skończony, albo **usunąć trwale**.

**Łączny czas szacunkowy = rozmiar pracy w przejeździe.** Obok czasu *spędzonego* (ile już włożone) Run pokazuje czas *szacunkowy* (ile pracy w nim siedzi) — sumę `EstimatedTime` po wyestymowanych taskach. To agregat **wyprowadzany na żywo** z tasków (jak `timeSpent`), a nie persystowany osobno; leży w `deriveRunStats` (`run/stats.ts`), więc jest **jednym źródłem prawdy** dla `dashboard` (dominująca karta), `RunStatTiles` (Szczegóły) i `focus` (filtr sesji). (Feature `run-estimated-time-totals`, ADR 0059/0060.)

To odejście od wczesnej notki „MVP = jeden ukryty aktywny Run" (`MODULES.md`) — user chce operować na runach jak na namacalnych obiektach (ADR 0020).

**Run to też namacalna lista zadań, nie tylko agregaty.** Na Szczegółach widzisz wszystkie taski z prawdziwym stanem (do zrobienia / zrobione / nieaktualne) i możesz **działać z listy** — oznaczyć done albo oflagować nieaktualne — bez wchodzenia w sesję. To pierwszy moment, gdy moduł `run` **mutuje stany tasków** (cross-module write: `run` → store z `decompose`, ADR 0037). Lista jest pogrupowana stanem i posortowana wewnątrz grupy po **tym samym `TaskOrder`** co kolejka focus (ADR 0036). (Feature `session-queue-order-and-run-task-list`, ADR 0035.)

**Każdy Run ma swój własny lejek.** Stresory, next-actiony, zadania, powody, done-visions, a także zapauzowana sesja focus i ręczny porządek kolejki (`TaskOrder`) należą do konkretnego Runa — tworząc nowy Run, zaczynasz od pustego brain dumpa, nie od danych poprzedniego przejazdu. Realizuje to relację *hosts* z `MODULES.md` (kroki Core żyją wewnątrz Runa), wcześniej tylko intencję. Steruje tym **aktywny Run** (`activeRunId`) — Run, którego lejka widać w `capture`/`decompose`/`process`/`focus`; ustawiany przy **Create** i **Continue** (switch przez Dashboard). (Feature `per-run-funnel-isolation`, ADR 0044.)

**Lejek Runa jest swobodnie nawigowalny, a akcje na Szczegółach nad listą.** Kroki lejka (Stresory › Ranking › Akcje › Procesowanie › Focus) na ekranach funnel są **klikalnym stepperem** — user skacze do dowolnego kroku aktywnego Runa, nie tylko przyciskiem „Dalej". To odwraca wczesną decyzję „prowadzony lejek bez breadcrumbs" (ADR 0001 / UI-STRATEGY) — supersede przez ADR 0048. Wszystkie kroki są klikalne (bez lockowania), bieżący = no-op; wyjście z aktywnej sesji focus wymaga potwierdzenia (sesja pauzuje i przetrwa do wznowienia). **Na Szczegółach Runa wszystkie akcje (Continue, Review, Archive, Delete) siedzą nad listą tasków** — lista jest najdłuższą sekcją, więc akcje nie lądują na samym dole. (Feature `clickable-run-steps-and-details-actions-on-top`, ADR 0047/0048.)

## User Flows

### Create Run (start fresh)
1. User na dashboardzie klika „nowy Run" / „start fresh".
2. Aplikacja tworzy Run (nazwa = data/godzina, stan `in_progress`, `lastReachedStep = brain dump`, `progress = 0`), **ustawia go jako aktywny** (`activeRunId`) i prowadzi do brain dumpa.
3. User ląduje w `capture` (brain dump) — **pusty lejek tego Runa** (każdy Run ma własne dane; nie dziedziczy po poprzednim), pierwszy krok lejka. (`capture` tworzy Run implicite.)

### Continue (resume)
1. User na karcie Runa (aktywne na dashboardzie) klika **Kontynuuj**. Run staje się **aktywnym** (`activeRunId`) — jego lejek widać w ekranach funnel.
2. Smart-routing do najdalszego kroku lejka **tego Runa** z pracą do zrobienia (`lastReachedStep` + stan danych):
   - trwa zapauzowana sesja focus → **wznów tę sesję** (timer od zapisanej pozycji);
   - są ≥1 task → **focus** (filtr sesji / start) — atrybuty nie bramkują (ADR 0013);
   - brak tasków, ale są nieprocesowane zadania/NextActiony → **process**;
   - zrankowane stresory, ale bez NextActionów → **decompose**;
   - stresory są, ale nierankingowane → **capture / ranking**;
   - brak stresorów → **capture / brain dump**;
   - wszystko done → **Szczegóły** w stanie „Run ukończony".
3. User wznawia pracę bez ręcznego wybierania kroku — apka prowadzi.

### Nawigacja po krokach Runa (klikalny stepper)
1. User na dowolnym ekranie lejka (Stresory / Ranking / Akcje / Procesowanie / Focus) widzi na górze klikalny stepper 5 kroków (już wyświetlany, teraz klikalny).
2. Klika dowolny krok → apka nawiguje na trasę tego kroku (`STEP_ROUTE`) dla **aktywnego Runa**.
3. **Bieżący krok**: klik = no-op (user zostaje).
4. **Wyjście z aktywnej sesji focus** (task pod timerem, timer leci): klik innego kroku → **ConfirmDialog** „Masz aktywną sesję — wyjść?". **Confirm** → sesja się pauzuje (snapshot per-Run przetrwa, wznawialna przez `SessionResumeBanner`), user ląduje na wybranym kroku. **Cancel** → zostaje w sesji.
5. **Skok do kroku z niespełnionymi warunkami** (np. Focus bez tasków, Ranking przy <2 stresorach) → ekran degraduje do swojego empty-state'a (patrz edge cases).
6. Skok **nie aktualizuje `lastReachedStep`** ani nie zmienia routing „Kontynuuj" (Continue nadal wyprowadzany z danych lejka, nie z ostatniego skoku) — to bezpośredni skok, nie „postęp".

### View Details / Stats (Szczegóły)
1. User klika **Szczegóły** na karcie Runa.
2. Widzi ekran statystyk: **czas spędzony** (łączny z focusa — suma `timerElapsed`), **wykonane** (`completed + dismissed`), **zostało** (remaining), **progress %** oraz **łączny czas szacunkowy** ( suma `EstimatedTime` — rozmiar pracy; `EstimatedTotal`) jako osobny kafel + sub-linia **pozostałego szacunku** (`EstimatedRemaining` — ile szacunkowo zostało).
3. **Nad listą tasków — blok akcji**: **Continue** (lub stan „ukończony") + **Review / Archive (lub Un-archive) / Delete**. (Rename inline w nagłówku, zawsze u góry.)
4. **Poniżej sekcja „Tasks"** — lista wszystkich zadań z prawdziwym stanem (patrz flow „Praca z listą zadań"); na dole strony, więc akcje nie wymagają scrolla.

### Praca z listą zadań (ze Szczegółów)
1. User na Szczegółach widzi sekcję **„Tasks"** (pod kaflami statystyk, nad blokiem Continue): wszystkie taski pogrupowane stanem — **To do** (`pending`/`skipped`/`active`), **Done** (`completed`), **Not relevant** (`dismissed`); wewnątrz grupy sortowane po `TaskOrder` (default = rank stresora).
2. Każdy wiersz: tekst taska + plakietka stanu (+ labelka „untagged" gdy bez atrybutów) + akcje.
3. **Mark done** (`pending`/`skipped`/`active` → `completed`) albo **Mark not-relevant** (→ `dismissed`, terminalnie; undo; liczy do progresem, ADR 0017) — prosto z listy.
4. Statystyki (`RunStatTiles`) i krok resume przeliczają się na żywo (`deriveRunStats` czyta `state` bezpośrednio).
5. Dostępny **reset porządku** — ten sam `TaskOrder` co w filtrze focus (ADR 0036).

### Review (ręczny)
1. User na Szczegółach klika **Review**.
2. Przechodzi przez stresory / taski i oznacza każdy: **relevant** (nadal obowiązuje) lub **stale** (przeterminowane / do usunięcia).
3. Stale rzeczy czyszczone. Review **nie** uruchamia się automatycznie przy resume (ADR 0023).

### Rename Run
1. User na Szczegółach → Rename → edytuje nazwę (domyślnie data/godzina).

### Archive / Un-archive
1. User na Szczegółach klika **Archive** → Run znika z aktywnych, ląduje w **archiwum (historia)** na dashboardzie. Jeśli to był aktywny Run — **aktywny zostaje wyczyszczony** i user wraca na Dashboard (archiwizacja = „skończone z tym Runem”).
2. Statystyki i porównanie w archiwum nadal widoczne.
3. Z archiwum można **Un-archive** → Run wraca do aktywnych, można go znów Kontynuować. Odwracalne (ADR 0021).

### Delete Run
1. User klika **Delete** → Run usuwany na stałe (z historii/archiwum też) **razem z całym jego lejkiem** (stresory, next-actiony, zadania, powody, done-visions, dane focus — kaskadowo). Jedyna operacja terminalna. Jeśli to był aktywny Run — **aktywny zostaje wyczyszczony**, user wraca na Dashboard.

## Screens (rough)
- **Run Details (Szczegóły)**: statystyki na wierzchu (czas spędzony · wykonane/zostało · progress % · **łączny szacunek** jako 4. kafel, z sub-linią **pozostałego szacunku**) + nazwa Runa (edytowalna inline) + stan (aktywny / ukończony) + pasek progresu; **blok akcji nad listą: Continue (lub stan „ukończony" / celebracyjny) + Review / Archive (lub Un-archive, gdy zarchiwizowany) / Delete**; **sekcja „Tasks" na dole** (lista zadań pogrupowana stanem: To do / Done / Not relevant; sort wewnątrz grupy po `TaskOrder`; wiersz = tekst + plakietka stanu + akcje done/not-relevant). Gdy wszystko done — stan „ukończony" / celebracyjny (CTA nad listą).
- **Archived Runs (historia)**: na dashboardzie; lista zarchiwizowanych runów z ich statystykami, do porównania i czerpania motywacji; akcja Un-archive.
- **Dashboard run card** (właściciel: `dashboard`): karta aktywnego Runa z mini-statystykami i dwiema akcjami — **Kontynuuj** + **Szczegóły**.

## Actions

| Action | Description | Entity | Notes |
|--------|-------------|--------|-------|
| Create Run | Nowy przejazd lejka z dashboardu; nazwa = data/godzina. | `Run` | `capture` tworzy Run implicite; **ustawia aktywny Run (`activeRunId`), pusty lejek**. ADR 0020, 0044. |
| Continue (resume) | Smart-routing do najdalszego kroku z pracą. | `Run` | Karta na dashboardzie; **ustawia aktywny Run**; atrybuty nie bramkują (ADR 0013). ADR 0022, 0044. |
| Navigate to funnel step | Skok do dowolnego kroku aktywnego Runa przez klikalny stepper (Stresory / Ranking / Akcje / Procesowanie / Focus). | `Run` (`FunnelStep`) | Bieżący = no-op; wyjście z aktywnej sesji focus → ConfirmDialog (pauza + persyst snapshot, wznawialny). Nie zmienia `lastReachedStep` (Continue nadal wg danych). Supersede ADR 0001; ADR 0048. |
| View Details / Stats | Ekran statystyk + zarządzanie. | `Run` | Czas spędzony = suma focusa; wykonane = `completed + dismissed`. |
| View run task list | Zobacz wszystkie taski z prawdziwym stanem na Szczegółach (pogrupowane, sortowane po `TaskOrder`). | `Task` | `run` czyta taski cross-module (store `decompose`); ADR 0036/0037. |
| Mark task done (from details) | `pending`/`skipped`/`active` → `completed` z listy. | `Task` | `run` mutuje stan taska (pierwszy raz, ADR 0037); liczy do progresem. |
| Mark task not-relevant (from details) | → `dismissed` z listy. | `Task` | Terminalnie; undo; liczy do progresem (ADR 0017). |
| Rename Run | Edycja nazwy. | `Run` | Ze Szczegółów. |
| Review | Przegląd: relevant vs stale. | `Run` (`Stressor`/`Task`) | **Tylko ręcznie**; nie przy resume. ADR 0023. |
| Archive Run | Schowanie do archiwum (historia). | `Run` | Ręcznie; odwracalne. ADR 0021. |
| Un-archive Run | Przywrócenie do aktywnych. | `Run` | Z archiwum. ADR 0021. |
| Delete Run | Usunięcie na stałe. | `Run` | Jedyna operacja terminalna; **kaskadowo z danymi lejka**; czyści aktywnego. ADR 0044. |

## Edge Cases
- **Pusty Run** (brak stresorów): Kontynuuj → brain dump.
- **Pusta sekcja „Tasks"** (brak tasków): empty-state listy („No tasks yet — start with a brain dump").
- **Task bez atrybutów** (nieprocesowany): widoczny na liście z labelką „untagged" — nadal gotowy do oznaczenia (ADR 0013).
- **Done na już-done** / **not-relevant na już-dismissed**: no-op / akcja zablokowana.
- **Wpływ akcji na routing resume**: done/dismiss z listy zmienia `doneCount` → `deriveLastReachedStep` może przesunąć krok (np. wszystko done → celebration). Sprawdzić, że Continue / stan „ukończony" reagują na żywo (→ `edgecases`).
- **Dismiss z listy**: undo (`DismissUndoToast`; harden, R2-2; ADR 0017).
- **Akcje z listy na zarchiwizowanym Runie**: read-only — akcje Done/Not-relevant ukryte (harden, R2-3).
- **Statystyki/Continue po akcjach z listy**: przeliczają się na żywo — jedna instancja `useTasks` w `useLiveRuns` (harden, R2-1; ADR 0035).
- **Awaria odczytu/zapisu** (mutacja taska z listy): toast retry, bez cichej utraty (wzorzec `StorageStatusToast`, już w `RunDetails`).
- **Task bez atrybutów**: nadal „gotowy" do focusa (ADR 0013) — po prostu nie wpadnie do filtrów wymagających danego atrybutu.
- **Run ukończony** (100% done/dismissed): na Szczegółach sekcja „Przejazd ukończony" + CTA „Archiwizuj ten przejazd"; **bez auto-archive** (archiwizacja wyłącznie ręczna).
- **Resume zapauzowanej sesji**: timer wznawia od zapisanej pozycji (`timerElapsed`), nie od 0.
- **Wiele aktywnych runów naraz**: każdy ma własny `lastReachedStep`, statystyki **i własny lejek** (stresory/zadania/…); Kontynuuj ustawia go aktywnym i kieruje per-Run.
- **Brak aktywnego Runa na ekranie lejka** (aktywny usunięto/zarchiwizowano, lub wejście bezpośrednim linkiem w `/capture` gdy żaden nieaktywny): przekierowanie na **Dashboard** — lejek wymaga aktywnego Runa; user wybiera Kontynuuj lub tworzy nowy.
- **Switch aktywnego Runa w trakcie lejka**: Continue innego Runa podmienia dane lejka na ten Run; **niezapisany draft** (np. tekst w polu brain dumpa przed Enterem) **nie persystuje** — zapisują się tylko zatwierdzone stresory (pole wejściowe ulotne).
- **Błąd odczytu storage** (uszkodzony `run:runs`): stan błędu (`RunReadError`) zamiast mylnego empty-state; odśwież jako droga naprawy.
- **Walidacja rename**: pusta nazwa (lub same spacje) blokuje „Zapisz" + inline komunikat (`aria-invalid`); `maxLength` 60.
- **Bulk-usuwanie w Review**: „Usuń przeterminowane" wymaga potwierdzenia (`ConfirmDialog`).
- **Statystyki poglądowe**: `stats` (`totalTasks`/`doneCount`/`dismissedCount`/`timeSpentSec`/`estimatedTotalMin`/`estimatedRemainingMin`) oraz `lastReachedStep` są **wyprowadzane na żywo** z danych lejka **danego Runa** (`src/modules/run/stats.ts`, `use-live-runs.ts`) — każda karta Runa pokazuje **swój** progres i krok resume; po akcjach done/dismiss z listy przeliczają się same. (Feature `per-run-funnel-isolation`, ADR 0044 — dane lejka scope'owane per-Run; wcześniej globalne, diagnoza `docs/changes/runs-share-funnel-data.md` / ADR 0043. `reviewItems` nadal mockiem.)
- **Brak szacunków (aggregate edge)**: `estimatedTotalMin = 0` gdy żaden task nie ma `EstimatedTime` (run świeży / wszystko nieprocesowane). Wtedy: kafel „estimated" w `RunStatTiles` pokazuje **`—`** (nie mylące „0m"), sub-linia remaining pominięta, a segment „~Xh estimated" na dominującej karcie **całkowicie pominięty** (linijka rozbicia jak dziś). Mieszane (część wyestymowana) — `EstimatedTotal` obejmuje tylko te z szacunkiem; sformułowanie „~2h estimated" implikuje subset. (Feature `run-estimated-time-totals`, ADR 0059/0060; display-stany → `proto-harden`.)
- **Skok do kroku z niespełnionymi warunkami** (klikalny stepper): Focus bez tasków / Ranking przy <2 stresorach / Decompose bez stresorów / Process bez tasków → ekran degraduje do swojego empty-state'a (→ `edgecases` diagnoza, czy stany są wystarczające).
- **Wyjście z aktywnej sesji focus przez stepper**: ConfirmDialog pyta, gdy sesja live'uje (`screen === 'session' && currentTask && running`); confirm = pauza + persyst `focus:session` snapshot (wznów przez `SessionResumeBanner`); cancel = zostajemy. Skok wstecz (np. Focus → Decompose) w trakcie sesji — ten sam mechanizm. **Scope guardu (CS-1, zaakceptowane)**: pyta tylko na klik stepper'a (główna nawigacja wewnątrz lejka); back przeglądarki / reload / linki w nagłówku wychodzą milcząco — bezpiecznie, bo snapshot sesji persystuje per-Run niezależnie od drogi wyjścia, więc bez utraty danych (wznawialne). Rozszerzenie guardu na wszystkie drogi (history-blocking / `beforeunload`) odłożone — fragile i nieuzasadnione na MVP.
- **Skok nie aktualizuje `lastReachedStep`**: Continue nadal smart-routuje wg danych lejka, nie wg ostatniego skoku usera.
- **Bieżący krok w stepperze**: klik = no-op.
- **Spójność IA po reorderze akcji na Szczegółach**: stan archived (lista read-only, akcje nad nią spójne — Unarchive dostępny); stan completed (`RunCompleted` / celebracja CTA nad listą).

Pełny audyt i status każdej luki: `docs/modules/run-edgecases.md` (po `proto-harden`: ✅ 6 wdrożonych, ❌ 10 odłożonych z racją). Nowe przypadki listy tasków czekają na `proto-edgecases`.

## Integration Points
- **capture**: tworzy Run implicite przy Create; brain dump to pierwszy krok lejka.
- **decompose / process**: kroki lejka żyjące wewnątrz aktywnego Runa; `lastReachedStep` przesuwa się w miarę postępu.
- **focus (współdzielony `TaskOrder`)**: lista tasków na Szczegółach posortowana po tym samym `TaskOrder` co kolejka focus (ADR 0036) — jedno źródło prawdy o kolejności wszędzie.
- **decompose (zapis)**: moduł `run` po raz pierwszy **mutuje stany tasków** przez `updateTask` (`decompose/hooks/use-tasks.ts`) — cross-module write (ADR 0037).
- **focus**: wynik sesji (completed/dismissed, czas) aktualizuje statystyki Runa (`timeSpent`, `progress`); zapauzowana sesja jest celem routing przy Kontynuuj.
- **dashboard**: launcher — lista aktywnych runów (karta = Kontynuuj + Szczegóły) + ekran archiwum/historii; uruchamia akcje `run`.
- **współdzielony agregat szacunków (cross-module, feature `run-estimated-time-totals`)**: `estimatedTotalMin`/`estimatedRemainingMin` z `deriveRunStats` to **jedno źródło prawdy** — `RunStatTiles` (Szczegóły) i `DominantRunCard` (dashboard) czytają je z `run.stats`, a `focus` liczy swój subset (suma `EstimatedTime` po `matchedTasks`) lokalnie w `FocusView`. Formatter `formatMinutes` siedzi w **`src/shared/format.ts`**, nie w module `run` — żeby moduł lejka `focus` nie importował z wnętrza `run` (utrzymać kierunek: run agreguje dane lejka, nie odwrotnie). ADR 0059/0060/0061.
- **shared `FunnelStepper` (klikalny)**: pasek kroków renderowany na ekranach Core; nawiguje po trasach `STEP_ROUTE` (model w `run`); wyjście z aktywnej sesji focus → pauza + `focus:session` snapshot (współdziela infra z resume). ADR 0048.
