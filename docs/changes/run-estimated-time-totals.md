# Feature: Łączny czas szacunkowy zadań (Run + dashboard + filtr focus)

## Type
Feature (planned by proto-feature)

## User goal
User chce widzieć **łączny czas szacunkowy** (sumę `EstimatedTime`) zadań w Runie — żeby rzutem oka ocenić „jak duży jest ten przejazd" (np. ~2h roboty). Chce to mieć **na dashboardzie** (motywacja/zobowiązanie przed wejściem w pracę) oraz **w filtrze sesji focus** — żeby widząc „3 pasujące zadania" od razu wiedział, na jak długi blok pracy się pisze (~1h 15m), zanim kliknie Start.

## MVP scope
**MUSI działać:**
- Nowa wyprowadzana-na-żywo statystyka Runa: `estimatedTotalMin` (suma `EstimatedTime` po **wyestymowanych** taskach) oraz `estimatedRemainingMin` (suma po wyestymowanych taskach **nie-zrobionych**, tj. stan ∉ `completed`/`dismissed`). Źródło: `deriveRunStats` w `run/stats.ts` — jedno źródło prawdy, jak dziś `timeSpentSec`.
- Wspólny helper formatujący minuty → „2h 35m" / „45m" (`formatMinutes`), bez cross-module coupling (poza modułem `run`).
- **Wyświetlenie TOTAL** na 3 powierzchniach:
  1. **Dashboard — dominująca karta** (`DominantRunCard`): w linijce rozbicia progresu dodany segment „~2h estimated".
  2. **Szczegóły Runa** (`RunStatTiles`): nowy 4. kafel „estimated" (total) + sub-linia „~45m left" (remaining).
  3. **Filtr focus** (`SessionFilter`): w polu dopasowań rozszerzenie „3 tasks match" → „3 tasks · ~1h 15m".
- Obsługa stanu pustego/braku szacunków: gdy w Runie/filtrze nie ma żadnego `EstimatedTime`, NIE pokazuj mylącego „0m" — pomiń segment lub „—" (→ `proto-harden`).

**Odłożone do „Later":**
- Prominentna „remaining" na dominującej karcie (MVP pokazuje remaining tylko jako sub-linię na Szczegółach).
- Łączny szacunek na **mini-kartach** Runa (`RunCard`) i liście **archiwum**.
- Ramowanie „szacunek vs realny czas" (np. „~2h estimated · 1h 30m in focus" jako motywator; nad-/wykonanie).

## Impact map
- **New module?**: nie — rozszerza 3 istniejące (`run`, `dashboard`, `focus`).
- **Modules affected**:
  - `run` — **właściciel agregatu**: nowe pola `RunStats` + funkcja w `stats.ts` + nowy kafel w `RunStatTiles`. Tu leży kontrakt.
  - `dashboard` — konsument: segment łącznego szacunku w `DominantRunCard`.
  - `focus` — konsument: licznik czasu dopasowanych zadań w `SessionFilter` (+ plumbing w `FocusView`).
- **Cross-module integration**: **niskiego ryzyka**. To nowa wartość wyprowadzana z istniejącego pola `Task.estimatedTime` (już istnieje, preset min, nullable) przez istniejący `deriveRunStats`. `useLiveRuns` już today rozkłada `stats` na każdą kartę Runa i Szczegóły → nowe pola popłyną automatycznie. Focus liczy swój subset lokalnie (już ma `matchedTasks`). **Brak nowej relacji między encjami** — tylko nowy agregat.
- **Shared-doc additions**:
  - `ENTITY_MAP.md`: do atrybutów/statystyk `Run` dopisać `estimatedTotalMin` / `estimatedRemainingMin` (wyprowadzane na żywo z `Task.estimatedTime`).
  - `GLOSSARY.md`: nowy termin „Łączny czas szacunkowy" → `EstimatedTotal` (suma oszacowań wyestymowanych tasków; live) i „Pozostały czas szacunkowy" → `EstimatedRemaining`. Unikać „czas spędzony" (= `timeSpent`).
  - `ACTIONS.md`: **bez zmian** — to pasywny odczyt/wyświetlenie, nie nowa akcja usera.

## Per-module changes

