# Feature: Klikalny stepper lejka (nawigacja wewnątrz Runa) + akcje nad listą na Szczegółach Runa

## Type
Feature (planned by proto-feature)

## User goal
1. **Nawigacja wewnątrz Runa przez breadcrumbs (klikalny stepper).** Dziś kroki lejka (Stresory › Ranking › Akcje › Procesowanie › Focus) są już renderowane na ekranach lejka (`FunnelStepper`), ale **tylko poglądowo** — nie da się nimi klikać; ruch tylko przez przyciski „Dalej"/„Wstecz". User chce, żeby te już-wyświetlane kroki były **po prostu klikalne** — skok do dowolnego kroku aktywnego Runa.
2. **Akcje nad listą na Szczegółach Runa.** Dziś na `/run/:runId` kolejność to: statystyki → lista tasków (najdłuższa) → Continue → Review/Archive/Delete na samym dole. User musi mocno scrollować, by dotrzeć do akcji. Wszystkie akcje mają lądować **nad listą tasków**.

## MVP scope
**MUST** (potwierdzone z userem):
- **Część 1 — klikalny stepper**: wszystkie 5 etapów `FunnelStepper` staje się klikalną nawigacją (Link → trasa kroku aktywnego Runa). Brak blokowania/lockowania przyszłych kroków — user powiedział wprost „mają być po prostu klikalne". Call-site'y 5 ekranów lejka **bez zmian** (renderują `<FunnelStepper current=... />`).
- **Część 2 — akcje nad listą**: blok Continue (lub `RunCompleted`) oraz blok zarządzania (Review / Archive|Unarchive / Delete) przeniesione **nad** sekcję „Tasks" na `RunDetails`. Lista tasków schodzi na dół.

