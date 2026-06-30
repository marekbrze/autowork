# Run

## Vision
Run to **widoczny, statystyczny obiekt** — nie cicha warstwa persystencji. Każdy Run to jeden pełny przejazd lejka (brain dump → celebracja), ale user świadomie nim zarządza: widzi, ile czasu poświęcił, ile zadań zrobił, ile zostało. **Wiele runów żyje równolegle**, odpalanych z dashboardu; każdy ma nazwę (domyślnie data/godzina), progres i historię sesji. Run można **archiwizować (odwracalnie)**, gdy uznasz go za skończony, albo **usunąć trwale**.

To odejście od wczesnej notki „MVP = jeden ukryty aktywny Run" (`MODULES.md`) — user chce operować na runach jak na namacalnych obiektach (ADR 0020).

**Run to też namacalna lista zadań, nie tylko agregaty.** Na Szczegółach widzisz wszystkie taski z prawdziwym stanem (do zrobienia / zrobione / nieaktualne) i możesz **działać z listy** — oznaczyć done albo oflagować nieaktualne — bez wchodzenia w sesję. To pierwszy moment, gdy moduł `run` **mutuje stany tasków** (cross-module write: `run` → store z `decompose`, ADR 0037). Lista jest pogrupowana stanem i posortowana wewnątrz grupy po **tym samym `TaskOrder`** co kolejka focus (ADR 0036). (Feature `session-queue-order-and-run-task-list`, ADR 0035.)

## User Flows

### Create Run (start fresh)
1. User na dashboardzie klika „nowy Run" / „start fresh".
2. Aplikacja tworzy Run (nazwa = data/godzina, stan `in_progress`, `lastReachedStep = brain dump`, `progress = 0`).
3. User ląduje w `capture` (brain dump) — pierwszy krok lejka. (`capture` tworzy Run implicite.)

### Continue (resume)
1. User na karcie Runa (aktywne na dashboardzie) klika **Kontynuuj**.
2. Smart-routing do najdalszego kroku lejka z pracą do zrobienia (`lastReachedStep` + stan danych):
   - trwa zapauzowana sesja focus → **wznów tę sesję** (timer od zapisanej pozycji);
   - są ≥1 task → **focus** (filtr sesji / start) — atrybuty nie bramkują (ADR 0013);
   - brak tasków, ale są nieprocesowane zadania/NextActiony → **process**;
   - zrankowane stresory, ale bez NextActionów → **decompose**;
   - stresory są, ale nierankingowane → **capture / ranking**;
   - brak stresorów → **capture / brain dump**;
   - wszystko done → **Szczegóły** w stanie „Run ukończony".
3. User wznawia pracę bez ręcznego wybierania kroku — apka prowadzi.

### View Details / Stats (Szczegóły)
1. User klika **Szczegóły** na karcie Runa.
2. Widzi ekran statystyk: **czas spędzony** (łączny z focusa — suma `timerElapsed`), **wykonane** (`completed + dismissed`), **zostało** (remaining), **progress %**.
3. Poniżej **sekcja „Tasks"** — lista wszystkich zadań z prawdziwym stanem (patrz flow „Praca z listą zadań").
4. Dostępne akcje: Kontynuuj, Rename, Review, Archive/Un-archive, Delete.

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
1. User na Szczegółach klika **Archive** → Run znika z aktywnych, ląduje w **archiwum (historia)** na dashboardzie.
2. Statystyki i porównanie w archiwum nadal widoczne.
3. Z archiwum można **Un-archive** → Run wraca do aktywnych, można go znów Kontynuować. Odwracalne (ADR 0021).

### Delete Run
1. User klika **Delete** → Run usuwany na stałe (z historii/archiwum też). Jedyna operacja terminalna.

## Screens (rough)
- **Run Details (Szczegóły)**: statystyki na wierzchu (czas spędzony, wykonane, zostało, progress %) + nazwa Runa (edytowalna) + stan (aktywny / ukończony) + pasek progresu; **sekcja „Tasks"** (lista zadań pogrupowana stanem: To do / Done / Not relevant; sort wewnątrz grupy po `TaskOrder`; wiersz = tekst + plakietka stanu + akcje done/not-relevant); akcje Kontynuuj / Rename / Review / Archive (lub Un-archive, gdy zarchiwizowany) / Delete. Gdy wszystko done — stan „ukończony" / celebracyjny.
- **Archived Runs (historia)**: na dashboardzie; lista zarchiwizowanych runów z ich statystykami, do porównania i czerpania motywacji; akcja Un-archive.
- **Dashboard run card** (właściciel: `dashboard`): karta aktywnego Runa z mini-statystykami i dwiema akcjami — **Kontynuuj** + **Szczegóły**.

## Actions

