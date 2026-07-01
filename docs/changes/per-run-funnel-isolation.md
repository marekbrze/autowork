# Feature: Per-Run funnel isolation (each Run owns its own stressors/tasks)

## Type
Feature (planned by proto-feature)

## User goal
Każdy Run ma być **osobnym zestawem stresorów i zadań** — tworząc nowy Run, user zaczyna od pustego brain dumpa, a nie widzi danych poprzedniego Runa. Switchowanie między Runami (przez Continue) pokazuje właściwy zestaw. *(Zgłoszone jako błąd w `docs/changes/runs-share-funnel-data.md`; zdiagnozowane jako odrooczona architektura — ADR 0020.)*

## MVP scope
**MUST** (pełna izolacja lejka, potwierdzona z userem):
- Każdy Run ma własne: stresory, next-actiony, zadania, powody, done-visions, sesję focus + task-order.
- „Aktywny Run" — którego lejka widać w capture/decompose/process/focus — ustawiany przez **Create Run** i **Continue** (przez dashboard, bez nowego UI).
- Nowy Run = pusty lejek (rozwiązuje zgłoszony błąd bezpośrednio).
- Per-Run statystyki (każda karta Runa pokazuje tylko swój progres).
- Kaskadowe usuwanie (`deleteRun` czyści dane lejka tego Runa).
- Migracja istniejących globalnych danych → zseedowane do najnowszego Runa (jeśli brak — tworzony jeden „first run").

**DEFERRED → Later**:
- Switcher Runa w nagłówku/shellu (user wybrał model dashboard-driven).
- Porównanie Runów (już poza MVP, ADR 0027).
- Eksport/sharing Runa.

## Impact map
- **New module?**: **nie** — rozszerza `run` (pojemnik + cykl życia) i re-scope'uje warstwę danych modułów lejka. Aktywny-Run żyje w `run` (lub shared).
- **Modules affected**: **wszystkie 6** — `run` (aktywny Run, per-Run statystyki, kaskadowy delete, chip w nagłówku), `capture` (stresory per-Run), `decompose` (tasks/nextActions/reasons/doneVisions per-Run), `process` (czyta tasks — dziedziczy), `focus` (filter/session/taskOrder per-Run), `dashboard` (Create/Continue ustawia aktywny Run; dominująca karta z realnymi per-Run danymi).
- **Cross-module integration** (ryzyko #1): dotychczas moduły lejka miały **zero sprzężenia** z `run` (grep `@/modules/run` w capture/decompose/process/focus → 0 hitów). Ten feature **odwraca to** — lejek musi wiedzieć, który Run jest aktywny (przez kontekst). To największe ryzyko planu: każdy czytnik danych lejka musi dostać per-Run wartości, inaczej izolacja nie zadziała.
- **Shared-doc additions**: `ACTIONS.md` (Create/Continue teraz też „set active Run"), `ENTITY_MAP.md` (relacja `Run ||--o{ Stressor/Task` staje się realna; dotted „hosts" → solid; `TaskOrder` „globalny" → „per-Run"; nowy value `activeRunId`), `GLOSSARY.md` (termin **Active Run**).

## Per-module changes

### run (główny)
- **Data**: nowy globalny wskaźnik `activeRunId` (`run:active` w localStorage). `deleteRun` (`use-runs.ts:77`) dostaje kaskadowe usuwanie danych lejka tego Runa.
- **Actions**: **Create Run** i **Continue** dodatkowo **set active Run** (dziś tego nie robią: `DashboardView.tsx:53-56` tworzy+navigate, `:59` tylko navigate). Nie ma nowej akcji usera — switch jest implikowany przez Create/Continue.
- **Screens & flows**: chip aktywnego Runa w nagłówku (`AppShell.tsx:41` — slot już zarezerwowany, dziś nieprzypięty) podpięty do realnego stanu. Reszta ekranów Runa bez zmian strukturalnych.
- **States**: brak aktywnego Runa (świeża apka / aktywny usunięto) — guard na ekranach lejka; toast migracji przy pierwszym ładowaniu po upgrade.
- **Edge cases**: aktywny Run usunięty/zarchiwizowany w trakcie pracy w lejku; wybór dominującej karty (ADR 0028 `lastActiveAt`) z realnymi per-Run danymi; migruj gdy zero Runów istnieje.
- **Design**: chip aktywnego Runa — nowa mała powierzchnia w istniejącym shellu; respektuje `DESIGN.md`.

### capture
- **Data**: `Stressor` dostaje `runId` (`src/modules/capture/types/stressor.ts`). `useStressors` (`use-stressors.ts:8,16`) scope'uje po `activeRunId`.
- **Actions**: bez zmian akcji; mutacje (add/update/delete/reorder) działają w obrębie aktywnego Runa.
- **Edge cases**: niezapisany tekst brain dumpa przy switchu Runa (utrata?).

### decompose
- **Data**: `runId` na `NextAction` (`next-action.ts`), `Task` (`task.ts:31`), `Reason` (`reason.ts`); `DoneVision` namespacowane per-Run. `useTasks`/`useNextActions`/`useReasons`/`useDoneVisions` (`use-tasks.ts:9,26`, `use-next-actions.ts:8`, `use-reasons.ts:9`, `use-done-visions.ts:13`) scope'owane po `activeRunId`; `bareTask` (`use-tasks.ts:11`) stempluje `runId`.
- **Edge cases**: reasons/doneVisions izolowane poprawnie (klucze po stressorId są globalnie unikalne, ale hook musi zwracać tylko wpisy aktywnego Runa).

### process
- **Data**: czyta tasks z `decompose` — dziedziczy per-Run izolację bez własnych zmian store'a. Weryfikacja, że `ProcessView` czyta przez scope'owany hook.

### focus
- **Data**: `focus:filter`, `focus:session` (`SessionSnapshot = {queue, cursor}`, `focus/types/focus.ts`), `focus:taskOrder` (`FocusView.tsx:62,72,77`) stają się per-Run (aktywny Run). Zapauzowana sesja należy do swojego Runa; resume Continue czyta właściwy snapshot.
- **Edge cases**: zapauzowana sesja Runa A przy switche do Runa B i z powrotem — musi wznowić właściwą.

### dashboard
- **Data**: dominująca karta + „Other active" pokazują realne per-Run statystyki (dziś jedna globalna wartość mapowana na wszystkie — `use-live-runs.ts:35,49-52`).
- **Actions**: Create/Continue ustawiają aktywny Run przed navigate.
- **Edge cases**: dominujący wybór (ADR 0028) przy wielu Runach z realnymi danymi.

## Routing — which proto skill builds what
| Step | Skill | Target | What it does |
|------|-------|--------|--------------|
| 0 | **(direct edit — residual)** | warstwa danych, cross-module | fundament: `runId` na encjach, re-scope hooków, store `run:active` + kontekst, per-Run statystyki, kaskadowy delete, migracja. **Inwersja typowej kolejności** — ten feature jest data-layer-led, nie screen-led; wszystko zależy od tego fundamentu. |
| 1 | proto-detail | `run` (+ lekko capture/decompose/focus) | zespecyfikować koncept Active Run, per-Run ownership, kaskadowy delete; wpisać do `ACTIONS`/`ENTITY_MAP`/`GLOSSARY`; odświeżyć notki „dane globalne" w specach modułów. |
| 2 | proto-lofi | `run` (cross-module aware) | podpiąć chip aktywnego Runa w nagłówku do realnego stanu; zapewić by Create/Continue ustawiały aktywny Run (części widoczne). |
| 3 | proto-edgecases | `run` (+ capture/decompose/focus) | zdiagnozować nowe stany: switch mid-funnel, sesja przez switchami, migracja, sieroty po delete, dominująca karta, guard braku aktywnego Runa. |
| 4 | proto-harden | `run` | wdrożyć stany z edgecases (guard no-active-run, toast migracji, redirect po usunięciu aktywnego). |
| 5 | proto-design → polish | `run` | hi-fi chipa aktywnego Runa (nowa mała powierzchnia w shellu). |

## Residual — direct edits not covered by a proto skill
Fundament warstwy danych (krok 0) — żadne proto-skill tego nie obejmuje; to czysta logika/data plumbing:

- **[typy encji]** dodaj `runId: string` do: `Stressor` (`src/modules/capture/types/stressor.ts`), `NextAction` (`src/modules/decompose/types/next-action.ts`), `Task` (`src/modules/decompose/types/task.ts:31`), `Reason` (`src/modules/decompose/types/reason.ts`). **Dlaczego**: brak `runId` to root cause błędu (`runs-share-funnel-data.md`); encje muszą wiedzieć, do kogo należą.
- **[active-run store + hook]** nowy klucz `run:active` (`activeRunId | null`) + `useActiveRun()` (`src/modules/run/hooks/`) + `ActiveRunProvider` w root (`src/App.tsx`). **Dlaczego**: dziś nie istnieje pojęcie aktywnego Runa (grep → 0 hitów); lejek musi wiedzieć, którym Runem pracuje. Routing lejka (`App.tsx`) nie ma `runId` w URL → aktywny Run musi być w stanie.
- **[re-scope hooków lejka]** `useStressors` (`use-stressors.ts:8,16`), `useTasks` (`use-tasks.ts:9,26,11`), `useNextActions` (`use-next-actions.ts:8`), `useReasons` (`use-reasons.ts:9`), `useDoneVisions` (`use-done-visions.ts:13`) — czytają `activeRunId` i zwracają/mutują tylko slice aktywnego Runa. **Decyzja projektowa (moja)**: **Design B** — `runId` na encjach + filtrowanie in-memory po `activeRunId` wewnątrz hooka (konsumenci nie zmieniają call-site'ów). **Dlaczego B nie A (key-per-run)**: `useLocalStorage` czyta key raz przy mount (`use-local-storage.ts:24-34`, `initRef`) — dynamiczny key przy switchu wymagałby rozbudowy hooka/remountu; Design B jest reaktywny bez zmian storage. Trade-off: globalne tablice trzymają wszystkie Runy (localStorage rośnie), delete filtruje — akceptowalne dla prototypu. Design A (key-per-run, twardsza izolacja, trywialny delete) jest alternatywą, jeśli zespół woli.
- **[focus per-Run]** `focus:filter` / `focus:session` / `focus:taskOrder` (`FocusView.tsx:62,72,77`) scope'owane po aktywnym Runu. **Dlaczego**: zapauzowana sesja i ręczny porządek należą do jednego Runa (`TaskOrder` „w intencji per-Run", ADR 0036/`ENTITY_MAP.md:49`); dziś globalne.
- **[Create/Continue ustawia aktywne]** `handleStartNew` (`DashboardView.tsx:53-56`) → `setActiveRun(run.id)` przed navigate; `continueRun` (`:59`) oraz Continue w `RunCard`/`RunDetails` → `setActiveRun(run.id)` przed navigate. **Dlaczego**: to jedyny sposób wejścia w lejek konkretnego Runa (model dashboard-driven, potwierdzone z userem).
- **[per-Run statystyki]** `useLiveRuns` (`use-live-runs.ts:35,49-52`) — zamiast mapować jedną globalną `stats`/`lastReachedStep` na wszystkie Runy, grupuj tasks po `runId` i wyprowadzaj per-Run (`deriveRunStats` z tasks tego Runa). **Dlaczego**: dziś każda karta pokazuje identyczny progres (skutek uboczny fixu ADR 0033).
- **[kaskadowy delete]** `deleteRun` (`use-runs.ts:77`) — po usunięciu Runa usuń jego stressory/tasks/nextActions/reasons/doneVisions/focus-data (w Design B: filtruj globalne tablice; usuń focus keys tego Runa). **Dlaczego**: inaczej dane sierocieają i zanieczyszczają localStorage.
- **[migracja]** przy pierwszym ładowaniu po upgrade — jeśli istnieją stare globalne klucze bez `runId`, zseeduj je do najnowszego istniejącego Runa (lub utwórz jeden „first run" i ustaw aktywny). Prod jest zablokowany na scenario 'empty' (`loader.ts:31`), więc migracja dotyczy głównie dev/lokalnego localStorage — ale logika musi istnieć. **Dlaczego**: user (odpowiedź 3) chce zachować obecne dane, nie start od zera.
- **[scenariusze]** `src/scenarios/data/{capture,decompose,run}.ts` + `scenarios/{minimal,full,focus}.ts` — attachuj `runId` (scenariusz tworzy Run + ustawia aktywny), by mock-data pasowało do nowego modelu.

## Later (deferred)
- Switcher aktywnego Runa w shellu (dropdown w nagłówku) — user wybrał model dashboard-driven.
- Porównanie Runów (ADR 0027, już poza MVP).
- Eksport/sharing Runa.

## Hand-off
**Krok 0 (residual — warstwa danych) idzie pierwszy** — to fundament, od którego zależy cała reszta; ten feature jest data-layer-led. Po nim: `proto-detail run` (zespecyfikować koncept + shared-doc), potem `proto-lofi run` (chip + Continue/Create wiring), `proto-edgecases run`, `proto-harden run`, `proto-design/polish run`. Decyzja techniczna (moja): Design B (`runId` na encjach + filtrowanie), bo współpracuje z istniejącym `useLocalStorage` bez zmian. Dokument jest bazą, którą czytają kolejne skille.