### run (właściciel agregatu)
- **Data**:
  - `RunStats` (`src/modules/run/types/run.ts:23-32`) +2 pola: `estimatedTotalMin: number`, `estimatedRemainingMin: number` (minuty).
  - `deriveRunStats` (`src/modules/run/stats.ts:22-42`) liczy oba: sumuje `t.estimatedTime` (gdy `!= null`); remaining pomija `completed`/`dismissed`. `skipped`/`pending`/`active` liczą się do remaining (jeszcze do zrobienia).
  - Nowy helper `formatMinutes(totalMinutes)` → „2h 35m" / „45m" / „0m". **Lokalizacja do rozstrzygnięcia w `proto-detail`**: rekomendacja = `src/shared/format.ts` (nowy plik shared), żeby `focus`/`dashboard` użyły go bez importu z wnętrza `run` (utrzymać kierunek zależności: lejek nie zależy od modułu `run`). Alternatywa: re-use `formatDuration(min*60)` z `run/types/run.ts`, ale wymaga importu z `run` i daje sufiks „s" dla <1min (dla presetów 5+ nieistotne, mniej czyste).
- **Actions**: brak (pasívny display).
- **Screens & flows**: `RunStatTiles` (`src/modules/run/components/RunStatTiles.tsx:18`) — grid `grid-cols-3` → `grid-cols-4` (lub 2×2), nowy kafel „estimated" = `formatMinutes(estimatedTotalMin)`; pod siatką sub-linia „~X left estimated" = `estimatedRemainingMin`.
- **States**:
  - **Brak szacunków** (`estimatedTotalMin === 0`): kafel pokazuje „—" / „no estimate" zamiast „0m"; sub-linia remaining pominięta.
  - **Run bez tasków** (`totalTasks === 0`): jak dziś (kafelEstimated też „—"; dominująca karta już ma „No tasks yet").
- **Edge cases** (→ `proto-edgecases`/`harden`):
  - **Mieszane** (część tasków wyestymowana, część bez atrybutów): total obejmuje tylko wyestymowane — sformułowanie musi sugerować subset („~2h estimated" implikuje „z tych, co mają szacunek").
  - **0 wyestymowanych, ale >0 tasków** (wszystko nieprocesowane): „—"/„no estimate" — nie mylić z pustym Runem.
  - **Pozostały = 0** (wszystko done/dismissed): sub-linia „~0m left" → raczej ukryć (run i tak ukończony/celebracyjny).
- **Design**: nowy kafel w `RunStatTiles` + segment w dominującej karcie. `DESIGN.md` istnieje (ADR 0041/0051 — powierzchnie hi-fi) → lekki dotyk `proto-design`/`proto-polish`, utrzymać tabular-nums i styl istniejących kafli.

### dashboard (konsument)
- **Data**: czyta `run.stats.estimatedTotalMin` (już rozdane przez `useLiveRuns`).
- **Screens & flows**: `DominantRunCard` (`src/modules/dashboard/components/DominantRunCard.tsx:87-93`) — do linijki „X of Y done · N left · {time} in focus" dodać segment „· ~2h estimated". Gdy `estimatedTotalMin === 0` → segment pominięty (linijka jak dziś).
- **Edge cases**: 0 szacunków → pomiń segment (nie psuć istniejącej linijki). Mini-karty (`RunCard`) i archiwum = **Later**.
- **Design**: jeden segment tekstowy na już hi-fi karcie → `proto-polish` (spójność tonu/składni).

### focus (konsument)
- **Data**: lokalna suma w `FocusView` — `matchedTasks.reduce((s,t) => s + (t.estimatedTime ?? 0), 0)`. `matchedTasks` mają **zawsze** `estimatedTime` (filtr `attributed` go wymaga, `FocusView.tsx:94-106`), więc brak null-edge.
- **Screens & flows**: `SessionFilter` (`src/modules/focus/components/SessionFilter.tsx:13-31, 153-163`) — nowy prop `matchedEstimateMin: number`; pole dopasowań „{n} tasks match" → „{n} tasks · ~1h 15m". `FocusView` (`FocusView.tsx:147`, przekazanie propsu ~`:451`) liczy memo i podaje.
- **States**: `matchCount === 0` → pole już pokazuje „No tasks match" (bez czasu). `matchCount > 0` ⇒ estimate > 0 zawsze.
- **Edge cases**: brak nowych (subset zawsze wyestymowany). `Nothing left / All done` (resolvedAttributed) → osobny empty-state bez czasu.
- **Design**: rozszerzenie istniejącego pola `bg-muted/30` → `proto-polish`.

