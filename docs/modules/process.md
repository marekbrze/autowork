# Process

## Vision
Moment lejka, w którym surowe taski z `decompose` dostają to, co dopiero umożliwia sesję `focus`: `Context`, `Energy`, `EstimatedTime`. Wzorzec **1:1 z `marekbrze/dopadone` (`ProcessingView`)** — nie „jeden task na ekranie z formularzem", lecz **płaska kolejka mikrokroków, jeden brakujący atrybut na raz**, prowadzona klawiaturą. Cel: zero friction — ta sama pamięć mięśniowa co brain-dump w `capture` (highlight → Enter), prowadzenie, nie zmuszanie (ADR 0007).

Trzy ekrany (maszyna stanów): **`summary`** (stat-cards „do przetworzenia" + „Rozpocznij") → **`processing`** (spacer po krokach) → **`done`** (celebracja). Option-card grid z badge'ami klawiszy, **pending → confirm (Enter)**, **skip (Esc)**, nawigacja **pród / tył / skok** — dokładnie jak w `dopadone`.

Kroki `dopadone` (`area`/`project`/`energy`/`context`/`date`) → u nas **3: Context → Energy → EstimatedTime** (brak area/project — nie ma ich w domenie). Świadome odejścia od referencji: **brak timera** w `process` (tożsamość timera należy do `focus`), **brak mark-done** (done dzieje się w `focus`) i **brak convert-to-project** (brak projektów). Decyzje: ADR 0012, ADR 0013.

## User Flows

