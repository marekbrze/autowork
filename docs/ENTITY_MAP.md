# Entity Map

Struktura domenowa: co istnieje w systemie, jak się łączy, do kogo należy i jakie ma stany.
Nazwy encji są po angielsku — to identyfikatory, które wejdą do kodu. Opisy po polsku.

## Diagram

```mermaid
erDiagram
    User ||--o{ Run : "owns"
    Run ||--o{ Stressor : "brain dump"
    Stressor ||--o{ Reason : "motivated by (WHY)"
    Stressor ||--o{ NextAction : "has (HOW)"
    NextAction ||--o{ Task : "decomposes into (1..N)"
    Run ||--o{ FocusSession : "has"
    FocusSession }o--o{ Task : "filtered queue (M:N)"
    FocusSession ||--|| Timer : "runs"
    FocusSession ||--|| SessionSummary : "ends with"

    Task {
        Context context "single: Phone|Message|Creative|Errands|Home|City"
        Energy energy "1..3 (batteries)"
        EstimatedTime estimatedTime "preset: 5|15|30|45|60"
        TaskState state "pending|active|completed|skipped|dismissed"
        int timerElapsed "persisted, for resume"
    }
    Stressor {
        int rank "position: most→least stressful"
        string text
        DoneVision doneVision "optional; vivid done-state (text+emoji)"
    }
    Reason {
        string text
        Valence valence "positive (gain) | negative (avoid pain)"
    }
    Run {
        string name "optional; default = timestamp"
        float progress "(completedTasks + dismissedTasks) / totalTasks"
        int timeSpent "cumulative focus time (sum of timerElapsed)"
        FunnelStep lastReachedStep "for resume routing"
        datetime lastActiveAt "last activity; drives dashboard ordering (ADR 0028)"
        RunState state "in_progress | archived"
    }
```

**Typy wartości (atrybuty, nie encje):** `Context` (enum), `Energy` (1–3), `EstimatedTime` (preset), `Valence` (positive|negative), `DoneVision` (text+emoji), `RunState` (`in_progress` | `archived`), `FunnelStep` (krok lejka, steruje routingiem resume), `TaskOrder` (uporządkowana lista ID tasków — ręczny porządek kolejki; relacja `Run 1—1 TaskOrder 1—* Task`).
**Pomijalnie jako encje (przejściowe ekrany/kroki):** `BrainDump`, `StressRanking`, `Processing`, `SessionFilter`, `Dashboard`.

**`TaskOrder` — jeden współdzielony model kolejności (ADR 0036):** uporządkowana lista ID tasków, default (pusty / po resecie) = kolejność po ranku stresora (jak `attributed` w `FocusView`). Ręczne przełożenie (drag / ↑↓ na liście filtra focus) go nadpisuje. Ten sam `TaskOrder` decyduje o kolejności w **trzech miejscach**: liście dopasowanych w filtrze focus, kolejce sesji po Starcie, liście zadań na Szczegółach Runa (sort wewnątrz grup stanu). W prototypie globalny (dane lejka bez `runId`, ADR 0020); w intencji per-Run.

## Entities

### User
**Description**: Jedyna rola — autor projektu używający aplikacji jako osobistego narzędzia. Single-user, lokalne (localStorage).
**Instances per user**: Jeden (brak kont, tożsamość = urządzenie).
**Ownership**: Posiada wszystkie Runy i ich zawartość.
**Lifecycle**: Stała, bezstanowa tożsamość lokalna.
**States**: brak.
**Contains**: Runy.
**Belongs to**: —.

### Run
**Description**: Jeden pełny przejazd lejka (brain dump → ranking → next-actions → procesowanie → wybór sesji → focus → celebracja). Pojemnik najwyższego poziomu, **widoczny obiekt ze statystykami** (ADR 0020). Trzyma historię, więc runy można porównywać i czerpać z nich motywację.
**Instances per user**: Wiele — żyją równolegle, odpalane z dashboardu (historia zostaje).
**Ownership**: User.
**Lifecycle**: Tworzony przy „start new" (`capture` implicite); trwały między otwarciami apki; wznawialny (Kontynuuj — ADR 0022); archiwizowany ręcznie (odwracalnie); możliwy do usunięcia trwale.
**States**: `in_progress` (aktywny, widoczny na liście aktywnych, wznawialny) | `archived` (schowany z aktywnych, widoczny w archiwum/historii, odwracalny przez Un-archive — ADR 0021). Brak formalnego stanu terminalnego poza usunięciem; „ukończony" to stan wyliczany z `progress`, nie osobny stan.
**Attributes**:
  - `name`: string — opcjonalna; domyślnie data/godzina.
  - `progress`: float — `(completedTasks + dismissedTasks) / totalTasks`.
  - `timeSpent`: int — łączny czas z focusa (suma `timerElapsed` po taskach/sesjach).
  - `lastReachedStep`: `FunnelStep` — najdalszy osiągnięty krok lejka; steruje routingiem Kontynuuj.
  - `lastActiveAt`: `datetime` — znacznik ostatniej aktywności w Runie (praca w lejku, Continue); steruje sortowaniem na dashboardzie i wyborem dominującej karty (ADR 0028).
**Contains**: Stressory, FocusSessiony.
**Belongs to**: User.

