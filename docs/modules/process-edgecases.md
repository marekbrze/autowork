# Process — Edge Cases

## Coverage
- **Spec already captured** (`docs/modules/process.md` → Edge Cases, 11 pozycji): nic do przetworzenia (empty state); task z wszystkimi 3 atrybutami pominięty; skip → null (nudge); cofnięcie do nadanego kroku z pre-fill; skok sidebar → pierwszy krok taska; usuwanie mid-session → skok do następnego; edycja nazwy do pustego → anuluj; długa nazwa → truncacja; długa sesja → jeden krok na ekran; błąd LocalStorage (toast + retry); powrót do `process` po `focus` (recompute).
- **Already handled in code**:
  - Empty / brak tasków → empty state „Wszystko gotowe" + „Dalej do focus" — `ProcessView.tsx:360-369`
  - Task w pełni opisany nie trafia do sesji (`missingSteps` filter) — `ProcessView.tsx:74-76`, `:109`
  - Skip zostawia null, nie blokuje — `ProcessView.tsx:193-197`
  - Wstecz z pre-fill obecnej wartości — `ProcessView.tsx:142-147`, `:174-176`
  - Skok sidebar → krok taska — `ProcessView.tsx:219-222`
  - Usuwanie mid-session → skok do następnego (lub done) — `ProcessView.tsx:240-260`
  - Edycja do pustego anuluje (nie usuwa) — `TaskNameEditor.tsx:29-31`
  - Długa sesja: jeden krok na ekran, sidebar daje orientację — by design
  - **Błąd LocalStorage (toast + retry) — JUŻ zaimplementowane mimo że spec zaznaczał „po `proto-harden`"** — `ProcessView.tsx:530-536`, `StorageStatusToast.tsx`
  - Powrót po `focus`: `sessionTasks` to `useMemo` liczący brakujące atrybuty na nowo — `ProcessView.tsx:107-115`
  - Referencje: usunięty stresor/next-action → grupa „Bez stresora" + sort na rank 99 — `ProcessView.tsx:111`, `ProcessingSidebar.tsx:69`
- **New gaps found**: **10** ( 🔴 1 · 🟡 3 · 🟢 6 )
- **Headline**: prototyp jest w dobrej formie — spec był dokładny, a większość edge-case'ów (w tym obsługa błędów LocalStorage) jest już zaimplementowana. Luki skupiają się wokół **jednego korzenia**: integracja przepływu processing z honest-persistence warstwy storage.