### Wejście: podsumowanie → start
1. User wchodzi w `process` (z `decompose` przez „Dalej" / stepper, ADR 0001) → ekran **podsumowania**.
2. Widzi **stat-cards** „do przetworzenia": ile tasków **bez kontekstu** / **bez energii** / **bez czasu** (na żywo z danych; karta wygaszona gdy 0).
3. **„Rozpocznij [↵]"** → `buildSession()` buduje kolejkę kroków → ekran processing.
   - Jeśli nic do roboty (wszystko opisane / brak tasków) → **„Wszystko gotowe, brak zadań do przetworzenia."** + „Dalej" prosto do `focus`.

### Processing: spacer po mikrokrokach (rdzeń)
`buildSession`: dla każdego taska (w kolejności z `decompose`: najbardziej stresujący stresor najpierw → jego next-actiony → taski) emituje po **jednym kroku na brakujący atrybut**, w stałej kolejności **Context → Energy → EstimatedTime**. Task z wszystkimi 3 atrybutami nie trafia do sesji.

Per krok:
1. **Sidebar** (lewo): taski sesji + progress (`zrobione / wszystkie`) + tagi per-atrybut (✓ gdy nadany); bieżący podświetlony; klik = skok do pierwszego kroku taska.
2. **Main** (prawo): **step breadcrumbs** danego taska (Context · Energy · Czas; bieżący aktywny, nadane z ✓; pre-fill, jeśli już ustawione) + **nazwa taska** + breadcrumb kontekstu (stresor / next-action) + **option-card grid** na bieżący atrybut.
3. Interakcja (klawiatura-first): highlight (hover / naciśnięcie klawisza opcji / ↑↓) → **Enter = commit**; **Esc = skip** (zostaw null); **← = wstecz**.
4. Po commit / skip → **advance** do następnego kroku (kolejny atrybut tego taska → pierwszy atrybut następnego taska → ekran done).

Atrybuty jako option-cards:
- **Context** — 6 kart (Telefon / Wiadomość / Kreatywne / Errands / Dom / Miasto), klucze 1–6.
- **Energy** — 3 karty z **bateryjkami** (Low = 1 / Med = 2 / High = 3), klucze 1–3.
- **EstimatedTime** — 5 kart (5 / 15 / 30 / 45 / 60 min), klucze 1–5.

### Nawigacja przód / tył (kluczowa — jak w `dopadone`)
- **Pród (advance)**: po commit lub skip → `idx+1`; na końcu kolejki → ekran done. Pre-fill następnego kroku z obecnej wartości taska.
- **Tył (goBack)**: ← lub przycisk **„← Wstecz"** (ukryty przy pierwszym kroku) → `idx-1`; pre-fill obecną wartością.
- **Skok (jump)**: klik w sidebarze → pierwszy krok wybranego taska; dotychczasowy postęp (✓) zachowany.
- **Usuń**: task usunięty → skok do pierwszego kroku następnego taska (lub done).
- **Edytuj**: inline-edit nazwy taska — nie przesuwa wskaźnika kroku.

### Wyjście: done (`process` → `focus`)
1. Po ostatnim kroku → ekran **done**: „Przetworzono N zadań" (celebracja, jak `SessionSummary` w `focus`).
2. **„Dalej"** → `focus` (wybór sesji / `SessionFilter` — następny krok lejka).

## Screens (rough)
- **Ekran podsumowania**: tytuł „Do przetworzenia" + 3 stat-cards (bez kontekstu / bez energii / bez czasu, wygaszone gdy 0) + duży **„Rozpocznij [↵]"**. Empty state: „Wszystko gotowe" + „Dalej" do `focus`.
- **Ekran processing** (dwukolumnowy): **Sidebar** („Zadania w sesji" + `n/total` + pasek postępu + lista tasków: numer, nazwa, tagi atrybutów, ✓ gdy nadany) | **Main** (step breadcrumbs + nazwa taska + breadcrumb stresor/next-action + option-card grid na bieżący atrybut z hintem „Wybierz klawiszem lub klikiem, potwierdź ↵ · pomiń Esc" + **„← Wstecz"** na dole).
- **Ekran done**: ✓ + „Przetworzono N zadań" + **„Dalej"** → `focus`.

## Actions

| Action | Description | Entity | Notes |
|--------|-------------|--------|-------|
| Assign Context / Energy / EstimatedTime | Nadaj taskowi atrybut (jeden Context, Energy 1–3, preset czasu) w kroku processingu. | Task | Option-card + klawisz + Enter; jeden krok na brakujący atrybut (ADR 0012). |
| Skip attribute | Pomiń dany atrybut (Esc) — zostaw null. | Task | Nudge, nie bramka (ADR 0007); task bez atrybutu nie wpada do sesji tego wymagających (ADR 0013). |
| Edit Task | Popraw tekst taska na miejscu. | Task | Inline w processing (ACTIONS.md: scope process). |
| Delete Task | Usuń task → skok do następnego. | Task | |
| Start session („Rozpocznij") | Zbuduj kolejkę kroków i wejdź w processing. | — | [↵] na podsumowaniu. |
| Back / Jump | ← wstecz o krok; klik w sidebarze = skok do taska. | — | Nawigacja 1:1 jak `dopadone`. |
| Proceed („Dalej") | Po done → `focus`. | — | Stepper Runu (ADR 0001). |

## Edge Cases
- **Nic do przetworzenia** (wszystkie taski opisane / brak tasków): empty state „Wszystko gotowe" + „Dalej" prosto do `focus`.
- **Task z wszystkimi 3 atrybutami**: nie trafia do sesji (`buildSession` pomija).
- **Pominięty atrybut (skip)**: atrybut zostaje null → task nie pojawi się w sesjach filtrowanych po tym atrybutze (Context/Energy); bez czasu → `focus` bez zadanego czasu (default timera). Świadomy wybór usera, nie błąd (ADR 0013).
- **Cofnięcie (Wstecz) do już nadanego kroku**: pre-fill obecną wartością — można zmienić lub zostawić.
- **Skok do taska w środku sesji**: klik w sidebarze → jego pierwszy brakujący krok; postęp pozostałych (✓) zachowany.
- **Usuwanie taska mid-session**: potwierdzenie `ConfirmDialog` (spójnie z `decompose`); po usunięciu skok do następnego, opróżnienie sesji → summary (nie done z zerem).
- **Edycja nazwy do pustego**: pusty draft anuluje edycję (zostawia oryginał) — nie usuwa po cichu (jak `decompose`).
- **Bardzo długa nazwa taska**: truncacja w sidebarze; w main `line-clamp-2` + tooltip (decyzja designu); nagłówek stresora i breadcrumb skrócone (`truncate` + tooltip).
- **Długa sesja (wiele tasków/atr)**: jeden krok na ekran — nie cała lista; sidebar daje orientację (lista z `max-h` + scroll, bieżący task auto-scrollowany w widok).
- **Cofnięcie z pierwszego kroku**: „← Wstecz" zawsze widoczne; z `idx 0` → ekran podsumowania (brak dead-endu).
- **Klawiatura a focus**: globalny handler nie przechwytuje klawiszy przy fokosie na przycisku/karcie/linku — Enter działa natywną aktywacją (bez double-fire).
- **Błąd zapisu/odczytu LocalStorage**: toast + retry przy nieudanym zapisie; `commit`/`edit`/`delete` ruszają dalej **tylko po udanym zapisie** (honest persistence — UI zawsze odzwierciedla zapisany stan), a po udanym `retry` efekt dokańcza commit. Toast agreguje status trzech storów (tasks/stressors/nextActions).
- **Powrót do `process` po `focus`**: `buildSession` na nowo liczy brakujące atrybuty; zmiana atrybutu tutaj nadpisuje (Edit Task w scope process). *(Pozycja w sesji — `screen`/`cursorIndex` — jest efemeryczna; refresh wraca do summary. Praca nie ginie.)*

## Integration Points
- **`decompose`**: wejście — pobiera taski (z przynależnością stresor/next-action), w kolejności rankingu stresu.
- **`focus`**: wyjście — przekazuje taski opisane atrybutami (Context / Energy / EstimatedTime) do `SessionFilter`. **`EstimatedTime` = źródło wartości timera** w sesji.
- **`capture` / `decompose` (motywacja)**: brak bezpośredniego przepływu; `process` jest czysto atrybutowy.
- **`run`**: żyje wewnątrz aktywnego Runa; stepper postępu (ADR 0001) prowadzi przez kroki lejka.
- **App shell (ADR 0001)**: etap renderuje się w `AppShell` (`/process`); brak wolnych linków nawigacji — prowadzenie, nie menu.
- **Wzorzec zewnętrzny**: `marekbrze/dopadone` `src/components/ProcessingView.tsx` — referencja logiki wyświetlania i nawigacji (ADR 0012).
