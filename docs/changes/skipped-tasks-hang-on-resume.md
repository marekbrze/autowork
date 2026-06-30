# Bug: Skipped tasks „hang" on Resume (session shows „3 of 3")

## Type
Bug (diagnosed by proto-bug)

## Severity
🟡 medium — mylące na głównej pętli Continue/Resume, ale dane bezpieczne (skips widoczne w puli przez edit-1 z ADR 0034; świeży Start przywraca). Bez utraty danych, stąd nie 🔴; user raportuje jako błąd na primary flow, stąd wyżej niż 🟢.

## Reproduction
1. `npm run dev` → wejdź do `/focus` z filtrem ≥3 dopasowanych tasków → **Start**.
2. Na ekranie taska kliknij **Skip** ×2 (t0, t1 → `skipped`); dojdź do t2.
3. Wyjdź z sesji: albo **Exit** (`FocusView.tsx:287`), albo **← Dashboard** (unmount, `App.tsx` route swap).
4. Wróć do `/focus` → banner **„Wznów sesję"** pokazuje pozycję (np. „3 of 3"). Kliknij **Resume**.

**Expected** (przyjęty model — Resume bez zmian, ADR 0038): Resume ląduje tam, gdzie przerwałeś (t2); skipnięte t0, t1 są **odłożone** i wrócą przy świeżym Starcie, a wskaźnik pozycji **wyraźnie to komunikuje** — nie „3 of 3" sugerujące, że t0, t1 są zrobione.
**Actual**: Resume na t2, wskaźnik **„3 of 3"** — t0, t1 „wiszą" (wyglądają na załatwione, a są tylko odłożone). Dodatkowo po wyjściu przez **Exit** t0, t1 są już `pending` (wczesny reset `:290`), więc w puli wyglądają jak zwykłe to-do, których Resume nie sięgnie.
**Reliability**: za każdym razem, dla każdej sesji z ≥1 skipniętym taskiem przed bieżącym.
**Location**: `src/modules/focus/components/FocusView.tsx` — `exit()` `:287-293` (wczesny `returnSkippedToPool` `:290`), `resumeSession()` `:207-213`, wskaźnik pozycji przekazywany do `FocusTaskScreen` `:399`. Moduł: `focus`, ekran: FocusTaskScreen, akcja: Skip → wyjście → Resume.

## Root cause
**Class**: logic (+ komunikacyjny/UX wskaźnik).

**Cause**: Dwa połączone defekty pod przyjętym modelem (Resume = tam gdzie przerwałeś; Skip = tymczasowy, wraca przy świeżym Starcie, `start()` `:194`):

1. **`exit()` wcześnie resetuje skips** — `returnSkippedToPool()` (`:283-285`) wywołane w `exit()` (`:290`) flipuje `skipped → pending` już przy wyjściu, a nie przy nowej sesji. To łamie model (skips wracają przy *następnej sesji* = świeży Start, nie przy Exit) i tworzy niespójny stan: po Exit skipnięte taski są `pending`, ale siedzą **za kursorem resume** (`firstPendingFrom` `:127-133` skanuje w przód od kursora; `resumableSnapshot` `:167-171`) → Resume ich nie sięgnie, a w puli wyglądają jak zwykłe to-do. Wyjście przez **nawigację na Dashboard** (unmount) tego nie robi — skips zostają `skipped` = poprawnie odłożone. Czyli dwa lawful wyjścia dają **różny stan**.

2. **Wskaźnik pozycji myli** — `position={{ index: activeCursor, total: queue.length }}` (`:399`) renderuje „3 of 3", licząc odłożone-behind taski tak, jakby były załatwione. User widzi „3 of 3" i sądzi, że t0, t1 są zrobione — stąd odczucie „wiszą".

To dokładnie ta **„resume-snapshot interaction with the restored-to-pending tasks"**, którą ADR 0034 przewidział w sekcji Impact jako głębszą przyczynę, a w regression-scope poprzedniej diagnozy (`skip-removes-task-from-pool.md:68`) oflagował jako znany quirk („`exit()` resets skipped → pending *and* keeps the resume snapshot").

**Evidence**:
- `src/modules/focus/components/FocusView.tsx:290` — `returnSkippedToPool()` w `exit()`; wcześnie (główny moment przywracania to `start()` `:194`).
- `FocusView.tsx:127-133` — `firstPendingFrom` awansuje tylko na `pending`; skan w przód od `start`.
- `FocusView.tsx:167-171` — `resumableSnapshot` = `firstPendingFrom(snapshot.queue, snapshot.cursor)`; kursor za skipami.
- `FocusView.tsx:207-213` — `resumeSession` przywraca `snapshot.cursor`; nie resetuje skipów.
- `FocusView.tsx:399` — `position={{ index: activeCursor, total: queue.length }}` → „3 of 3".
- `FocusView.tsx:161-163` — snapshot-sync zapisuje `{ queue, cursor }` w trakcie sesji (kursor za skipami).
- `FocusView.tsx:283-285` — `returnSkippedToPool` (jedyna ścieżka `skipped → pending`).
- Spec (intent): `docs/modules/focus.md` §„Wczesne wyjście (Exit)" — *„wznowienie → kontynuacja od tego samego taska"*; §„Skip vs Dismiss" — Skip *„wraca jako `pending` przy następnej sesji (nie doklejane do bieżącej kolejki)"*; `src/modules/run/stats.ts:19` — *„`skipped` NIE liczy się (wraca w kolejnej sesji)"*.

