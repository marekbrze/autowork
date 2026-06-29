# Domain Glossary

Terms and concepts specific to this project. Used across all project skills to maintain a consistent language.

| Term | Code Name | Definition | Avoid saying |
|------|-----------|------------|--------------|
| Stresor (stresująca rzecz) | `Stressor` | Pojedyncza rzecz wpisana w brain dumpie — coś, co teraz stresuje. Surowy materiał wejściowy lejka, zanim zostanie rozbity na akcje. | "zadanie" (zadanie = `Task`/`NextAction` po procesowaniu), "problem" |
| Brain dump | `BrainDump` | Pierwszy krok: wyrzucenie z głowy wszystkich stresorów, jeden po drugim, bez oceny. | "lista", "wpisywanie" |
| Rotujący banner-prompt | `PromptBanner` | Interaktywny banner w brain dumpie, zmieniający się co kilka sekund; podsuwa kategorie / przykłady stresorów („finanse", „A rata kredytu?"), żeby wyciągnąć to, co umyka. Klikalny — pomaga wypełnić pole. | "podpowiedzi", "tooltip" |
| Ranking stresu | `StressRanking` | Krok 2: ułożenie stresorów od najbardziej do najmniej stresującego. Decyduje o kolejności przetwarzania. | "sortowanie", "priorytet" (priorytet wynika ze stresu) |
| Parowanie (ranking parami) | `Pairing` | Opcjonalna metoda ranking: zobowiązany ciąg porównań parami („który bardziej stresuje: A czy B?"); po przejściu całości mądry algorytm (np. insertion/merge sort, ranking ELO) układa finalną kolejność. Obok ręcznego układania listy. | "głosowanie", "sortowanie" |
| Motywacja (materiał motywacyjny) | `Motivation` | WHY w `decompose`: powody, dla których stresor jest ważny, + wizja efektu. „Ładuje baterię", którą `focus` zużywa później jako przypomnienie „po co to robisz". | "opis", "komentarz" |
| Powód (motywacyjny) | `Reason` | Pojedynczy powód, dla którego stresor jest dla usera ważny. Niesie walencję: pozytywną (zysk) lub negatywną (uniknięcie bólu). Kilka na stresor. | "zaleta", "minus" |
| Walencja motywacji | `Valence` | Rodzaj motywacji: `positive` (approach — zysk) lub `negative` (avoidance — uniknięcie bólu). | "dodatnia/ujemna" |
| Wizja efektu | `DoneVision` | Pozytywna wizualizacja zrobionego stanu stresora — żywy, zmysłowy opis (tekst + emoji). Payoff. | "cel", "marzenie" |
| Next-action (krok do przodu) | `NextAction` | Konkretna akcja pod stresorem, która pchnie go do przodu — **zapisana aktywnym, konkretnym językiem** (czasownik, wykonalne). Jednego stresora może być kilka. Prawdopodobnie stają się jednostkami na liście focus. | "krok" (zbyt ogólne), "podzadanie" |
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
| Timer | `Timer` | Licznik na ekranie focus — liczy **w górę od 0:00**; `EstimatedTime` to próg, po którego przekroczeniu renderuje się czerwono (model B, ADR 0016). | "stoper", "zegar" |
| Skip | `Skip` | Odłożenie bieżącego zadania — zostaje na liście na później. | "pomiń na zawsze", "usuń" |
| Done (ukończone) | `Complete` / `Completed` | Zadanie zrobione; kolejne startuje automatycznie. | "zamknij", "usuń" (usuwanie to `ClearCompleted`) |
| Nieaktualne (odrzucone) | `Dismiss` / `dismissed` | Task, który stracił sens (zdezaktualizowany, ktoś inny załatwił, okoliczności się zmieniły) — oznaczony w `focus` jako nie do zrobienia. Osobny od `Skip` (odłożone na później) i `Done`. Nie wraca w kolejnych sesjach, ma undo, liczy do progresem, w `SessionSummary` osobną sekcją (ADR 0017). | "usunięte" (usuwanie = `ClearCompleted`), "anulowane" |
| "Usuń skończone" | `ClearCompleted` | Akcja na ekranie podsumowania: usunięcie zrobionych zadań. Moment celebracji. | "archiwizuj" (jeśli coś innego) |
| Celebracja / podsumowanie | `SessionSummary` | Ekran na końcu sesji: lista zrobionych zadań + łączny czas spędzony na zadaniach + `ClearCompleted`. | "raport", "statystyki" |

| Run (przebieg) | `Run` | Jeden pełny przejazd lejka (brain dump → celebracja). **Widoczny obiekt ze statystykami** (ADR 0020): trwały, wznawialny, z progresem (`(completed + dismissed) / total`), czasem spędzonym i opcjonalną nazwą (domyślnie data/godzina). Wiele runów żyje równolegle; stany `in_progress` \| `archived`. Historia runów służy porównywaniu i motywacji. | "sesja" (sesja = `FocusSession`), "przejście" |
| Task (zadanie) | `Task` | Atomiczna, wykonywalna jednostka — element listy focus. Powstaje z `NextAction` (rozbicie 1..N; konkretny NextAction = 1 Task). Nosi `Context`, `Energy`, `EstimatedTime`. | "krok" (zbyt ogólne), "zadanie" ogólnie |
| Stan taska | `TaskState` | Cykl: `pending` → `active` → `completed` \| `skipped` \| `dismissed`. `Skip` wraca do `pending` przy następnej sesji; `Back` reaktywuje poprzedni (`active`); `Dismiss` = terminalnie nieaktualny (nie wraca, undo, liczy do progresem — ADR 0017). | "status" |
| Dashboard | `Dashboard` | Ekran wejściowy / launcher (pas startowy): dominująca karta ostatnio-pracowanego runa (progres na pierwszym planie) + aktywne runy + wejście do archiwum. W jednym kliku wraca do roboty; motywacja = głównie momentum progresem. | "panel", "strona główna", "lista runów" |
| Review-on-resume | `Review` | Przegląd Runa: idziesz przez stresory / taski i decydujesz, co nadal obowiązuje (relevant), a co usunąć (stale / przeterminowane). **Tylko ręcznie** ze Szczegółów — nie uruchamiany automatycznie przy resume (ADR 0023). | "czyszczenie", "archiwizacja" |
| Kontynuuj (wznów) | `Continue` | Smart-routing resume Runa z dashboardu do najdalszego kroku lejka z pracą (zapauzowana sesja → wznów • ≥1 task → focus • brak → process/decompose/ranking/brain dump • wszystko done → szczegóły). Atrybuty nie bramkują (ADR 0013). ADR 0022. | "start", "otwórz" |
| Szczegóły Runa | `RunDetails` | Ekran statystyk i zarządzania pojedynczym Runem: czas spędzony (suma z focusa), wykonane (`completed + dismissed`), zostało, progress % + akcje (rename, review, archive/unarchive, delete). | "panel runa", "statystyki" |
| Archiwizacja | `Archive` / `archived` | Stan Runa: schowany z aktywnych na dashboardzie, ale zostaje w archiwum/historii (statystyki + porównanie widoczne, możliwy do rozarchiwizowania). Ręczny, odwracalny. ADR 0021. | "zakończ", "ukryj" |
| Rozarchiwizowanie | `Un-archive` | Przywrócenie zarchiwizowanego Runa do aktywnych (można znów Kontynuować). ADR 0021. | "przywróć" |
| Krok lejka | `FunnelStep` | Poziom osiągnięty w lejku (brain dump → ranking → decompose → process → focus → celebracja); trzymany na Runie jako `lastReachedStep`, steruje routingiem Kontynuuj. | "etap", "faza" |

## Moduły projektowe (code namespaces)

Nazwy modułów = foldery / przestrzenie nazw w kodzie. Szczegóły: `docs/MODULES.md`.

| Moduł | Co pokrywa |
|------|-----------|
| `capture` | Brain dump + ranking stresu (`Stressor`). |
| `decompose` | WHY (motywacja: powody + wizja efektu) i HOW (next-actiony → taski) — `Reason`, `DoneVision`, `NextAction`, `Task`. |
| `process` | Procesowanie GTD — kontekst / energia / czas (`Task`). |
| `focus` | Filtrowanie sesji + sesja focus + timer + podsumowanie (`FocusSession`, `Timer`, `SessionSummary`). |
| `run` | Cykl życia Runa — tworzenie / resume / progres / review (`Run`). |
| `dashboard` | Historia runów, progres, porównanie / motywacja. |

## Zewnętrzne referencje
- **dopadone** — aplikacja-inspiracja dla stylu procesowania (inbox GTD). Nie jest częścią kodu; wzorzec UX kroku 4.
