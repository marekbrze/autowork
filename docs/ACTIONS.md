# Action Inventory

Kompletna lista akcji, jakie user może wykonać — pogrupowana po encji. Format otwarty (nie tylko CRUD): encja → akcja → opis. Przejścia stanów traktowane jako akcje.

## Roles
- **User**: Jedyna rola — autor projektu; robi wszystko. Single-user, lokalne.

## Actions

### Run

| Action | Description | Role | Notes |
|--------|-------------|------|-------|
| Create Run | Rozpocznij nowy przejazd lejka („start fresh") z dashboardu. | User | `capture` tworzy Run implicite (nazwa = data/godzina); zaczyna od brain dump. Run staje się **aktywnym** (`activeRunId`) — jego lejek widać w ekranach funnel; nowy Run ma **pusty lejek** (każdy Run własne dane). Run = widoczny obiekt ze statystykami (ADR 0020, 0044). |
| View Dashboard | Otwórz launcher: dominujący ostatnio-pracowany run (progres na pierwszym planie) + mniejsze aktywne runy + wejście do archiwum. | User | Ekran wejściowy apki. Właściciel: moduł `dashboard`. ~~Porównanie runów~~ wyrzucone z MVP (ADR 0027). |
| Continue (resume) | Wróć do Runa tam, gdzie skończyłeś — smart-routing do najdalszego kroku z pracą. | User | Z karty Runa na dashboardzie. **Ustawia aktywny Run** (jego lejek od teraz widać). Routing: zapauzowana sesja → wznów • ≥1 task → focus • brak → process/decompose/ranking/brain dump • wszystko done → szczegóły. Atrybuty nie bramkują (ADR 0013). ADR 0022, 0044. |
| View Details / Stats | Otwórz ekran statystyk Runa: czas spędzony (suma focusa), wykonane (`completed + dismissed`), zostało, progress %. | User | Ekran zarządzania Runem („Szczegóły"). |
| Rename Run | Nadaj / edytuj opcjonalną nazwę. | User | Domyślnie = data/godzina; ze Szczegółów. |
| Review | Przejdź przez stresory / taski i zdecyduj: nadal obowiązuje (relevant) vs do usunięcia (stale). | User | **Tylko ręcznie** ze Szczegółów — nie uruchamiane automatycznie przy resume. ADR 0023. |
| Archive Run | Schowaj Run z aktywnych do archiwum (historia). | User | Ręcznie ze Szczegółów; odwracalne (Un-archive). ADR 0021. |
| Un-archive Run | Przywróć zarchiwizowany Run do aktywnych (można Kontynuować). | User | Ręcznie z archiwum. ADR 0021. |
| Delete Run | Usuń cały run na stałe (z historii/archiwum też). | User | Jedyna operacja terminalna. **Kaskadowo** z całym lejkiem (stresory, zadania, next-actiony, powody, done-visions, dane focus); jeśli usunięto aktywnego — aktywny wyczyszczony, user na Dashboardzie. ADR 0044. |

### Stressor

| Action | Description | Role | Notes |
|--------|-------------|------|-------|
| Add Stressor | Brain dump — wpisz stresor, Enter dodaje kolejny. | User | Krok 1. |
| Pick prompt suggestion | Kliknij rotujący banner-prompt, żeby sobie pomóc (pre-fill pola). | User | `PromptBanner`; rotuje co kilka sekund. |
| Edit Stressor | Zmień tekst. | User | |
| Delete Stressor | Usuń (razem z dziećmi). | User | Klawiatura: Backspace/Usuń; **undo domyślnie włączone** (Ctrl+Z). Przy review lub w dowolnym momencie. |
| Rank Stressor | Ułóż od najbardziej do najmniej stresującego. | User | Krok 2; ustawia `rank`. Ręcznie (drag/↑↓) lub przez `Pairing`. |
| Run Pairing | Uruchom i ukończ ciąg porównań parami; algorytm układa finalną kolejność. | User | Opcjonalna metoda ranking; zobowiązany ciąg (start → pełne przejście); wymaga ≥2 stresorów. |
| Mark relevant / stale | Przy review: potwierdź, że nadal obowiązuje, albo oflaguj do usunięcia. | User | |

### Motivation (WHY — materiał motywacyjny)

| Action | Description | Role | Notes |
|--------|-------------|------|-------|
| Add Reason | Dopisz powód, dlaczego stresor jest ważny, z walencją: pozytywna (zysk) / negatywna (uniknięcie bólu). | User | Blok WHY w `decompose`; kilka na stresor. Encja `Reason`. |
| Add DoneVision | Opisz pozytywną wizję efektu — zrobiony stan (żywy tekst + emoji). | User | Opcjonalne, 0..1 na stresor; atrybut `doneVision` na `Stressor`. |
| Skip motivation | Pomiń blok WHY i idź do next-actionów. | User | WHY nigdy nie blokuje (nudge, nie bramka). |

### NextAction

| Action | Description | Role | Notes |
|--------|-------------|------|-------|
| Add NextAction | Wypisz, co pchnie stresor do przodu (może być kilka). | User | Krok 3; **aktywny, konkretny język** (czasownik, wykonalne) — ADR 0006. |
| Decompose into Tasks | Rozbij gruby NextAction na konkretne Taski. | User | Prompt „Jak to możesz rozbić?" pod next-actionem; skip = 1 Task (konkretny = 1). |
| Edit NextAction | Zmień tekst. | User | |
| Delete NextAction | Usuń. | User | |

### Task

| Action | Description | Role | Notes |
|--------|-------------|------|-------|
| Create Task | Z rozbicia NextAction lub bezpośrednio (konkretny → 1 Task). | User | |
| Assign attributes (Processing) | Przypnij `Context` (jeden), `Energy` (1–3), `EstimatedTime` (preset). | User | Krok 4 (styl inbox GTD). Option-card + klawisz + Enter; jeden krok na brakujący atrybut (wzorzec `dopadone` `ProcessingView` — ADR 0012). |
| Skip attribute | Pomiń dany atrybut w Processing — zostaw null (Esc). | User | Nudge, nie bramka (ADR 0007); task bez atrybutu nie wpada do sesji tego wymagających (ADR 0013). |
| Edit Task | Zmień atrybuty / tekst. | User | W Processing i przy review-on-resume; **nie** w trakcie aktywnej sesji focus (tryb wykonania). |
| Delete Task | Usuń. | User | |
| Filter into session | Stań się kwalifikującym przez SessionFilter (Context(y) + poziomy energii). | User | Niejawne, przez wybór filtra. |
| Start → `active` | Zostań bieżącym taskiem na ekranie pod timerem. | User | W FocusSession. |
| Done → `completed` | Oznacz jako zrobione; kolejny startuje automatycznie. | User | |
| Skip → `skipped` | Odłóż; wraca jako `pending` przy następnej sesji. | User | Nie doklejane do bieżącej kolejki. |
| Back (reopen previous) | Poprzedni task znów `active`; bieżący → `pending`. | User | Cofnięcie Done / dokończenie. |
| Dismiss → `dismissed` | Oznacz jako nieaktualne (zdezaktualizowane/straciło sens); nie wraca w kolejnych sesjach. | User | Osobny od Skip (temporary) i Done. Widoczny w `SessionSummary` (osobna sekcja); liczy do progresem; **undo** (jak ADR 0004). ADR 0017. |
| ClearCompleted | Usuń completed **i dismissed** taski (moment celebracji). | User | Z SessionSummary. |
| Reorder queue | Przełóż dopasowane taski (drag / ↑↓) na liście filtra focus. | User | Aktualizuje `TaskOrder` — jeden współdzielony model kolejności (ADR 0036); default = rank stresora. Honest persistence przy awarii zapisu. |
| Reset queue order | Wyczyść `TaskOrder` → powrót do ranku stresora. | User | Z filtra focus (i dziedziczony przez listę run); dostępne gdy aktywny porządek ręczny. |
| View run task list | Zobacz wszystkie taski z prawdziwym stanem na Szczegółach Runa (pogrupowane, sortowane po `TaskOrder`). | User | `run` czyta taski cross-module (store `decompose`). ADR 0036/0037. |
| Mark task done (from details) | `pending`/`skipped`/`active` → `completed` z listy na Szczegółach. | User | `run` mutuje stan taska (pierwszy raz — ADR 0037); liczy do progresem. |
| Mark task not-relevant (from details) | → `dismissed` z listy na Szczegółach. | User | Terminalnie; undo; liczy do progresem (ADR 0017). |

### FocusSession

| Action | Description | Role | Notes |
|--------|-------------|------|-------|
| Start Session | Rozpocznij focus po wybraniu SessionFilter. | User | Krok 5→6. Kolejka uszeregowana po randku stresora (najbardziej stresujący → pierwsze). |
| Pause / Resume | Wstrzymaj przebieg sesji; wznów tam, gdzie przerwano. | User | Poprzez Timer. |

### Timer

| Action | Description | Role | Notes |
|--------|-------------|------|-------|
| Start | Rozpocznij liczenie w górę od 0 dla aktywnego taska. | User | Model B (ADR 0016). |
| Pause / Resume | Pamiętaj pozycję; wznow z zapisanej wartości. | User | Stan per Task (`timerElapsed`). |
| (counts past estimate) | Po przekroczeniu `EstimatedTime` leci dalej w górę; render czerwony (`overtime`). | System | Model B (ADR 0016). |

### SessionSummary

| Action | Description | Role | Notes |
|--------|-------------|------|-------|
| View Summary | Zobacz zrobione taski + łączny czas. | User | Krok 7 (celebracja). |
| ClearCompleted | Usuń skończone taski. | User | Moment celebracji. |
