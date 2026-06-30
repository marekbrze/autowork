# Feature: Session queue order + Run task list

## Type
Feature (planned by proto-feature)

## User goal
Dwie rzeczy, które użytkownik chce widzieć na obu końcach pracy nad zadaniami:

1. **W filtrze sesji (focus)** — po ustawieniu filtru (konteksty + energia) widzieć **listę dopasowanych zadań**, które za chwilę zrobi, i móc **ręcznie ustawić ich kolejność** (jak pojawiają się w sesji). Dziś kolejność jest sztywno wyprowadzona z ranku stresora i listy nie widać.
2. **Na Szczegółach Runa (run)** — widzieć **listę wszystkich zadań z prawdziwym stanem** (zrobione / do zrobienia / nieaktualne / odłożone) i móc **działać z listy** (oznaczyć done, oflagować nieaktualne). Dziś widać tylko agregaty (kaflowie statystyk), bez samej listy.

## MVP scope
**In scope:**
- **A (focus):** lista dopasowanych zadań na ekranie filtra + ręczne przekładanie (drag / ↑↓) + trwały porządek per-Run + „reset do defaultu".
- **B (run):** sekcja „Tasks" na RunDetails — lista zadań z prawdziwym stanem + akcje z listy: oznacz done (`completed`), oflaguj nieaktualne (`dismissed`).

**Out of scope (Later):**
- Edycja tekstu / atrybutów taska oraz usuwanie taska z poziomu RunDetails.
- „Otwórz ponownie" (→ `pending`) z listy RunDetails (inverse done/dismiss).
- Akcja `Skip` z poziomu RunDetails (skip jest pojęciem sesji — patrz Related).
- Osobne kolejności per filtr (model = jeden porządek na Run).
- Prawdziwe spięcie danych per-Run (ADR 0020) — kolejność i lista dziedziczą globalny store tasków.