## Routing — which proto skill builds what
| Step | Skill | Target | What it does |
|------|-------|--------|--------------|
| 1 | `proto-detail run` | run | Zespecyfikować nowe pola `RunStats`, lokalizację `formatMinutes`, semantykę total/remaining + stan „brak szacunków"; dopisać wpisy `ENTITY_MAP.md` / `GLOSSARY.md`. Notka, że `dashboard`/`focus` konsumują. |
| 2 | (direct edit — residual) | run / dashboard / focus | Zbudować 3 wyświetlenia + agregat + helper (lista poniżej). |
| 3 | `proto-edgecases run` | run | Zdiagnozować display-edge (mieszane / 0 wyestymowanych / remaining=0) po powstaniu kafli. |
| 4 | `proto-harden run` | run | Wdrożyć stany „—"/pominięcie segmentu przy braku szacunków. |
| 5 | `proto-design run` → `proto-polish run` (+ dashboard/focus) | run / dashboard / focus | Utrzymać hi-fi nowej powierzchni (`DESIGN.md`). Opcjonalnie jeśli residual zostawia luz. |

**Sekwencja:** `proto-detail run` → residual (build) → `proto-edgecases run` → `proto-harden run` → `proto-design`/`proto-polish`.

## Residual — direct edits not covered by a proto skill
- **[`src/modules/run/types/run.ts:23-32`]** — now: `RunStats { timeSpentSec, doneCount, dismissedCount, totalTasks }`. change to: dodaj `estimatedTotalMin: number` i `estimatedRemainingMin: number` (minuty). why: kontrakt agregatu.
- **[`src/modules/run/stats.ts:22-42`]** — now: pętla liczy `doneCount`/`dismissedCount`/`timeSpentSec`. change to: w tej samej pętli akumuluj `estimatedTotalMin += t.estimatedTime` (gdy `!= null`) oraz `estimatedRemainingMin` (gdy stan ∉ `completed`/`dismissed`); zwróć w obiekcie. why: jedno źródło, flows przez `useLiveRuns`.
- **[`src/modules/shared/format.ts` (nowy)]** / lub `src/lib/utils.ts` — now: brak. change to: dodaj `formatMinutes(totalMinutes): string` („2h 35m"/„45m"/„0m"). why: shared helper, unika focus→run coupling. (Ostateczna lokalizacja do rozstrzygnięcia w detail.)
- **[`src/modules/run/components/RunStatTiles.tsx:18-56`]** — now: grid `grid-cols-3` (in focus / done / progress). change to: `grid-cols-4` (lub 2×2) + kafel „estimated" = `formatMinutes(stats.estimatedTotalMin)`; sub-linia „~{formatMinutes(estimatedRemainingMin)} left estimated" (gdy >0). Gdy `estimatedTotalMin === 0` → kafel „—". why: dom statystyk Runa.
- **[`src/modules/dashboard/components/DominantRunCard.tsx:87-93`]** — now: „{done} of {total} done · {remaining} left · {time} in focus". change to: doklej „· ~{formatMinutes(stats.estimatedTotalMin)} estimated" (gdy `> 0`). why: runway-motywator (cel usera).
- **[`src/modules/focus/components/FocusView.tsx:147` i `~451`]** — now: `matchCount = matchedTasks.length`; przekazuje `matchCount` do `<SessionFilter>`. change to: dodaj `const matchedEstimateMin = useMemo(() => matchedTasks.reduce((s,t)=>s+(t.estimatedTime??0),0), [matchedTasks])`; przekaż `matchedEstimateMin`. why: subset zawsze wyestymowany.
- **[`src/modules/focus/components/SessionFilter.tsx:13-31, 153-163`]** — now: prop `matchCount`; pole „{n} tasks match the filter". change to: dodaj prop `matchedEstimateMin`; „{n} tasks · ~{formatMinutes(matchedEstimateMin)}". why: decyzja o długości sesji przed Start.

## Later (deferred)
- „Remaining estimate" prominentnie na dominującej karcie (MVP: tylko sub-linia na Szczegółach).
- Łączny szacunek na **mini-kartach** `RunCard` i liście **archiwum** (`ArchivedRuns`).
- Ramowanie szacunek-vs-realny (nad-/wykonanie, motywator po sesji) — ew. też w `SessionSummary`.

## Hand-off
Odpal w kolejności: **`proto-detail run`** (zespecyfikować pola `RunStats` + `formatMinutes` + semantykę total/remaining + wpisy shared-doc) → **residual direct-edits** (zbudować agregat + 3 wyświetlenia) → **`proto-edgecases run`** → **`proto-harden run`** (stany braku szacunków) → opcjonalnie **`proto-design`/`proto-polish`**. Plan jest bazą, którą czytają te skille.
