# Decompose — Task-status display: Edge Cases

Feature-focused re-audit (precedens: ADR 0039). Diagnozuje **tylko nowe zachowanie** zaplanowane w `docs/changes/decompose-task-status-indicator.md` (ADR 0056) i zespecyfikowane w `docs/modules/decompose.md` (ADR 0057): read-only znacznik stanu taska (`completed` ✓ / `dismissed` ⊘ „not relevant") + licznik postępu `X/N done` + de-emphasis (`ResolvedNextAction`) w bloku HOW `decompose`. Reszta modułu jest już zaudytowana i zahardowana (`decompose-edgecases.md`, ADR 0011/0010) — nie powtarzam tu tych luk.

Każdy wiersz ma `file:line` — gdzie nowa logika *powinna* obsłużyć przypadek (głównie `NextActionItem.tsx`, który dziś renderuje taski jako nagie bullety `–` bez stanu, `NextActionItem.tsx:121-130`).

## Coverage
- **Spec już ujął** (`docs/modules/decompose.md` Edge Cases, dodane ADR 0057): next-action bez tasków (brak licznika) · mix stanów (`1/2 done`, bez de-emphasis) · ponowne rozbicie zachowuje `state` (diff-po-tekście) · task bez `state` → neutralnie · `dismissed` ≠ `completed` (oba spokojne, nie czerwone) · a11y (glyph+tekst) · resolved next-action nadal edytowalny.
- **Jeszcze niezbudowane w kodzie** — feature to czysta zmiana display; `NextActionItem.tsx` dziś ignoruje `task.state`. „Behavior today" poniżej = stan obecny (przed implementacją).
- **Luki znalezione (poza tym, co spec już ujął)**: **7** (spec pokrył 7 powiązanych; tu diagnoza szczegółów implementacyjnych).
- **Po severity**: 🔴 0 · 🟡 4 · 🟢 7.

> Największe źródło kruchości nowego feature'u: **interakcja z istniejącym modalem rozbicia** (`DecomposeModal`) — modal operuje na samych tekstach tasków i nie wie o ich stanie, więc edycja tekstu done tasku po cichu cofa go do `pending` (#1). Reszta to a11y (#3) i defensive guard na brak `state` (#4) — tanie do obsłużenia przy implementacji.

## Inventory

| # | Severity | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|----------|----------|-----------|----------------|--------------------|-------|
| 1 | 🟡 | Cross-module / Action outcomes | Ponowne rozbicie po cichu cofa done/dismissed task do `pending` | `DecomposeModal` pokazuje same teksty (`initialSteps = tasks.map(t=>t.text)`, `NextActionItem.tsx:135`) — bez stanu. Edycja/drobna zmiana tekstu done tasku łamie dopasowanie w `replaceTasksForNextAction` (`use-tasks.ts:62-81`) → stary done task usunięty, nowy `pending`. User traci status „done/irrelevant" nie wiedząc o tym; modal nie ostrzega. | Pokazać stan taska w modalu (znacznik ✓/⊘ przy kroku) ALBO ostrzec przy edycji/usunięciu tekstu załatwionego kroku. Decyzja designu w `proto-harden`. | `DecomposeModal.tsx:112-134` (lista kroków), `:46-49` (save → replace); diff `use-tasks.ts:62-81`; mount `NextActionItem.tsx:132-139` |
| 2 | 🟡 | Data states (semantics) | `dismissed` wliczony w „done" licznika | Licznik `X/N done` liczy `completed`+`dismissed` (spójnie z `Run.progress`). Next-action z samymi `dismissed` czyta się „N/N done" + de-emphasis — wygląda w pełni ukończony, choć nic nie zrobiono (wszystko irrelevant). Mylące semantycznie. | Zaakceptować (parity z `Run.progress`, prosta komunikacja) ALBO zmienić label/licznik („resolved", albo rozdziel „done · irrelevant"). Decyzja już odroczonego pytania o wording (user AFK → default „X/N done"). | count badge `NextActionItem.tsx:89-96`; pochodna `:44` |
| 3 | 🟡 | a11y | Stan taska / resolved next-action niedostępny dla AT | Jeśli done=strike+✓ i dismissed=⊘+tag są tylko wizualne, czytnik ekranu przeczyta sam tekst. De-emphasis next-actionu (opacity+strike) też milczy dla AT. | `aria-label`/visually-hidden per task („…: done" / „…: not relevant"); affordans `aria-label`/role na wyciszonym next-actionie („resolved"). Stan przez glyph+tekst, nie tylko kolor (już w specu ADR 0057). | task list `NextActionItem.tsx:121-130`; kontener/de-emphasis `:47-52` |
| 4 | 🟡 | Cross-module / lifecycle (guard) | Legacy/migrowany task bez pola `state` | `migrate.ts:114-116` backfilluje `runId`, **nie** `state`. Task persystowany przed wprowadzeniem pola `state` go nie ma. Naturalny kod (switch/ternary z defaultem→neutral) nie wywala i nie liczy jako resolved — ale trzeba to zrobić **jawne** (nie zakładać `state ∈ {5}`). | Explicit default→neutral w per-task renderze; `resolvedCount` z `===` jest bezpieczny dla `undefined`. Udokumentować założenie. | per-task switch `NextActionItem.tsx:121-130`; filtr `:44` |
| 5 | 🟢 | Action outcomes (copy) | ConfirmDialog usuwania nie wspomina o done taskach | Usuwanie resolved next-actionu: istniejący dialog mówi „I'll also delete its tasks" (`NextActionItem.tsx:141-151`) bez info, że taski są done/irrelevant. Drobne (istniejące zachowanie). | Opcjonalnie doprecyzować copy albo zaakceptować (read-only dotyczy stanu, usuwanie to istniejąca akcja). | `NextActionItem.tsx:141-151` |
| 6 | 🟢 | Data states (aggregate) | Stresor ze wszystkimi next-actionami resolved | Ekran pokazuje same wyciszone/szare next-actiony bez agregatu na poziomie stresora — może czytać się jako „zepsute/wyszarzone". | Opcjonalnie subtelny hint na poziomie stresora („all actions handled") — odroczone w planie (ADR 0056 „Later"). Na MVP akceptowalne. | `DecomposeView.tsx` blok HOW (stressor-level) |
| 7 | 🟢 | Data states | `active`/`skipped` renderują neutralnie | MVP pokazuje tylko completed/dismissed; task `active` (pod timerem) lub `skipped` (odłożony) renderuje się nago `–`. Next-action z samymi `skipped` nie dostaje de-emphasis (skipped ≠ resolved) — poprawne, ale user może oczekiwać „załatwione". | Akceptowalne dla MVP (zgodne ze specem ADR 0057). Opcjonalnie później. | task list `NextActionItem.tsx:121-130` |
| 8 | 🟢 | Errors / a11y (contrast) | Kontrast strike-through + muted resolved | De-emphasis (opacity-60 + strike) obniża kontrast; upewnić się, że muted tekst spełnia WCAG AA. `dismissed` NIE na czerwono (DESIGN.md anti-ref „harsh red alarm"). | Zweryfikować kontrast przy implementacji; użyć tokenów muted (nie fixed alpha poniżej AA). | de-emphasis `NextActionItem.tsx:47-52`; task list `:121-130` |
| 9 | 🟢 | Data states | Długi tekst tasku pod strike-through | Długi tekst + strike-through + truncate (`NextActionItem.tsx:124`) — upewnić się, że truncate czyta się z przekreśleniem. | Verify przy implementacji; truncate już istnieje. | `NextActionItem.tsx:124` |
| 10 | 🟢 | Data states | Dużo załatwionych tasków pod jednym next-actionem | Długa lista przekreślonych tasków = szum wizualny; brak collapse. | Akceptowalne dla prototypu; opcjonalnie collapse później. | task list `NextActionItem.tsx:121-130` |
| 11 | 🟢 | Loading & async (cross-tab) | Stan zmienia się w innej karcie przy otwartym decompose | Task oznaczony done w `focus`/`run` w innej karcie: `useLocalStorage` synchronizuje (zdarzenie `storage`), `tasks` reaktywnie → `HowBlock` prze-grupowuje → wskaźnik/licznik/de-emphasis aktualizują się live. Prawdopodobnie ✓ już działa. | Zweryfikować ścieżkę reaktywną; zmiana nie oczekiwana. | `HowBlock.tsx:42-50` (grupowanie), `use-tasks.ts` |

### Sprawdzone kategorie — bez luk / N/A
- **Pusta kolekcja / empty states**: pokryte baseline (`decompose-edgecases.md`); nowy feature nie dodaje ekranu, tylko dekoruje istniejącą listę.
- **Podwójny submit / in-flight state**: N/A — read-only, bez akcji mutującej.
- **Walidacja pól / niepoprawne formaty / wymagane pola**: N/A — feature nie dodaje inputów (read-only display).
- **Przejścia stanów (FSM)**: N/A — `decompose` nie mutuje `Task.state` (read-only; mutują `focus`/`run`).
- **Storage write/read failure**: istniejący `StorageStatusToast` (hardened #1/#2, ADR 0011) obejmuje store tasków; przy `readError` display degraduje grzecznie (brak tasków → brak wskaźników, bez crasha).
- **`alert()` / unexpected error**: N/A.
- **Dead ends / nawigacja**: N/A — feature nie zmienia flow.
- **Offline**: N/A — read-only z localStorage.
- **Uprawnienia / role**: N/A (single-user).

## Priority list
1. 🟡 **#1 — re-break-down cofa resolved taski** — jedyna realna „utrata" (statusu) w nowym feature; `DecomposeModal` nie wie o stanie. Pokazać stan w modalu albo ostrzec.
2. 🟡 **#3 — a11y stanu** — przekazać done/irrelevant + resolved do czytników ekranu (glyph+tekst + aria).
3. 🟡 **#4 — guard na brak `state`** — jawny default→neutral (legacy/migrowane dane; `migrate.ts` nie backfilluje `state`).
4. 🟡 **#2 — semantyka licznika** — potwierdzić wording „done" vs „resolved" (domyślnie „X/N done", parity z `Run.progress`).
5. 🟢 **Polish** (#5-#11) — copy dialogu, agregat stresora, neutral active/skipped, kontrast, truncate, długie listy, verify cross-tab.

## Hand-off to proto-harden
Top-priority luki, które harden powinien wdrożyć razem z implementacją display (residual edit w `NextActionItem.tsx`, plan ADR 0056):
- **#1 — `DecomposeModal` świadomy stanu**: przy implementacji znacznika rozważyć pokazanie stanu taska w modalu rozbicia (lub ostrzeżenie), żeby edycja tekstu nie cofała po cichu done/irrelevant.
- **#3 — a11y od pierwszej linijki**: `aria-label` per task + resolved next-action (nie dokładać później).
- **#4 — defensive default**: neutralna gałąź dla brakującego/nieznanego `state`.
- **#2 — potwierdzić z designerem** wording licznika („X/N done" vs alternatywy).

> Uwaga: ten feature jest cienki i read-only, więc większość „stanów" to decyzje implementacyjne, nie osobne ekrany stanu jak w typowym hardenie. `proto-harden` tu = wdrożyć #1/#3/#4 razem z residual edit + ew. story w Storybooku (resolved next-action, mix stanów, dismissed-only, task bez `state`).
