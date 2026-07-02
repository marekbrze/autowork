# Feature: Decompose — task status indicator (done / irrelevant)

## Type
Feature (planned by proto-feature)

## User goal
Na ekranie **Next actions** (`decompose`, blok HOW — tam, gdzie wpisuje się next-actiony i rozbija je na taski) user chce **widzieć**, że dany task został już gdzie indziej oznaczony jako **done** (`completed`) lub **irrelevant** (`dismissed`). Dziś każdy task renderuje się jako nagi bullet `–` + tekst — niezależnie od stanu — więc powrót do `decompose` po sesji `focus` lub po oznaczeniach z `run` details wygląda tak, jakby nic nie było zrobione. Job-to-be-done: *rozpoznać na pierwszy rzut oka, co jest już załatwione, bez konieczności pamiętania lub klikania w inną stronę*.

## MVP scope
**MUSI działać:**
- Przy każdym tasku (pod next-actionem) znacznik stanu, gdy `state === 'completed'` lub `state === 'dismissed'` — odrębny dla done vs irrelevant.
- Licznik postępu przy next-actionie: `{resolved}/{total} done` gdy ≥1 task i ≥1 resolved (gdzie resolved = `completed` + `dismissed`, spójnie z `Run.progress`).
- Wizualne wyciszenie (de-emphasis) next-actionu, którego **wszystkie** taski są resolved (strike-through + muted + ew. tag „Resolved").

**Wyraźnie odłożone do „Later":**
- Zmiana stanu taska z ekranu `decompose` (read-only; Done/Dismiss zostają w `focus`, Mark done/not-relevant — w `run` details).
- Sygnalizacja stanów `skipped` i `active` (MVP = tylko `completed` + `dismissed`).
- Hi-fi / arcade stylizacja znacznika (decompose nie jest jeszcze hi-fi — ADR 0041; tylko `focus` 0042 i `run` 0051 są zaprojektowane). Budujemy neutralnie/tokenowo; design podbierze to, gdy `decompose` przejdzie `proto-design`.

## Impact map
- **New module?**: nie — rozszerza `decompose`.
- **Modules affected**: **tylko `decompose`**. Moduł już produkuje i przechowuje `Task` (`decompose:tasks:${runId}`, `useTasks`), a `NextActionItem` **już dostaje pełne obiekty `Task` z `state`** (grupowanie w `HowBlock.tsx:42-50`). Pole jest w danych — tylko się go nie wyświetla. **Cross-module: brak nowej integracji.** `completed`/`dismissed` ustawiają `focus` i `run`, ale to ten sam współdzielony byt `Task`; `decompose` tylko go czyta.
- **Cross-module integration**: żadna nowa. Niski ryzyk — czysty odczyt istniejącego pola.
- **Shared-doc additions** (wpisuje `proto-detail decompose`):
  - `ACTIONS.md`: **brak nowej akcji** (read-only). Ewentualnie notka przy istniejących akcjach `Done`/`Dismiss`, że stan jest teraz *widoczny* także w `decompose`.
  - `ENTITY_MAP.md`: **brak zmiany** (`Task.state` już udokumentowane: `pending → active → completed | skipped | dismissed`).
  - `GLOSSARY.md`: + `TaskStatusIndicator` (read-only znacznik stanu taska na liście akcji) oraz opcjonalnie `ResolvedNextAction` (next-action w całości załatwiony → wyciszony + licznik).

## Per-module changes

### decompose
- **Data**: brak nowych pól/bytów. Odczyt istniejącego `Task.state`.
- **Actions**: brak nowych (read-only). Potwierdzenie: Done/Dismiss w `focus`, Mark done/not-relevant w `run` details — bez zmian.
- **Screens & flows**: blok HOW (`NextActionItem`). Task sub-item (dziś `NextActionItem.tsx:121-130`) dostaje znacznik stanu; nagłówek next-actionu (licznik `NextActionItem.tsx:89-96`) dostaje postęp; cały item — de-emphasis gdy w pełni resolved. **Jeden plik** (`NextActionItem.tsx`); `HowBlock` przekazuje już pełne `Task[]` — bez zmian.
- **States (display, nie danych)**: per-task → `done` | `irrelevant` | `neutral` (inne). Per-next-action → `none` (0 tasków / 0 resolved) | `partial` | `resolved`.
- **Edge cases** (→ `proto-edgecases` pogłębi):
  - Next-action bez tasków („to break down") — **nie** pokazuj licznika `0/0`; zostaw „to break down".
  - Mix (1 done, 1 pending) — partial: licznik `1/2 done`, brak de-emphasis.
  - Ponowne rozbicie (`DecomposeModal`) next-actionu z done taskami: `replaceTasksForNextAction` diff-po-tekście (`use-tasks.ts:62-81`) zachowuje `state` dla tasków o niezmiennym tekście → znacznik przetrwa; usunięty z modala text = usunięty task (stan znika razem z nim); ten sam text dodany ponownie = świeży `pending`. De-emphasis liczy się live, więc sam się koryguje.
  - Stare/zmigrowane taski bez `state` (lub nieznany stan) → traktować jako neutralne (guard).
  - `dismissed` ≠ `completed`: inne glyph/label, ale **oba spokojne** (DESIGN.md: anti-ref „harsh red alarm"; irrelevant NIE na czerwono).
- **Glossary**: `TaskStatusIndicator`, `ResolvedNextAction` (kandydaci).
- **Design**: powierzchnia jeszcze neutralna (decompose nie hi-fi). Budować na tokenach shadcn (`text-muted-foreground`, `line-through`, `opacity-60`), z glyphami: ✓ dla done, neutralny (np. `Ban`/`Minus`) + etykieta „not relevant" dla dismissed. **Bez czerwonego alarmu, bez rainbow** (jeden akcent — DESIGN.md). Hi-fi odłożone do `proto-design decompose`.

## Routing — which proto skill builds what
| Step | Skill | Target | What it does |
|------|-------|--------|--------------|
| 1 | proto-detail | decompose | Sprecyzować display (stany, semantyka znacznika, licznik, de-emphasis, interakcja re-break-down) + wpisy do GLOSSARY. Update `docs/modules/decompose.md`. Light — cienka zmiana. |
| 2 | (direct edit) | — | Implementacja w `NextActionItem.tsx`. Patrz residual poniżej — to trzon zmiany. |
| 3 | proto-edgecases | decompose | Zdiagnozować nowe display-edge (0 tasków, mix, re-break-down, brak `state`, a11y). |
| 4 | proto-harden | decompose | Wdrożyć zdiagnozowane stany (głównie a11y + pusty/liczący się licznik). |
| 5 | proto-design → polish | decompose | Hi-fi, gdy decompose przejdzie projektowanie (odłożone — dziś neutralny). |

> To jest cienki, niskoryzyk, read-only slice. **Trzon to residual (direct edit w `NextActionItem.tsx`).** `proto-detail`/`edgecases`/`harden` to lekkie pasy utrzymujące dyscyplinę speca/ADR; można je skondensować, jeśli wolisz szybciej.

## Residual — direct edits not covered by a proto skill
Trzon zmiany — **jeden plik**: `src/modules/decompose/components/NextActionItem.tsx`.

- **[`src/modules/decompose/components/NextActionItem.tsx:2`]** — importy. Teraz: `import { Check, Scissors, X } from 'lucide-react';`. Dodaj glyph dla dismissed (np. `Ban`) — `Check` już jest (reuse dla done).
- **[`src/modules/decompose/components/NextActionItem.tsx:44`]** — `const taskCount = tasks.length;`. Dodaj pochodne:
  ```ts
  const resolvedCount = tasks.filter((t) => t.state === 'completed' || t.state === 'dismissed').length;
  const isResolved = tasks.length > 0 && resolvedCount === tasks.length;
  ```
- **[`src/modules/decompose/components/NextActionItem.tsx:89-96`]** — badge licznika. Teraz pokazuje `${taskCount} task(s)` lub `to break down`. Zmień na:
  - 0 tasków → `to break down` (bez zmian).
  - ≥1 task, 0 resolved → `${taskCount} task(s)` (bez zmian).
  - ≥1 resolved → `${resolvedCount}/${taskCount} done`.
- **[`src/modules/decompose/components/NextActionItem.tsx:47-52`]** — kontener itemu (`className={cn('rounded-lg border bg-background px-3 py-2 …', editing && 'border-ring')}`). Dodaj de-emphasis, gdy `isResolved && !editing`: `opacity-60` + strike-through na tekście next-actionu (`line-through text-muted-foreground`).
- **[`src/modules/decompose/components/NextActionItem.tsx:121-130`]** — lista tasków `<ul>`. Każdy `<li>` dostaje znacznik wg `t.state`:
  - `completed` → `<Check>` + `line-through text-muted-foreground`, `aria-label="…: done"`.
  - `dismissed` → `<Ban>` (neutralny, NIE czerwony) + `line-through text-muted-foreground` + ew. etykieta „not relevant", `aria-label="…: not relevant"`.
  - inne (`pending`/`active`/`skipped`/brak) → obecny `–` (neutralnie).
  - Stan przekazywany przez glyph + tekst (nie tylko kolor) — wymóg a11y.

Opcjonalnie (jeśli znacznik zrobi się długi): wydzielić mały `TaskStateBadge` w `src/modules/decompose/components/`, reużywalny później przez `run` details list. Na MVP — inline w `NextActionItem`, zgodnie z obecnym stylem modułu.

## Later (deferred)
- Akcje zmiany stanu z `decompose` (toggle done/irrelevant inline).
- Sygnalizacja `skipped` / `active` na liście akcji.
- Hi-fi / arcade stylizacja znacznika (`proto-design decompose`).
- Agregat postępu na poziomie **stresora** („3/5 done w tym stresorze") — dziś per next-action.

## Hand-off
Uruchom kroki routing w kolejności. **Najkrótsza realna ścieżka:** `proto-detail decompose` (light, zespecyfikować display + GLOSSARY) → residual edit w `NextActionItem.tsx` → `proto-edgecases` + `proto-harden` (głównie a11y). Ten dokument jest bazą, którą czytają kolejne skille.
