# Focus

## Vision
Serce aplikacji — payoff całego lejka. Po przefiltrowaniu zadań user wchodzi w sesję, w której **jedno zadanie goni drugie** pod **łagodnym timerem** (liczy w górę, nic „nie ucieka"), a materiał motywacyjny (WHY z `decompose`) jest **zawsze widoczny** na ekranie zadania. Tu realizuje się obietnica narzędzia: zdejmujemy z człowieka ciężar decydowania „co dalej" — sesja sama prowadzi przez zestaw, kolejne zadanie startuje samo (Done → od razu następne), a na końcu czeka moment celebracji.

Timer liczy **w górę od 0:00**; oszacowany czas (`EstimatedTime` z `process`) to **próg**, po którego przekroczeniu licznik robi się **czerwony** (model B, ADR 0016 — zmiana z odliczania w dół). Stonowana energia zamiast presji tykającego odliczania; dla persony ADHD/overwhelmed licznik „jak długo już robię" jest łagodniejszy niż „czas ucieka".

Kolejność w sesji = **po randku stresora** (najbardziej stresujący → pierwsze), więc user zaczyna od tego, co najbardziej ciąży.

## User Flows

### Wejście: SessionFilter → Start
1. User wchodzi w `focus` z `process` (przez „Dalej" / stepper, ADR 0001) → ekran **wyboru sesji**.
2. **SessionFilter (jeden ekran)**: wybiera **≥1 kontekst** (multi-select) i **≥1 poziom energii** (multi-select) — wszystko na raz, nie krok po kroku.
3. Widzi **licznik dopasowanych** tasków na żywo (ile wpadło do zestawu).
4. Klika duży **„Zacznij"** → startuje sesja.
   - **0 dopasowań** → „Zacznij" **zablokowany** + komunikat info (empty state).

### Sesja: pętla zadań (rdzeń)
Po Starcie pierwsze zadanie z kolejki (randk stresora → najbardziej stresujący pierwsze). Ekran zadania:
1. **Tytuł taska** + jego atrybuty (kontekst, energia, czas) — jeden task dominuje ekran.
2. **Timer liczący w górę od 0**; próg = `EstimatedTime` → po przekroczeniu **czerwono** (`overtime`).
3. **Motywacja zawsze widoczna**: powody (z walencją zysk/uniknięcie bólu) + wizja efektu z `decompose` (payoff budowania WHY).
4. Akcje przy tasku:
   - **Done** → task `completed`; **następne zadanie startuje od razu** (bez pauzy/beatu).
   - **Skip** → `skipped`; odłożone, **wraca jako `pending` przy następnej sesji** (nie doklejane do bieżącej kolejki).
   - **Dismiss (nieaktualne)** → `dismissed` (terminalnie; nie wraca) — osobna akcja, ADR 0017.
   - **Back** → cofnięcie do poprzedniego zadania (omyłkowe Done / chęć dokończenia).
   - **Pauza** → wstrzymanie timera/sesji; Resume z zapamiętanej pozycji.
   - **Wyjście** → zakończenie wcześniej.

### Skip vs Dismiss (kluczowe rozróżnienie)
- **Skip** = „nie teraz, wrócę" — task żyje, wraca przy **następnej sesji** jako `pending`.
- **Dismiss** = „to już nieaktualne, straciło sens" (termin minął, ktoś inny załatwił, okoliczności się zmieniły) — task **terminalnie `dismissed`**, **nie wraca**; **undo** (cofnięcie → `pending`, jak ADR 0004); **liczy do progresem** Runa; w podsumowaniu w **osobnej sekcji**.

### Zakończenie: celebracja
- **Auto-podsumowanie** jak przeliczysz cały zestaw (lub po **Wyjściu**).
- **SessionSummary**: zrobione taski + **łączny czas** spędzony na zadaniach + **Nieaktualne w osobnej sekcji**.
- **„Usuń skończone"** (`ClearCompleted`) — czyści `completed` **i** `dismissed` (moment celebracji).

### Wczesne wyjście (Exit)
- Klikasz **Wyjście** w trakcie sesji → bieżący task **zostaje `active`**; sesja wstrzymana.
- Wznowienie → kontynuacja od tego samego taska; timer pamięta pozycję per task (`timerElapsed`).

## Screens (rough)
- **SessionFilter / start**: jeden ekran. Wybór kontekstów (multi) + energii (multi), licznik dopasowanych na żywo, duży **„Zacznij"** (zablokowany przy 0 + info). Zero friction; ustawia zakres sesji.
- **Ekran zadania (focus)**: dominuje jedno zadanie (tytuł + atrybuty). Pod spodem duży **timer liczący w górę** (próg = oszacowanie → czerwono). **Sekcja motywacji zawsze widoczna** (powody z walencją + wizja efektu). Akcje: Done / Skip / Dismiss / Back / Pauza (+ Wyjście). Minimalny distract — prowadzimy za rękę.
- **Podsumowanie (celebracja)**: zrobione taski + **łączny czas**; **Nieaktualne w osobnej sekcji**; przycisk **„Usuń skończone"** (Done + Nieaktualne).

## Actions

| Action | Description | Entity | Notes |
|--------|------------|--------|-------|
| Filter session | Wybierz konteksty + energie (multi), zobacz licznik dopasowanych. | SessionFilter | Jeden ekran; „Zacznij" zablokowany przy 0 + info. |
| Start Session | Rozpocznij sesję po filtrze. | FocusSession | Kolejka po randku stresora (najbardziej stresujący → pierwsze). |
| Done → `completed` | Oznacz jako zrobione; następne startuje od razu. | Task | Bez pauzy między zadaniami. |
| Skip → `skipped` | Odłóż; wraca jako `pending` przy następnej sesji. | Task | Temporary — różne od Dismiss. |
| Dismiss → `dismissed` | Oznacz jako nieaktualne (straciło sens). | Task | Nowy status (ADR 0017); nie wraca, undo, liczy do progresem, osobna sekcja w summary. |
| Back (reopen previous) | Cofnij do poprzedniego zadania. | Task | Bieżący → `pending`. |
| Timer Start / Pause / Resume | Licz w górę od 0; pauza/wznowienie z zapamiętanej pozycji. | Timer | Model B (ADR 0016); próg = oszacowanie → czerwono. |
| Exit (early) | Zakończ wcześniej; bieżący task zostaje `active`. | FocusSession | Wznowienie od tego samego taska. |
| View Summary | Auto-po wyczerpaniu zestawu (lub po Exit). | SessionSummary | Done + łączny czas + Nieaktualne (osobna sekcja). |
| ClearCompleted | Usuń `completed` + `dismissed`. | Task | Moment celebracji. |

## Edge Cases
- **0 dopasowań w filtrze**: „Zacznij" **zablokowany** + komunikat info (empty state).
- **Wszystko rozwiązane**: taski opisane są, ale żadne `pending` — komunikat „Wszystkie zadania zrobione — brawo" + CTA do `process` (różne od „brak atrybutów").
- **Wczesne wyjście / refresh / browser-back**: snapshot sesji (kolejka + pozycja) persystowany w `focus:session`; przy wejściu w `/focus` z przerwaną sesją → banner „Wznów sesję" (opt-in). Timer pamięta pozycję per task (`timerElapsed`). Lo-fi trzyma bieżący task jako `pending` (stan `active` nieużywany w proto — patrz ADR 0019).
- **Awaria zapisu (LocalStorage pełne/wyłączone)**: akcja (Done/Skip/Dismiss/Back/Clear) **nie wykonuje się** przy nieudanym zapisie — user zostaje na tasku, `StorageStatusToast` z retry (żadna cicha utrata; wzorzec z `ProcessView`).
- **Awaria odczytu**: uszkodzony odczyt → stan błędu („Nie udało się wczytać zadań" + Odśwież) zamiast mylnego empty-state listy.
- **Zmiana stanu mid-session (inna karta)**: task rozwiązany „za plecami" nie zostaje pokazany jako bieżący — rekonsyliacja przewija do następnego `pending` w kolejce (albo kończy sesję).
- **Overtime (timer > oszacowanie)**: tylko wizualnie czerwony (motywacja i tak zawsze widoczna — brak dodatkowego triggera).
- **Sesja 1-zadaniowa**: Done → od razu podsumowanie.
- **Undo Dismiss**: cofnięcie `dismissed` → wraca jako `pending` (jak undo usuwania stresora, ADR 0004). Działa **też z ekranu podsumowania** (toast undo żyje na poziomie `FocusView`, przeżywa skok do summary przy dismiss ostatniego taska).
- **Back na pierwszym zadaniu**: brak poprzedniego → akcja ukryta/zablokowana (dead-end). Back otwiera na nowo tylko `completed`/`skipped`; **nie** un-dismissuje (to osobna ścieżka undo).
- **Motywacja brakująca**: task ze stresora bez WHY w `decompose` → sekcja motywacji pusta/pomięta (nudge, nie błąd — WHY nigdy nie blokuje, ADR 0007).

## Integration Points
- **`process`**: wejście — pobiera taski opisane atrybutami (`Context` / `Energy` / `EstimatedTime`); one napędzają filtr i **próg timera**.
- **`decompose`**: dostarcza **motywację** (Reasons + DoneVision per stresor) — **zawsze widoczną** na ekranie zadania (payoff budowania WHY).
- **`capture`**: kolejka sesji uszeregowana po **ranku stresora** (najbardziej stresujący → pierwsze).
- **`run`**: sesje żyją wewnątrz aktywnego Runa; wynik aktualizuje progres — `dismissed` liczy jako załatwione (`progress = (completedTasks + dismissedTasks) / totalTasks`).
- **App shell (ADR 0001)**: etap renderuje się w `AppShell` (`/focus`); prowadzenie, nie menu.