> **Status po `proto-harden`** (ADR 0015): **8/10 zamknięte** ✅, **2 odroczone** ❌ (#7 — persystencja pozycji sesji = nowa funkcja poza zakresem harden; #10 — link „← Dashboard" = decyzja designu, nie bug). Detale w kolumnie **Status** poniżej.

## Inventory

| # | Status | Severity | Category | Edge case | Fix / behavior | Where |
|---|--------|----------|----------|-----------|----------------|-------|
| 1 | ✅ | 🔴 | Prototype-specific (honest persistence) | Nieudany zapis atrybutu mimo to advance'uje krok i stawia ✓ | `commit`/`saveEdit`/`handleDelete` zaznaczają ✓ i ruszają dalej **tylko po udanym zapisie** (`updateTask`/`deleteTask` zwracają `boolean`, `setValue` też). Przy nieudanym zostajemy na kroku + toast `writeError`; po udanym `retry` efekt dokańcza commit (✓ + advance). UI zawsze odzwierciedla zapisany stan. | `ProcessView.tsx` `commit()` + retry `useEffect`; `use-tasks.ts` `updateTask`/`deleteTask`; `use-local-storage.ts` `setValue` |
| 2 | ✅ | 🟡 | Action outcomes (destructive) | Usuwanie taska mid-session — bez potwierdzenia, bez undo | Trash otwiera `ConfirmDialog` (AlertDialog); usunięcie dopiero po „Usuń zadanie". `ConfirmDialog` promowany z `decompose` do `shared/` (reuse, `useId` na aria). | `ProcessView.tsx` `confirmDeleteId` + `<ConfirmDialog>`; `shared/components/ConfirmDialog.tsx` |
| 3 | ✅ | 🟡 | Forms / input (keyboard) | Globalny Enter „double-fires", gdy przycisk (option-card / Edit / Trash) jest sfokusowany | Globalny `keyHandler` wygasza się też dla `BUTTON`/`A` (nie tylko INPUT/TEXTAREA) — Enter na sfokusowanym przycisku/linku działa natywną drogą, bez double-fire. Rozwiązuje też podwójny `startSession` na summary. | `ProcessView.tsx` `keyHandlerRef` (guard `INPUT|TEXTAREA|BUTTON|A`) |
| 4 | ✅ | 🟡 | Navigation / flow | Brak powrotu do podsumowania po starcie processing (pierwszy krok) | `goBack()` z `cursorIndex === 0` → `setScreen('summary')`; „← Wstecz" renderowany zawsze (też ←). | `ProcessView.tsx` `goBack()` + render Wstecz |
| 5 | ✅ | 🟢 | Data states | Ekran done: zła polonizacja przy 0 + lądowanie na done z 0 zadań | `pluralTasks(n)` (pełna reguła: 1/zadanie, 2–4/zadania, 5+/zadań); gdy usunięcie opróżnia sesję → summary (nie done „0 zadań"). | `ProcessView.tsx` `pluralTasks()` + `handleDelete` (pusta sesja → summary) |
| 6 | ✅ | 🟢 | Data states (long text) | Główna nazwa taska + nagłówek stresora + breadcrumb nie są truncowane | Main: `line-clamp-2` + `title` (decyzja designu); nagłówek stresora w sidebarze i breadcrumb: `truncate` + `title`. | `ProcessView.tsx` main `<h2>` + breadcrumb; `ProcessingSidebar.tsx` nagłówek stresora |
| 7 | ❌ | 🟢 | Loading / navigation | Pozycja sesji niepersystowana — refresh / back przeglądarki rzuca do summary | **Odroczone:** persystencja `screen`+`cursorIndex` to nowa funkcja (wznowienie w miejscu), poza zakresem harden (stany istniejących flow). Praca nie ginie — commitowane atrybuty trwają, kolejka liczy się na nowo. | — |
| 8 | ✅ | 🟢 | Data states (long list) | Sidebar bez kontenera scroll / bez auto-scroll do bieżącego taska | Lista tasków: `max-h-[60vh] overflow-y-auto`; bieżący task auto-scrollowany w widok (`scrollIntoView({block:'nearest'})`). | `ProcessingSidebar.tsx` kontener + `useEffect` |
| 9 | ✅ | 🟢 | Errors | Surfacowany tylko status storage tasków | `storageView` agreguje read/write trzech storów (tasks/stressors/nextActions); `retry`/`dismiss` wołane dla wszystkich; `entityLabel` „zadań" przy awarii tasków, „danych" ogólnie. | `ProcessView.tsx` `storageView` |
| 10 | ❌ | 🟢 | Navigation / flow (spójność ze specem) | Wolny link „← Dashboard" przeczy specowi „brak wolnych linków nawigacji" | **Odroczone:** decyzja designu (escape hatch vs „leading, not menu"), nie bug — zostawione designerowi. | — |

Kategorie sprawdzone bez luk (żeby czytelnik wiedział, że były na liście):
- **Special chars / unicode / emoji**: brak problemu — React escapuje tekst, opcje to stałe enumy/presety (`ProcessView.tsx:50-71`).
- **Boundary values (0 / ujemne / maks.)**: N/A — atrybuty dobierane z kart, brak swobodnego wpisu liczbowego.
- **Validation (pole)**: jedyny free-text to edytor nazwy, pusty draft = anuluj (zgodnie ze specem) — bez błędu, celowo.
- **Unexpected error → `alert()`**: w ścieżce usera **brak** `alert/confirm/prompt` (jedyny `window.confirm` to dev-only `DevToolbar.tsx:14`).
- **State transitions**: `process` filtruje po `state === 'pending'` i tylko nadaje atrybuty — nie triggeruje przejść taska; brak ryzyka nielegalnego przejścia (`ProcessView.tsx:109`).
- **Offline**: LocalStorage działa offline, brak sieci w ogóle — prototyp funkcjonuje.

## Post-harden summary (ADR 0015)
Zamknięte w `proto-harden`, w kolejności priorytetów:
1. **✅ #1 Honest-persistence (🔴)** — `commit`/`saveEdit`/`handleDelete` ruszają dalej tylko po udanym zapisie; efekt dokańcza commit po `retry`. Największa usunięta kruchość (cicha utrata atrybutu z fałszywym ✓).
2. **✅ #2 Potwierdzenie usuwania** — `ConfirmDialog` (promowany do `shared/`), spójnie z `decompose`.
3. **✅ #3 Enter double-fire** — guard wyklucza `BUTTON`/`A`.
4. **✅ #4 Powrót do summary z kroku 0** — `goBack` → summary, Wstecz zawsze widoczne.
5. **✅ #5 Polonizacja done + routing pustej sesji** — `pluralTasks`, pusta sesja → summary.
6. **✅ #6 Długa nazwa** — clamp-2 (main) + truncate (header/breadcrumb).
7. **✅ #8 Sidebar scroll + auto-scroll** — `max-h` + `scrollIntoView`.
8. **✅ #9 Scope toastu** — agregacja 3 storów.

Odroczone (❌):
- **#7 Persystencja pozycji sesji** — nowa funkcja (wznowienie w miejscu), poza zakresem harden; praca nie ginie.
- **#10 Link „← Dashboard"** — decyzja designu (escape hatch vs spec), nie bug.

## Stories
- `Process/ProcessView`: `WithData`, `EmptyState`, `AllProcessed`, **`LongName`** (#6), **`StorageReadError`** (#9 / read-error toast).
- `Shared/ConfirmDialog`: `DeleteNextAction`, `DeleteReason`, **`DeleteTask`** (#2), `Closed`.
- Stany interakcyjne (#1 write-fail + retry, #3 Enter) weryfikowane klik-through w `npm run dev` — nie da się ich pokazać statycznie w story bez mockowania storage.
