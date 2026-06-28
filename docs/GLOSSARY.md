# Domain Glossary

Terms and concepts specific to this project. Used across all project skills to maintain a consistent language.

| Term | Code Name | Definition | Avoid saying |
|------|-----------|------------|--------------|
| Stresor (stresująca rzecz) | `Stressor` | Pojedyncza rzecz wpisana w brain dumpie — coś, co teraz stresuje. Surowy materiał wejściowy lejka, zanim zostanie rozbity na akcje. | "zadanie" (zadanie = `Task`/`NextAction` po procesowaniu), "problem" |
| Brain dump | `BrainDump` | Pierwszy krok: wyrzucenie z głowy wszystkich stresorów, jeden po drugim, bez oceny. | "lista", "wpisywanie" |
| Ranking stresu | `StressRanking` | Krok 2: ułożenie stresorów od najbardziej do najmniej stresującego. Decyduje o kolejności przetwarzania. | "sortowanie", "priorytet" (priorytet wynika ze stresu) |
| Next-action (krok do przodu) | `NextAction` | Konkretna akcja pod stresorem, która pchnie go do przodu. Jednego stresora może być kilka. Prawdopodobnie stają się jednostkami na liście focus. | "krok" (zbyt ogólne), "podzadanie" |
| Procesowanie (inbox / GTD) | `Processing` | Krok 4: nadanie każdemu zadaniu kontekstu, energii i czasu — styl inboxa GTD (jak w aplikacji *dopadone*). | "sortowanie", "tagowanie" |
| Kontekst | `Context` | Miejsce / tryb, w którym zadanie można wykonać. Kategorie do wyboru (patrz niżej). Multi-select przy wyborze sesji. | "tag", "kategoria", "etykieta" |
| — telefon | `Context.Phone` | Zadanie do zrobienia przez telefon. | |
| — wiadomość | `Context.Message` | Zadanie polegające na wysłaniu wiadomości. | |
| — kreatywne | `Context.Creative` | Zadanie wymagające myślenia twórczego. | |
| — chore (errands) | `Context.Errands` | Zadania na mieście / sprawunki (termin GTD). | |
| — dom | `Context.Home` | Zadanie do zrobienia w domu. | |
| — miasto | `Context.City` | Zadanie wymagające wyjścia do miasta. | |
| Energia | `Energy` | Ilość energii / sił potrzebna do zadania. Skala **1–3** (Low / Medium / High), renderowana jako **bateryjki** (1 = jedna bateryjka, 3 = trzy). Używana jako filtr sesji (**wielokrotny** wybór poziomów). | "trudność", "wysiłek" |
| Czas (szacowany) | `EstimatedTime` | Szacowany czas potrzebny na zadanie. Źródło wartości timera w sesji focus. | "czas", "deadline" |
| Wybór sesji / filtr | `SessionFilter` | Krok 5: wybór kontekstu(ów) i energii, który filtruje długą listę do zestawu na tę sesję. | "filtrowanie", "ustawienia" |
| Sesja focus | `FocusSession` | Krok 6: przechodzenie przez wyfiltrowany zestaw, jedno zadanie na ekranie, pod timerem. | "tryb pracy", "pomidor" |
| Timer | `Timer` | Odliczanie w dół na ekranie focus; startuje od `EstimatedTime`, po zerze leci dalej. | "stoper", "zegar" |
| Skip | `Skip` | Odłożenie bieżącego zadania — zostaje na liście na później. | "pomiń na zawsze", "usuń" |
| Done (ukończone) | `Complete` / `Completed` | Zadanie zrobione; kolejne startuje automatycznie. | "zamknij", "usuń" (usuwanie to `ClearCompleted`) |
| "Usuń skończone" | `ClearCompleted` | Akcja na ekranie podsumowania: usunięcie zrobionych zadań. Moment celebracji. | "archiwizuj" (jeśli coś innego) |
| Celebracja / podsumowanie | `SessionSummary` | Ekran na końcu sesji: lista zrobionych zadań + łączny czas spędzony na zadaniach + `ClearCompleted`. | "raport", "statystyki" |

| Run (przebieg) | `Run` | Jeden pełny przejazd lejka (brain dump → celebracja). Pojemnik najwyższego poziomu: trwały, wznawialny, z progresem (`completedTasks / totalTasks`) i opcjonalną nazwą (domyślnie data/godzina). Historia runów służy porównywaniu i motywacji. | "sesja" (sesja = `FocusSession`), "przejście" |
| Task (zadanie) | `Task` | Atomiczna, wykonywalna jednostka — element listy focus. Powstaje z `NextAction` (rozbicie 1..N; konkretny NextAction = 1 Task). Nosi `Context`, `Energy`, `EstimatedTime`. | "krok" (zbyt ogólne), "zadanie" ogólnie |
| Stan taska | `TaskState` | Cykl: `pending` → `active` → `completed` \| `skipped`. `Skip` wraca do `pending` przy następnej sesji; `Back` reaktywuje poprzedni (`active`). | "status" |
| Dashboard | `Dashboard` | Ekran główny: progres każdego Runa + historia runów do porównywania i łapania motywacji. | "panel", "strona główna" |
| Review-on-resume | `ReviewOnResume` | Przegląd przy powrocie do Runa: idziesz przez stressory / taski i decydujesz, co nadal obowiązuje, a co usunąć (przeterminowane). | "czyszczenie", "archiwizacja" |

## Moduły projektowe (code namespaces)

Nazwy modułów = foldery / przestrzenie nazw w kodzie. Szczegóły: `docs/MODULES.md`.

| Moduł | Co pokrywa |
|------|-----------|
| `capture` | Brain dump + ranking stresu (`Stressor`). |
| `decompose` | Next-actions i rozbicie na taski (`NextAction`, `Task`). |
| `process` | Procesowanie GTD — kontekst / energia / czas (`Task`). |
| `focus` | Filtrowanie sesji + sesja focus + timer + podsumowanie (`FocusSession`, `Timer`, `SessionSummary`). |
| `run` | Cykl życia Runa — tworzenie / resume / progres / review (`Run`). |
| `dashboard` | Historia runów, progres, porównanie / motywacja. |

## Zewnętrzne referencje
- **dopadone** — aplikacja-inspiracja dla stylu procesowania (inbox GTD). Nie jest częścią kodu; wzorzec UX kroku 4.
