# Action Inventory

Kompletna lista akcji, jakie user może wykonać — pogrupowana po encji. Format otwarty (nie tylko CRUD): encja → akcja → opis. Przejścia stanów traktowane jako akcje.

## Roles
- **User**: Jedyna rola — autor projektu; robi wszystko. Single-user, lokalne.

## Actions

### Run

| Action | Description | Role | Notes |
|--------|-------------|------|-------|
| Create Run | Rozpocznij nowy przejazd lejka („start fresh"). | User | Zaczyna od brain dump. |
| Rename Run | Nadaj / edytuj opcjonalną nazwę. | User | Domyślnie = data/godzina. |
| View Dashboard | Zobacz listę runów + progres każdego; porównaj dla motywacji. | User | Ekran główny. |
| Resume Run | Wróć do runa tam, gdzie skończyłeś. | User | |
| Review on resume | Przejdź przez rzeczy i zdecyduj: nadal obowiązuje vs do usunięcia. | User | Czyszczenie przeterminowanego. |
| Delete Run | Usuń cały run na stałe. | User | Założenie: dozwolone. |

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
| Assign attributes (Processing) | Przypnij `Context` (jeden), `Energy` (1–3), `EstimatedTime` (preset). | User | Krok 4 (styl inbox GTD). |
| Edit Task | Zmień atrybuty / tekst. | User | W Processing i przy review-on-resume; **nie** w trakcie aktywnej sesji focus (tryb wykonania). |
| Delete Task | Usuń. | User | |
| Filter into session | Stań się kwalifikującym przez SessionFilter (Context(y) + poziomy energii). | User | Niejawne, przez wybór filtra. |
| Start → `active` | Zostań bieżącym taskiem na ekranie pod timerem. | User | W FocusSession. |
| Done → `completed` | Oznacz jako zrobione; kolejny startuje automatycznie. | User | |
| Skip → `skipped` | Odłóż; wraca jako `pending` przy następnej sesji. | User | Nie doklejane do bieżącej kolejki. |
| Back (reopen previous) | Poprzedni task znów `active`; bieżący → `pending`. | User | Cofnięcie Done / dokończenie. |
| ClearCompleted | Usuń completed taski (moment celebracji). | User | Z SessionSummary. |

### FocusSession

| Action | Description | Role | Notes |
|--------|-------------|------|-------|
| Start Session | Rozpocznij focus po wybraniu SessionFilter. | User | Krok 5→6. |
| Pause / Resume | Wstrzymaj przebieg sesji; wznów tam, gdzie przerwano. | User | Poprzez Timer. |

### Timer

| Action | Description | Role | Notes |
|--------|-------------|------|-------|
| Start | Rozpocznij odliczanie od `EstimatedTime` aktywnego taska. | User | |
| Pause / Resume | Pamiętaj pozycję; wznow z zapisanej wartości. | User | Stan per Task (`timerElapsed`). |
| (counts past zero) | Po dojściu do 0 liczy dalej w górę. | System | |

### SessionSummary

| Action | Description | Role | Notes |
|--------|-------------|------|-------|
| View Summary | Zobacz zrobione taski + łączny czas. | User | Krok 7 (celebracja). |
| ClearCompleted | Usuń skończone taski. | User | Moment celebracji. |