## Fix plan
Przyjęty kierunek (Option 2, ADR 0038): **Resume bez zmian** (tam, gdzie przerwałeś) + **naprawa stanu i wskaźnika**. Skipy wracają przy świeżym Starcie (już tak, `:194`).

1. **`FocusView.tsx:290` — usuń wcześnie reset z `exit()`.**
   - now: `exit()` woła `returnSkippedToPool();`
   - change: usuń to wywołanie z `exit()` (zostaw w `clearCompleted` `:327` i `onNewSession` `:429` — to granice końca sesji, idempotentne).
   - why: skips mają zostać `skipped` (= odłożone) aż do świeżego Startu; wczesny reset tworzy `pending`-za-kursorem nieosiągalne na Resume i niespójne z nawigacją-na-Dashboard. Usunięcie unifikuje stan (Exit i Dashboard dają ten sam `skipped`).
2. **`FocusView.tsx:399` + `FocusTaskScreen` — wskaźnik „odłożone vs załatwione".**
   - now: `position={{ index: activeCursor, total: queue.length }}` → „3 of 3".
   - change: policz w `FocusView` liczbę tasków w `queue` przed `activeCursor` w stanie `skipped` (odłożone, nie done) i przekaż do `FocusTaskScreen` (np. `deferredEarlier`); renderuj np. „Task 3 of 3 · 2 deferred (back next session)" tylko gdy `deferredEarlier > 0`.
   - why: „3 of 3" liczy odłożone-behind jako załatwione → mylące.

**Spec impact**: brak dla zmiany 1 (kod ma się zgadzać ze specem). Dla zmiany 2 — opcjonalna jednowierszowa nuta w `docs/modules/focus.md` §Edge Cases, że wskaźnik rozróżnia odłożone (skip) od załatwionych (done).

## Regression scope
- `FocusView.tsx:327` (`clearCompleted`) i `:429` (`onNewSession`) — nadal wołają `returnSkippedToPool`; zostaw (idempotentne bezpieczeństwo na końcu sesji). Verify: nie wymagają wczesnego resetu z `exit`.
- `attributed` (`FocusView.tsx:78-90`, admits `pending`||`skipped`) — usunięcie exit-resetu nie wpływa; skips nadal widoczne w filtrze. Verify: po Exit skipy wciąż w `matchCount`.
- `start()` (`:190`, `:194`) — nadal przywraca skips przy świeżym Starcie. Verify: po Exit → fresh Start → skipy wracają do kolejki.
- `resumeSession()` (`:207-213`) — zachowanie bez zmian (tam, gdzie przerwałeś); teraz spójne (skips zostają `skipped`). Verify.
- `FocusTaskScreen` — nowy prop `deferredEarlier`; verify inne użycia `position` i że info o odłożonych pokazuje się tylko gdy > 0.
- Snapshot auto-prune (`:174-176`) — bez zmian.
- Storybook (`FocusTaskScreen`/`FocusView`) — jeśli asercja tekstu pozycji, zaktualizuj.
- Powiązane edge case'y → `proto-edgecases [focus]`: Resume po skipnięciu wszystkiego; Resume gdy Back przywrócił task przed skipami; multi-tab skip + resume.

## Routing
| Step | Skill / action | Target | What |
|------|----------------|--------|------|
| 1 | (direct edit) | `src/modules/focus/components/FocusView.tsx:290` | usuń `returnSkippedToPool();` z `exit()`; why: skips odłożone aż do Startu, unifikuje stan. |
| 2 | (direct edit) | `FocusView.tsx:399` + `FocusTaskScreen` | przekaż `deferredEarlier` (skipnięte przed kursorem) + renderuj „· N deferred"; why: wskaźnik ma rozróżniać odłożone od załatwionych. |
| 3 | proto-polish (optional) | `focus` | finalny copy/układ wskaźnika + a11y. |
| 4 | proto-edgecases (optional) | `focus` | skan lifecycle skip × Resume (refresh, multi-tab, all-skipped). |

To **fix logiki** (wczesny reset) + **komunikacyjny** (wskaźnik) — nie brakujący stan (→ nie `proto-harden`), nie czysto wizualny (→ `proto-polish` opcjonalnie na copy).

## Hand-off
Zastosuj direct-edit 1 (usuń `returnSkippedToPool` z `exit()` `:290`) i 2 (wskaźnik „deferred" w `:399` + `FocusTaskScreen`). Potem zweryfikuj ścieżką repro: Skip ×2 → Exit → Resume → wskaźnik pokazuje „· 2 deferred" (nie „3 of 3"), a świeży Start przywraca t0, t1. Regression sites: `clearCompleted`/`onNewSession` (`:327`, `:429`), `attributed` (`:78-90`), `start` (`:194`).