| Action | Description | Entity | Notes |
|--------|-------------|--------|-------|
| Create Run | Nowy przejazd lejka z dashboardu; nazwa = data/godzina. | `Run` | `capture` tworzy Run implicite. ADR 0020. |
| Continue (resume) | Smart-routing do najdalszego kroku z pracą. | `Run` | Karta na dashboardzie; atrybuty nie bramkują (ADR 0013). ADR 0022. |
| View Details / Stats | Ekran statystyk + zarządzanie. | `Run` | Czas spędzony = suma focusa; wykonane = `completed + dismissed`. |
| View run task list | Zobacz wszystkie taski z prawdziwym stanem na Szczegółach (pogrupowane, sortowane po `TaskOrder`). | `Task` | `run` czyta taski cross-module (store `decompose`); ADR 0036/0037. |
| Mark task done (from details) | `pending`/`skipped`/`active` → `completed` z listy. | `Task` | `run` mutuje stan taska (pierwszy raz, ADR 0037); liczy do progresem. |
| Mark task not-relevant (from details) | → `dismissed` z listy. | `Task` | Terminalnie; undo; liczy do progresem (ADR 0017). |
| Rename Run | Edycja nazwy. | `Run` | Ze Szczegółów. |
| Review | Przegląd: relevant vs stale. | `Run` (`Stressor`/`Task`) | **Tylko ręcznie**; nie przy resume. ADR 0023. |
| Archive Run | Schowanie do archiwum (historia). | `Run` | Ręcznie; odwracalne. ADR 0021. |
| Un-archive Run | Przywrócenie do aktywnych. | `Run` | Z archiwum. ADR 0021. |
| Delete Run | Usunięcie na stałe. | `Run` | Jedyna operacja terminalna. |

## Edge Cases
- **Pusty Run** (brak stresorów): Kontynuuj → brain dump.
- **Pusta sekcja „Tasks"** (brak tasków): empty-state listy („No tasks yet — start with a brain dump").
- **Task bez atrybutów** (nieprocesowany): widoczny na liście z labelką „untagged" — nadal gotowy do oznaczenia (ADR 0013).
- **Done na już-done** / **not-relevant na już-dismissed**: no-op / akcja zablokowana.
- **Wpływ akcji na routing resume**: done/dismiss z listy zmienia `doneCount` → `deriveLastReachedStep` może przesunąć krok (np. wszystko done → celebration). Sprawdzić, że Continue / stan „ukończony" reagują na żywo (→ `edgecases`).
- **Dismiss z listy**: confirm albo undo (do rozstrzygnięcia w `harden`; ADR 0017).
- **Awaria odczytu/zapisu** (mutacja taska z listy): toast retry, bez cichej utraty (wzorzec `StorageStatusToast`, już w `RunDetails`).
- **Task bez atrybutów**: nadal „gotowy" do focusa (ADR 0013) — po prostu nie wpadnie do filtrów wymagających danego atrybutu.
- **Run ukończony** (100% done/dismissed): na Szczegółach sekcja „Przejazd ukończony" + CTA „Archiwizuj ten przejazd"; **bez auto-archive** (archiwizacja wyłącznie ręczna).
- **Resume zapauzowanej sesji**: timer wznawia od zapisanej pozycji (`timerElapsed`), nie od 0.
- **Wiele aktywnych runów naraz**: każdy ma własny `lastReachedStep` i statystyki; Kontynuuj kieruje per-Run.
- **Błąd odczytu storage** (uszkodzony `run:runs`): stan błędu (`RunReadError`) zamiast mylnego empty-state; odśwież jako droga naprawy.
- **Walidacja rename**: pusta nazwa (lub same spacje) blokuje „Zapisz" + inline komunikat (`aria-invalid`); `maxLength` 60.
- **Bulk-usuwanie w Review**: „Usuń przeterminowane" wymaga potwierdzenia (`ConfirmDialog`).
- **Statystyki poglądowe**: w prototypie `stats` (`totalTasks`/`doneCount`/`dismissedCount`/`timeSpentSec`) oraz `lastReachedStep` są **wyprowadzane na żywo** z globalnych danych lejka (`src/modules/run/stats.ts`, `use-live-runs.ts`) — karty pokazują realny progres i krok resume; po akcjach done/dismiss z listy przeliczają się same. Dane lejka są globalne (bez `runId`), więc wszystkie Runy dzielą ten sam zestaw; mockiem pozostają `reviewItems`. Odłożone do fazy per-Run (ADR 0020): scope'owanie danych lejka po `runId`. Zob. diagnozę `docs/changes/dashboard-run-stats-disconnected.md`.

Pełny audyt i status każdej luki: `docs/modules/run-edgecases.md` (po `proto-harden`: ✅ 6 wdrożonych, ❌ 10 odłożonych z racją). Nowe przypadki listy tasków czekają na `proto-edgecases`.

## Integration Points
- **capture**: tworzy Run implicite przy Create; brain dump to pierwszy krok lejka.
- **decompose / process**: kroki lejka żyjące wewnątrz aktywnego Runa; `lastReachedStep` przesuwa się w miarę postępu.
- **focus (współdzielony `TaskOrder`)**: lista tasków na Szczegółach posortowana po tym samym `TaskOrder` co kolejka focus (ADR 0036) — jedno źródło prawdy o kolejności wszędzie.
- **decompose (zapis)**: moduł `run` po raz pierwszy **mutuje stany tasków** przez `updateTask` (`decompose/hooks/use-tasks.ts`) — cross-module write (ADR 0037).
- **focus**: wynik sesji (completed/dismissed, czas) aktualizuje statystyki Runa (`timeSpent`, `progress`); zapauzowana sesja jest celem routing przy Kontynuuj.
- **dashboard**: launcher — lista aktywnych runów (karta = Kontynuuj + Szczegóły) + ekran archiwum/historii; uruchamia akcje `run`.
