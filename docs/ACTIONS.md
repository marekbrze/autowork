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
| Rank Stressor | Ułóż od najbardziej do najmniej stresującego. | User | Krok 2; ustawia `rank`. |
| Edit Stressor | Zmień tekst. | User | |
| Delete Stressor | Usuń (razem z dziećmi). | User | Przy review lub w dowolnym momencie. |
| Mark relevant / stale | Przy review: potwierdź, że nadal obowiązuje, albo oflaguj do usunięcia. | User | |

### NextAction

| Action | Description | Role | Notes |
|--------|-------------|------|-------|
| Add NextAction | Wypisz, co pchnie stresor do przodu (może być kilka). | User | Krok 3. |
| Decompose into Tasks | Rozbij gruby NextAction na konkretne Taski. | User | 1..N; konkretny = 1. |
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
