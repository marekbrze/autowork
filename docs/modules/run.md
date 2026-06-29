# Run

## Vision
Run to **widoczny, statystyczny obiekt** — nie cicha warstwa persystencji. Każdy Run to jeden pełny przejazd lejka (brain dump → celebracja), ale user świadomie nim zarządza: widzi, ile czasu poświęcił, ile zadań zrobił, ile zostało. **Wiele runów żyje równolegle**, odpalanych z dashboardu; każdy ma nazwę (domyślnie data/godzina), progres i historię sesji. Run można **archiwizować (odwracalnie)**, gdy uznasz go za skończony, albo **usunąć trwale**.

To odejście od wczesnej notki „MVP = jeden ukryty aktywny Run" (`MODULES.md`) — user chce operować na runach jak na namacalnych obiektach (ADR 0020).

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
3. Dostępne akcje: Kontynuuj, Rename, Review, Archive/Un-archive, Delete.

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
- **Run Details (Szczegóły)**: statystyki na wierzchu (czas spędzony, wykonane, zostało, progress %), nazwa Runa (edytowalna), stan (aktywny / ukończony), pasek progresu; akcje Kontynuuj / Rename / Review / Archive (lub Un-archive, gdy zarchiwizowany) / Delete. Gdy wszystko done — stan „ukończony" / celebracyjny.
- **Archived Runs (historia)**: na dashboardzie; lista zarchiwizowanych runów z ich statystykami, do porównania i czerpania motywacji; akcja Un-archive.
- **Dashboard run card** (właściciel: `dashboard`): karta aktywnego Runa z mini-statystykami i dwiema akcjami — **Kontynuuj** + **Szczegóły**.

## Actions

| Action | Description | Entity | Notes |
|--------|-------------|--------|-------|
| Create Run | Nowy przejazd lejka z dashboardu; nazwa = data/godzina. | `Run` | `capture` tworzy Run implicite. ADR 0020. |
| Continue (resume) | Smart-routing do najdalszego kroku z pracą. | `Run` | Karta na dashboardzie; atrybuty nie bramkują (ADR 0013). ADR 0022. |
| View Details / Stats | Ekran statystyk + zarządzanie. | `Run` | Czas spędzony = suma focusa; wykonane = `completed + dismissed`. |
| Rename Run | Edycja nazwy. | `Run` | Ze Szczegółów. |
| Review | Przegląd: relevant vs stale. | `Run` (`Stressor`/`Task`) | **Tylko ręcznie**; nie przy resume. ADR 0023. |
| Archive Run | Schowanie do archiwum (historia). | `Run` | Ręcznie; odwracalne. ADR 0021. |
| Un-archive Run | Przywrócenie do aktywnych. | `Run` | Z archiwum. ADR 0021. |
| Delete Run | Usunięcie na stałe. | `Run` | Jedyna operacja terminalna. |

## Edge Cases
- **Pusty Run** (brak stresorów): Kontynuuj → brain dump.
- **Task bez atrybutów**: nadal „gotowy" do focusa (ADR 0013) — po prostu nie wpadnie do filtrów wymagających danego atrybutu.
- **Run ukończony** (100% done/dismissed): stan ukończenia na Szczegółach; **bez auto-archive** (archiwizacja wyłącznie ręczna).
- **Resume zapauzowanej sesji**: timer wznawia od zapisanej pozycji (`timerElapsed`), nie od 0.
- **Wiele aktywnych runów naraz**: każdy ma własny `lastReachedStep` i statystyki; Kontynuuj kieruje per-Run.

(Pełny audyt edge case'ów — np. uszkodzony localStorage, konflikt nazw, puste statystyki — w `proto-edgecases`.)

## Integration Points
- **capture**: tworzy Run implicite przy Create; brain dump to pierwszy krok lejka.
- **decompose / process**: kroki lejka żyjące wewnątrz aktywnego Runa; `lastReachedStep` przesuwa się w miarę postępu.
- **focus**: wynik sesji (completed/dismissed, czas) aktualizuje statystyki Runa (`timeSpent`, `progress`); zapauzowana sesja jest celem routing przy Kontynuuj.
- **dashboard**: launcher — lista aktywnych runów (karta = Kontynuuj + Szczegóły) + ekran archiwum/historii; uruchamia akcje `run`.