**DEFERRED → Later**:
- Lockowanie przyszłych (nieosiągniętych) kroków stepperem (MVP = wszystkie klikalne; jeśli testy pokażą „decision paralysis" u persony ADHD — przywrócić jako opcję harden).
- Klikalne kroki / stepper **na stronie Szczegółów Runa** (dziś Continue robi smart-routing; step-links na details = wygoda, nie MVP).
- „Sticky" pasek akcji na Szczegółach (zawsze widoczny bez scrolla) — rozważyć w design/polish, nie MVP.
- Stepper w nagłówku/shellu globalnie (dziś per-ekran; pozostaje).

## Impact map
- **New module?**: **nie** — rozszerza `run` (właściciel modelu kroków lejka: `STEP_ROUTE`/`STEP_LABEL`/resume, `RunDetails`) oraz **shared** komponent `FunnelStepper` (renderowany na wszystkich ekranach Core lejka).
- **Modules affected**: **`run`** ( obie części — model kroków + `RunDetails` IA), **shared `FunnelStepper`** (część 1). Ekrany Core (`capture`/`decompose`/`process`/`focus`) **nie zmieniają się** — tylko konsumują klikalny stepper.
- **Cross-module integration**: ryzyko #1 to **skok do kroku z niespełnionymi warunkami wstępnymi** (np. Focus bez tasków, Ranking przy <2 stresorach, Decompose bez stresorów). Każdy ekran musi grzecznie degradować do swojego empty-state'a — tu uderza `proto-edgecases`/`harden`.
- **Decyzja odwracana**: **ADR 0001** („Bez breadcrumbs") + **UI-STRATEGY.md:10,30** („Breadcrumbs: Nie", „kroki lejka … nie są wolnymi linkami"). Ten feature **supersede** ten zapis — lejek staje się swobodnie nawigowalny w obrębie aktywnego Runa. Nowy ADR to rejestruje.
- **Shared-doc additions**: `UI-STRATEGY.md` („Breadcrumbs: Nie" → „Tak — klikalny stepper"), `ACTIONS.md` (+„Navigate to funnel step" pod `Run`), `GLOSSARY.md` (opc. termin „Click-through funnel steps"), `ENTITY_MAP.md` (**bez zmian** — brak nowej encji/relacji).

## Per-module changes

### run (główny — obie części)
- **Data**: brak nowych encji/pól. Część 1 reużywa istniejącego `STEP_ROUTE` (`src/modules/run/types/run.ts:70-77`) — ale uwaga: klucze stepper'a (`capture`) vs `STEP_ROUTE` (`brain-dump`) się różnią; potrzeba mapy stage→route (patrz residual).
- **Actions**:
  - **NEW** „Navigate to funnel step" — skok do dowolnego kroku aktywnego Runa przez klikalny stepper (Stresory/Ranking/Akcje/Procesowanie/Focus). Implikowana nawigacja na aktywnym Runie (`activeRunId`); brak `runId` w URL lejka → consistent z dziś.
  - Część 2 nie dodaje akcji — tylko **zmienia IA** `RunDetails` (przenosi istniejące akcje wyżej).
- **Screens & flows**:
  - **Część 1**: `FunnelStepper` (shared, ale spec-owo należy do `run`) — `<span>` → `<Link to={route}>`. Aktywny etap zachowuje `aria-current="step"`. Wizualne odróżnienie current/reached/unreached + hover/focus → design/polish.
  - **Część 2**: `RunDetails` — reorder sekcji (patrz residual). Flow/entry bez zmian (Continue nadal smart-routuje).
- **States**: warunkowo nowe (gdy `edgecases` znajdzie luki) — np. micro-empty/orientacja przy skoku wyżej do pustego kroku („No tasks yet — start with breakdown"). Większość ekranów ma już empty-state'y; `harden` tylko uzupełnia.
- **Edge cases** (→ `proto-edgecases run`): skok do Focus bez tasków / Ranking <2 stresory / Decompose bez stresorów / Process bez tasków; skok wstecz w trakcie zapauzowanej sesji (snapshot per-Run musi przetrwać); klik w bieżący krok (no-op); guard braku aktywnego Runa (`RequireActiveRun`); spójność `RunDetails` po reorderze w stanach archived (read-only) i completed (`RunCompleted`/celebracja CTA teraz wyżej).
- **Design**: (1) klikalny stepper — affordance bez szumu (persona ADHD: calm > loud, JEDEN akcent brand-green, keyboard-reachable, ring token); odróżnienie current vs reached vs unreached bez rainbow clutter. (2) grupa akcji nad listą — Continue primary (brand-green, chunky), Review/Archive secondary, Delete destructive; spacing rhythm Things-3; ewent. sticky przy długiej liście (rozważyć). Respekt `DESIGN.md` (żwawe/ciepłe/okrągłe, Nunito, `--radius`, anti-slop).

### shared/FunnelStepper (część 1 — komponent cross-cutting)
- Komponent shared, renderowany przez `BrainDump.tsx:109`, `Ranking.tsx:33`, `DecomposeView.tsx:73,121`, `ProcessView.tsx:406`, `FocusView.tsx:406`. Call-site'y **bez zmian** (przekazują `current`).
- **Edit**: `STAGES` dostaje `route` per etap; render `<span>` → `<Link>`. Patrz residual #1.

## Routing — which proto skill builds what
| Step | Skill | Target | What it does |
|------|-------|--------|--------------|
| 1 | proto-detail | `run` | Zespecyfikować obie części: klikalny stepper (zachowanie, stage→route, MVP = wszystkie klikalne, supersede „no breadcrumbs") + IA akcji-nad-listą na `RunDetails`. Wpisać shared-doc: `UI-STRATEGY` (flip), `ACTIONS` (+navigate), `GLOSSARY` (opc.), zarejestrować nowy ADR superseding 0001. |
| 2 | (direct edit — residual) | `FunnelStepper.tsx`, `RunDetails.tsx` | Mechaniczny fundament: spans→Links + per-stage route (część 1); reorder bloków akcji nad listą (część 2). Patrz residual poniżej. |
| 3 | proto-edgecases | `run` (+ lekko Core lejka) | Zdiagnozować skoki do kroków z niespełnionymi warunkami, skok wstecz vs zapauzowana sesja, no-op na bieżącym, guard active-run, spójność archived/completed po reorderze. |
| 4 | proto-harden | `run` | (Warunkowo) wdrożyć nowe stany puste/orientacyjne, jeśli `edgecases` znajdzie luki poza istniejącymi empty-state'ami. |
| 5 | proto-design → polish | `run` | Hi-fi: affordance klikalnego stepper'a (current/reached/unreached, hover/focus, calm) + grupa akcji nad listą (hierarchia primary/secondary/destructive, spacing, ewent. sticky). |

## Residual — direct edits not covered by a proto skill

### #1 — Klikalny `FunnelStepper` (część 1)
- **[`src/shared/components/FunnelStepper.tsx:8-14`]** — teraz: `STAGES` ma tylko `{ key, label }`. **zmiana**: dodaj `route` per etap — `capture`→`/capture`, `ranking`→`/capture/ranking`, `decompose`→`/decompose`, `process`→`/process`, `focus`→`/focus`. **dlaczego**: stepper potrzebuje celu nawigacji; bezpośrednie reużycie `STEP_ROUTE` (`run/types/run.ts:70`) nie działa przez mismatch kluczy (`capture` vs `brain-dump`) — explicit `route` per stage jest najprostszy i unika zależności shared→module. (Alternatywa: import `STEP_ROUTE` + mapa `capture→'brain-dump'`.)
- **[`src/shared/components/FunnelStepper.tsx:27-39`]** — teraz: każdy etap to `<span>` (display-only). **zmiana**: renderuj jako `<Link to={s.route}>` (z `react-router-dom`); zachowaj `aria-current={isActive ? 'step' : undefined}` i obecne style active/done. **dlaczego**: user chce, by już-wyświetlane kroki były klikalne — to cała zmiana części 1.
- **Komentarz docelowy (`FunnelStepper.tsx:1-7`)** — zaktualizować nagłówek: z „leading, nie menu (brak linków)" na „klikalna nawigacja po krokach aktywnego Runa (supersede ADR 0001)".

### #2 — Akcje nad listą na `RunDetails` (część 2)
- **[`src/modules/run/components/RunDetails.tsx:182-248`]** — teraz kolejność sekcji: stats (`182-184`) → Tasks (`188-203`) → Continue/`RunCompleted` (`206-226`) → management grid Review/Archive/Delete (`229-248`). **zmiana**: przenieś blok Continue/`RunCompleted` (`206-226`) oraz management grid (`229-248`) tak, by siedziały **bezpośrednio po sekcji stats** (po `184`), a **przed** sekcją Tasks (`188`). Docelowo: header → stats → **Continue + akcje zarządzania** → Tasks (lista) → footer (`250-253`). **dlaczego**: lista tasków jest najdłuższą sekcją; dziś Continue/Archive/Delete lądują pod nią → user scrolluje. Surfacing wszystkich akcji nad listą rozwiązuje ból.
- **Uwagi do reorderu**: warunek `completed && !archived ? <RunCompleted> : <Continue block>` (`206`) oraz `archived ? Unarchive : Archive` (`236-244`) przechodzą w nowe miejsce nietknięte; `ConfirmDialog` (`269`), `StorageStatusToast` (`255`), `DismissUndoToast` (`279`) są position-independent — nietknięte. W stanie archived lista pozostaje read-only (`R2-3`), akcje nad nią — spójne.

## Later (deferred)
- Lockowanie nieosiągniętych kroków w stepperze (MVP = wszystkie klikalne; przywrócić jeśli testy persony ADHD wykażą paraliż decyzyjny).
- Klikalne kroki/stepper na stronie Szczegółów Runa (obok Continue smart-route).
- „Sticky" action bar na Szczegółach (zawsze widoczny bez scrolla).
- Stepper/breadcrumbs globalnie w nagłówku shell'a (dziś per-ekran).

## Hand-off
Odpal w kolejności: **(1) `proto-detail run`** — zespecyfikować obie części + wpisać shared-doc + nowy ADR superseding „no breadcrumbs". **(2) residual direct edits** (`FunnelStepper.tsx`, `RunDetails.tsx`) — mechanika. **(3) `proto-edgecases run`** → **(4) `proto-harden run`** (warunkowo) → **(5) `proto-design`/`polish run`**. Gdyby scope się zmienił (np. lockowanie kroków albo stepper na details) — odpal `proto-feature` ponownie, plan się odświeży. Ten dok jest bazą, którą czytają kolejne skille.