## Related (trasowane osobno — NIE część tego feature'u)
- **Skip czyści się przy wyjściu z sesji** — użytkownik zgłosił, że po powrocie do pracy (Continue/Resume) sesja pokazuje mu np. 3. zadanie z 3, bo dwa wcześniejsze „wiszą" jako skipnięte. To jest **bug**, nie feature: objaw utrzymuje się mimo ADR 0034 (fix z `2a0a7f7`), więc wymaga root-cause. Hipoteza: użytkownik używa **Resume**, a snapshot trzyma kursor postawiony za skipniętymi taskami (`FocusView.tsx` `resumeSession` / `resumableSnapshot`) — wczorajszy reset na starcie *nowej* sesji tego nie łapie. Dodatkowo hipoteza użytkownika („czyść skip przy wyjściu") **sama w sobie może nie naprawić** objawu, bo problemem jest kursor, nie tylko stan. → **`proto-bug [focus]`** (diagnoza + plan fixa, niezależnie od tego feature'u).

## Impact map
- **New module?**: nie — rozszerza `focus` i `run`.
- **Modules affected**:
  - `focus` — ekran filtra zyskuje listę dopasowanych + UI kolejności; nowa persystencja porządku; budowanie kolejki czyta porządek ręczny zamiast (default) ranku stresora.
  - `run` — RunDetails zyskuje sekcję listy zadań + akcje; moduł `run` po raz pierwszy **mutuje stany tasków** (cross-module: `run` → store tasków z `decompose`).
- **Cross-module integration** (ryzykowne punkty):
  1. **A — persystencja ręcznej kolejności vs globalny store + filtr.** Porządek trzyma uporządkowaną listę ID tasków; filtr maskuje podzbiór; przełożenie podfiltrem rekonfiguruje globalny porządek. Miejsce integracji: budowanie kolejki w `FocusView` (`start` / `attributed`).
  2. **B — `run` mutuje taski `decompose`.** RunDetails wywoła `updateTask` z `decompose/hooks/use-tasks.ts`. Statystyki Runa (`deriveRunStats`, `stats.ts`) muszą zareagować na żywo (już wyprowadzane z tasków — zweryfikować).
- **Shared-doc additions** (zapisuje `proto-detail`):
  - `ACTIONS.md` [+]: `Reorder queue` (drag/↑↓), `Reset queue order`, `View run task list`, `Mark task done (from details)`, `Mark task not-relevant (from details)`.
  - `ENTITY_MAP.md` [+]: wartość/relacja `TaskOrder` (manualny porządek per-Run; default = rank stresora) — relacja `Run 1—1 TaskOrder 1—* Task` (kolejność).
  - `GLOSSARY.md` [+]: `Manual queue order` (`TaskOrder`) — ręczny porządek zadań w Runie; `Run task list` — widok listy zadań na Szczegółach.

## Per-module changes

### `focus` — lista dopasowanych + ręczna kolejność
- **Data**:
  - Nowa persystencja: **`TaskOrder`** = uporządkowana lista ID tasków (`string[]`), klucz np. `focus:taskOrder` (przez `useLocalStorage`, wzorzec `focus:filter` z `FocusView.tsx:62`).
  - **Default** (brak `TaskOrder` / po resecie) = kolejność po ranku stresora, tak jak dziś (`attributed`, `FocusView.tsx:78-90`: sort po `stressorRank` + `createdAt`).
  - **Per-Run w intencji; w prototypie globalne** — dziedziczy ograniczenie ADR 0020 (dane lejka bez `runId`); przy przyszłym spięciu per-Run staje się per-Run bez zmiany modelu.
  - Taski spoza `TaskOrder` (nowo dodane) → doklejane wg defaultu (rank stresora) na końcu (→ edgecases).
- **Actions**:
  - **Reorder queue** — drag / ↑↓ na liście dopasowanych; aktualizuje `TaskOrder` (pozycje przełożonych ID; pozostałe stabilne). Honest persistence: przy awarii zapisu lokalny stan się nie psuje (wzorzec z `ProcessView` / `FocusView`).
  - **Reset queue order** — czyści `TaskOrder` → powrót do ranku stresora.
  - **Filter** i **Start** — bez zmian semantycznie; Start buduje kolejkę z dopasowanych **w porządku `TaskOrder`** (zamiast czystego ranku stresora).
- **Screens & flows**:
  - `SessionFilter` (`SessionFilter.tsx`) staje się dwuczęściowa: (1) filtry (konteksty + energia) + licznik dopasowań — jak dziś; (2) **lista dopasowanych zadań** ( tekst + plakietki atrybutów context/energy/time + uchwyt drag + ↑↓ ), widoczna gdy `matchCount > 0`. Kontrola **„Reset to default"** gdy aktywny jest porządek ręczny. Duży **Start** zostaje.
  - Wejście: bez zmian (z `process` / Continue → `/focus`). Brak nowego wpisu w nawigacji.
- **States** (→ `harden`):
  - Lista 1-elementowa — reorder zablokowany/no-op.
  - 0 dopasowań — lista ukryta, Start zablokowany (już obsłużone, `SessionFilter.tsx:84-99`).
  - Awaria zapisu `TaskOrder` — toast retry, bez cichej utraty układu.
  - Reset — potwierdzenie albo natychmiast + undo (do rozstrzygnięcia w `harden`).
- **Edge cases** (→ `edgecases`): taski dodane po nadaniu `TaskOrder` (gdzie lądują); `TaskOrder` wskazuje usunięte taski (prune); `TaskOrder` wskazuje taski spoza bieżącego filtru (ukryte, pozycje zachowane); reorder przy filtrze „wszystko"; sortowanie stabilne dla niewymienionych.
- **Design**: `SessionFilter` dostaje listę + drag handles — nowa powierzchnia na istniejącym ekranie → `lofi` (zbudować), potem `design`/`polish` (drag UX, plakietki, rytm). Szanuje `DESIGN.md` (jeśli istnieje).

### `run` — lista zadań na Szczegółach + akcje
- **Data**:
  - Bez nowej encji. RunDetails czyta wszystkie taski (`decompose:tasks`, globalne — ADR 0020) i ich `state`.
  - Akcje mutują `Task.state` przez `updateTask` (`decompose/hooks/use-tasks.ts`) — moduł `run` zaczyna pisać do store'u tasków.
- **Actions**:
  - **View run task list** — lista na RunDetails (pod kaflami statystyk).
  - **Mark task done (from details)** — `pending`/`skipped` → `completed`.
  - **Mark task not-relevant (from details)** — → `dismissed` (terminalnie; liczy do progresem, ADR 0017).
- **Screens & flows**:
  - `RunDetails` (`RunDetails.tsx`) zyskuje sekcję **„Tasks"** pomiędzy statystykami (`:134-137`) a blokiem Continue (`:139-163`). Lista zadań pogrupowana/etykietowana stanem: **To do** (`pending`/`skipped`/`active`), **Done** (`completed`), **Not relevant** (`dismissed`). Wiersz: tekst + plakietka stanu + akcje (Done / Not relevant; zablokowane gdy już w tym stanie). Statystyki (`RunStatTiles`) przeliczają się na żywo przez `useLiveRuns`/`deriveRunStats`.
  - Wejście: bez zmian (karta Runa → Szczegóły). Brak nowego wpisu w nawigacji.
- **States** (→ `harden`):
  - Pusty Run (brak tasków) — empty-state („No tasks yet — start with a brain dump").
  - Awaria odczytu/zapisu — toast retry (wzorzec `StorageStatusToast`, już w `RunDetails.tsx:192`).
  - Dismiss z listy — confirm albo undo (do rozstrzygnięcia w `harden`).
- **Edge cases** (→ `edgecases`): task bez atrybutów (nieprocesowany) — pokazać z labelką „untagged"; akcja done na już-done (no-op/disable); wpływ akcji na `lastReachedStep`/resume routing; sortowanie listy (default rank stresora / `TaskOrder`?).
- **Design**: nowa sekcja na istniejącym ekranie → `lofi`, potem `design`/`polish`.

## Routing — which proto skill builds what
| Step | Skill | Target | What it does |
|------|-------|--------|--------------|
| 1 | proto-detail | `focus` | zespecyfikować zmiany filtra + `TaskOrder` + wpisy do `ACTIONS`/`ENTITY_MAP`/`GLOSSARY` |
| 2 | proto-detail | `run` | zespecyfikować sekcję listy + akcje z listy + wpisy shared-doc |
| 3 | proto-lofi | `focus` | zbudować listę dopasowanych + UI kolejności + reset |
| 4 | proto-lofi | `run` | zbudować sekcję „Tasks" + akcje done/not-relevant |
| 5 | proto-edgecases | `focus` | nowe przypadki: `TaskOrder` vs dodane/usunięte taski, stabilność sortu |
| 6 | proto-edgecases | `run` | nowe przypadki: pusty run, taski bez atrybutów, wpływ na resume routing |
| 7 | proto-harden | `focus` | stany: 1-elementowa lista, awaria zapisu `TaskOrder`, reset (confirm/undo) |
| 8 | proto-harden | `run` | stany: empty-state, awaria storage, dismiss (confirm/undo) |
| 9 | (direct edit) | — | patrz Residual — spięcie `TaskOrder` z budowaniem kolejki + mutacje tasków z `run` |
| 10 | proto-design → polish | `focus`, `run` | hi-fi list, drag handles, plakietki, rytm (jeśli wizualne) |
| — | **proto-bug** | `focus` | **Related, osobno:** diagnoza skip-cleanup-on-exit (patrz sekcja Related) |

## Residual — direct edits not covered by a proto skill
- **[`src/modules/focus/components/FocusView.tsx:190-204` (`start`)]** — teraz: kolejka = dopasowane w kolejności `attributed` (rank stresora). zmiana: buduj kolejkę w porządku `TaskOrder` (gdy istnieje), z defaultem = obecny sort. why: ręczny porządek ma decydować o kolejności w sesji.
- **[`src/modules/focus/components/FocusView.tsx:62` okolice]** — dodaj persystencję `TaskOrder` przez `useLocalStorage<string[]>('focus:taskOrder', [])`; funkcja sortująca `orderedTaskIds(tasks, taskOrder, stressorRank)` (mapowane wg indeksu w `TaskOrder`, reszta wg ranku stresora na końcu). why: jeden model porządku współdzielony przez listę filtra i budowanie kolejki.
- **[`src/modules/focus/components/SessionFilter.tsx:141-155`]** — dodaj propsy: `matchedTasks: Task[]` (uporządkowane), `onReorder(ids: string[])`, `onResetOrder()`, `hasManualOrder: boolean`; wyrenderuj listę dopasowanych z drag/↑↓ + kontrolkę „Reset to default". why: UI kolejności na ekranie filtra.
- **[`src/modules/run/components/RunDetails.tsx:134-163`]** — wstaw sekcję „Tasks": czytaj taski (hook `useTasks` z `decompose`), grupuj po `state`, renderuj wiersze z akcjami `onDone`/`onDismiss` (`updateTask`). why: lista zadań + akcje na Szczegółach.
- **[`src/modules/run/components/RunDetails.tsx:22`]** — dodać `useTasks()` z `decompose/hooks/use-tasks.ts` (cross-module read+write). why: `run` musi czytać i mutować stany tasków.
- **Weryfikacja (nie-edycja):** `src/modules/run/stats.ts:22-42` (`deriveRunStats`) czyta `state` bezpośrednio — po akcjach done/dismiss z RunDetails statystyki przeliczają się same; potwierdzić, że `RunStatTiles` odświeża się na żywo.

## Later (deferred)
- Edycja tekstu/atrybutów oraz usuwanie taska z RunDetails.
- „Otwórz ponownie" (`→ pending`) z RunDetails.
- Osobne kolejności per filtr.
- Prawdziwe spięcie per-Run (ADR 0020) dla `TaskOrder` i listy tasków.

## Hand-off
Feature = A (`focus`) + B (`run`). Odpal w kolejności z tabeli Routing: najpierw `proto-detail focus` i `proto-detail run` (zespecyfikować zmiany + wpisy shared-doc), potem `lofi`/`edgecases`/`harden`/residual/`design`. Równolegle (osobno) odpal `proto-bug focus` dla skip-cleanup-on-exit (sekcja Related) — to niezależny bug. Ten dokument jest bazą, którą czytają kolejne skille.