### Stressor
**Description**: Pojedyncza stresująca rzecz wyrzucona z głowy w brain dumpie. Surowy materiał, zanim zostanie rozbity na akcje.
**Instances per Run**: Wiele (0..N; dodawane w kroku 1).
**Ownership**: Run.
**Lifecycle**: Tworzony w brain dumpie → ustawiany `rank` (ranking) → przy review-on-resume decydowane, czy nadal obowiązuje → ewentualnie usuwany.
**States**: brak formalnych; niesie `rank` (pozycja od najbardziej do najmniej stresującego) — ustalany ręcznie (układanie listy) lub przez `Pairing` (porównania parami). Na resume: *relevant* / *stale (do usunięcia)*.
**Contains**: NextActiony; **Reasons** (materiał motywacyjny) + opcjonalny `doneVision`.
**Belongs to**: Run.

### Reason
**Description**: Pojedynczy powód, dla którego stresor jest dla usera ważny — element materiału motywacyjnego (odpowiedź na „dlaczego"). Niesie walencję: pozytywną (zysk) lub negatywną (uniknięcie bólu). Tworzony w `decompose`; konsumowany później, np. w `focus`.
**Instances per Stressor**: Wiele (0..N).
**Ownership**: Stressor / Run.
**Lifecycle**: Tworzony w `decompose` → edytowalny / usuwalny; konsumowany w `focus` (wyświetlany jako motywacja).
**States**: brak formalnych; niesie `valence`.
**Attributes**: `valence`: `Valence` — `positive` (zysk) | `negative` (uniknięcie bólu).
**Contains**: —.
**Belongs to**: Stressor.

### NextAction
**Description**: Kierunek / pomysł, co pchnie stresor do przodu. Grubszy niż task — może być konkretny (→ 1 task) albo rozbity na kilka.
**Instances per Stressor**: Wiele (0..N; dopisywane w kroku 3).
**Ownership**: Stressor / Run.
**Lifecycle**: Tworzony w kroku 3 → opcjonalnie rozbity na Taski → edytowalny / usuwalny.
**States**: brak formalnych.
**Contains**: Taski (1..N; ≥1 wymagane, żeby wejść do lejka dalej).
**Belongs to**: Stressor.

### Task
**Description**: Atomiczna, wykonywalna jednostka — element listy focus. Nosi kontekst, energię i szacowany czas. Powstaje z NextAction (rozbicie 1..N; konkretny NextAction = 1 Task).
**Instances per NextAction**: 1..N.
**Ownership**: NextAction / Run.
**Lifecycle**: Tworzony (rozbicie lub bezpośrednio) → atrybuty przypięte w Processing → cyklony przez sesje focus → completed / skipped → możliwy do wyczyszczenia (ClearCompleted).
**States**: `pending` → `active` → `completed` | `skipped` | `dismissed`.
  - `Skip` → `skipped` → (przy **następnej** sesji) → `pending`.
  - `Back` → reaktywacja poprzedniego (znów `active`); bieżący wraca jako `pending`.
  - `Dismiss` → `dismissed` (terminalny; **nie** wraca w kolejnych sesjach; widoczny w `SessionSummary`, liczy do progresem, undo — ADR 0017).
**Attributes**:
  - `context`: `Context` (dokładnie jeden) — `Phone` | `Message` | `Creative` | `Errands` | `Home` | `City`
  - `energy`: `Energy` — 1..3 (bateryjki: 1 = Low, 3 = High)
  - `estimatedTime`: `EstimatedTime` — preset `5` | `15` | `30` | `45` | `60` min
  - `timerElapsed`: licznik upłyniętego czasu — persystowany, do wznowienia timera
  - **Nullability**: `context`, `energy`, `estimatedTime` są **opcjonalne (nullable)** — nadawane w `process`, ale każdy można pominąć (nudge, ADR 0007/0013); task bez danego atrybutu nie kwalifikuje się do sesji tego wymagających.
**Contains**: —.
**Belongs to**: NextAction.

### FocusSession
**Description**: Przejście focus: wyfiltrowany zestaw tasków przerabiany po jednym pod timerem, zakończony podsumowaniem.
**Instances per Run**: Wiele (0..N; kilka sesji w jednym Runie na różnych filtrach).
**Ownership**: Run.
**Lifecycle**: Tworzona przy Start (po SessionFilter) → taski cyklone → kończy się SessionSummary.
**States**: `running` (aktywny task pod timerem) | `paused` | `finished`.
**Contains**: wyfiltrowane Taski (M:N), Timer, SessionSummary.
**Belongs to**: Run.

### Timer
**Description**: Licznik dla aktywnego taska — **liczy w górę od 0:00** (model B, ADR 0016); `EstimatedTime` to próg, po którego przekroczeniu licznik renderuje się na czerwono. **Pamięta pozycję** — po pauzie/wznawianiu kontynuuje tam, gdzie stanął (stan licznika trzymany per Task: `timerElapsed`).
**Instances per FocusSession**: Jeden (UI); stan per Task.
**Ownership**: FocusSession.
**Lifecycle**: Tworzony z sesją; wartość persystowana; wznawiany.
**States**: `running` | `paused` | `overtime` (`timerElapsed` > `EstimatedTime` — po progu, render czerwony).
**Contains**: —.
**Belongs to**: FocusSession.

### SessionSummary
**Description**: Ekran na końcu sesji: zrobione taski + łączny czas spędzony na zadaniach + akcja „Usuń skończone" (moment celebracji).
**Instances per FocusSession**: Jedno.
**Ownership**: FocusSession.
**Lifecycle**: Generowane po zakończeniu sesji; ClearCompleted usuwa completed taski.
**States**: brak (widok).
**Contains**: —.
**Belongs to**: FocusSession.
