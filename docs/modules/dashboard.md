# Dashboard

## Vision
Dashboard to **pas startowy, nie neutralna lista**. Jego pierwsza praca: w jednym kliku wrzucić usera z powrotem do roboty. User otwiera apkę i od razu widzi **możliwość działania** — dominującą kartę ostatnio-pracowanego runa (duża, Continue na wierzchu), a obok świadomy przycisk „rozpocznij nowy". Poniżej mniejsze karty pozostałych aktywnych runów; na samym końcu listy — wejście do archiwum/historii.

Motywacja na dashboardzie to **głównie momentum progresem** (pasek, ile zrobione / ile zostało, %), lekko wspierane czasem spędzonym („już 2h włożone"). WHY/wizja efektu i kontrast między runami **nie żyją** na tym ekranie — kontrast/„Compare runs" wyrzucony z MVP (ADR 0027).

To ekran wejściowy apki — ustawia ton tak samo jak `capture`, tylko od strony „wracaj do roboty", nie „zaczynaj od zera".

## User Flows

### Open dashboard (land) → resume work
1. User otwiera apkę → ląduje na dashboardzie.
2. Widzi **dominującą kartę ostatnio-pracowanego runa** (sortowanie po `lastActiveAt` — ADR 0028) z progresem i przyciskiem **Continue**.
3. klika Continue → smart-routing do najdalszego kroku lejka z pracą (routing należy do `run` — zob. `run.md` / ADR 0022).
4. W jednym kliku jest z powrotem w pracy, bez wyboru kroku.

### Start new run
1. User klika **„Rozpocznij nowy"** (przycisk obok dominującej karty, świadomy, drugoplanowy).
2. Aplikacja tworzy Run (nazwa = data/godzina, stan `in_progress`, `progress = 0`, `lastActiveAt = teraz`).
3. User ląduje w `capture` (brain dump) — pierwszy krok lejka.

### Continue any run (z mniejszej karty)
1. User przewija do mniejszej karty aktywnego runa.
2. klika **Continue** na tej karcie → smart-routing per-Run (jak wyżej).

### View Details (z dowolnej karty)
1. User klika **Szczegóły** na karcie runa (dominującej lub mniejszej).
2. Otwiera się ekran zarządzania Runem (`run.md` → Run Details): statystyki + akcje (rename, review, archive, delete).

### Enter archive / historia
1. User przewija listę aktywnych runów na sam dół.
2. klika wejście do **archiwum**.
3. Widzi pasywną listę zarchiwizowanych runów ze statystykami; może **Un-archive** (przywrócić do aktywnych) albo tylko przejrzeć. Brak dedykowanego UI porównania (ADR 0027).

### First-ever open (zero runów)
1. User otwiera apkę pierwszy raz (brak runów).
2. Widzi **wielki, zachęcający do pracy button** (start fresh) → tworzy pierwszy Run → `capture`.

## Screens (rough)

- **Dashboard (launcher)**: dominująca karta ostatnio-pracowanego runa na górze; obok niej przycisk „Rozpocznij nowy"; poniżej mniejsze karty pozostałych aktywnych runów (każda Continue + Szczegóły, uporządkowane po `lastActiveAt` desc); na końcu listy wejście do archiwum/historii.
- **Dominant run card**: duży format, **progres na pierwszym planie** — pasek progresu + „X z Y zrobione" + „Zostało N" + %; lekki akcent **czasu spędzonego** jako wspierający motywator; **Continue** jako primary CTA, **Szczegóły** secondary. WHY/wizja/kontrast — nie tu.
- **Mini run card**: nazwa + progres (mini-pasek / %) + **Continue** i **Szczegóły**. Te same akcje co dominująca, tylko mniejszy format.
- **Archive / historia**: lista zarchiwizowanych runów z mini-statystykami; akcja **Un-archive**; brak UI porównania.
- **Empty state (zero runów)**: wielki, zapraszający do pracy button (start fresh). Pierwszy kontakt od strony dashboardu — ustawia ton.

## Actions

| Action | Description | Entity | Notes |
|--------|-------------|--------|-------|
| View Dashboard | Otwórz launcher: dominujący ostatni run + aktywne + wejście do archiwum. | `Run` | Ekran wejściowy apki. |
| Continue (resume) | Smart-routing do najdalszego kroku z pracą. | `Run` | Na każdej karcie runa (dominującej i mniejszych). ADR 0022. |
| View Details / Stats | Ekran statystyk + zarządzanie Runem. | `Run` | Na każdej karcie runa. Szczegóły w `run.md`. |
| Start new Run | Rozpocznij nowy przejazd lejka. | `Run` | Przycisk obok dominującej karty; świadomy wybór. `capture` tworzy Run implicite. |
| Enter archive | Wejdź do historii zarchiwizowanych runów. | `Run` | Wejście na końcu listy aktywnych runów. |
| Un-archive Run | Przywróć zarchiwizowany Run do aktywnych. | `Run` | Z archiwum; odwracalne. ADR 0021. |
| ~~Compare runs~~ | ~~Porównanie przejazdów dla motywacji.~~ | — | **Wyrzucone z MVP** (ADR 0027). Archiwum = pasywna lista. |

## Edge Cases

- **Zero runów (pierwsze otwarcie)**: wielki, zachęcający do pracy button → start fresh → `capture`.
- **Jeden aktywny run**: on jest dominującą kartą, lista mniejszych pusta; wejście do archiwum nadal widoczne (puste, jeśli nic niezarchiwizowane).
- **Wszystkie runy zarchiwizowane (brak aktywnych)**: pusta lista aktywnych + komunikat „brak aktywnych przejazdów" + wyeksponowane wejście do archiwum + „rozpocznij nowy".
- **Run ukończony (100%), ale niezarchiwizowany**: widoczny na liście aktywnych ze stanem „ukończony" (pełny progres); Continue → Szczegóły w stanie „ukończony" (`run.md`). Brak auto-archive.
- **Błąd odczytu storage** (uszkodzony `run:runs`): stan błędu (`RunReadError`) zamiast mylnego empty-state; odśwież jako droga naprawy (jak `run.md`).
- **Wiele aktywnych runów**: sortowanie po `lastActiveAt` desc; dominująca karta = max(`lastActiveAt`). W prototypie bez paginacji — długą listę trzeba będzie ogarnąć w lofi.
- **Statystyki poglądowe**: w prototypie statystyki / `lastActiveAt` / ordering są mockiem (dane lejka globalne, jak `run.md`) — oznaczone jako poglądowe; realne spięcie per-Run odłożone do fazy integracji (cross-module).

## Integration Points

- **run**: dashboard czyta runy (stan, progres, `lastActiveAt`) i uruchamia akcje run-lifecycle — Continue (smart-routing), Create/Start new, View Details, Enter archive, Un-archive. Dominująca karta = run z największym `lastActiveAt`.
- **capture / decompose / process / focus**: uruchamiane pośrednio przez Continue (smart-routing rzuca usera w odpowiedni krok lejka wewnątrz aktywnego Runa). Start new → `capture`.
- **dashboard ↔ run**: dashboard to warstwa widoku nad cyklem życia Runa opisanym w `run.md`; przejmuje launcher i listę/archiwum, podczas gdy `run` trzyma logikę stanów, statystyk i routingu resume.
