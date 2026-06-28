# 0015 - Process prototype hardened

**Date**: 2026-06-28
**Module**: process
**Status**: Accepted

## Context
Prototyp `process` obsługiwał happy paths i (już w dużej mierze) edge-case'y ze specyfikacji, ale systematyczny audyt (`proto-edgecases`, ADR 0014 / `docs/modules/process-edgecases.md`) znalazł 10 nieobsłużonych luk: 🔴 1 · 🟡 3 · 🟢 6. Najpoważniejsza: przy nieudanym zapisie LocalStorage krok processingu advance'ował i stawiał ✓ mimo że atrybut nigdy nie został zapisany (cicha utrata danych z fałszywym sygnałem sukcesu).

## Decision
Wdrożono **8 z 10** stanów edge-case'owych (2 odroczone — patrz niżej), działając w kolejności priorytetów i nie zmieniając happy pathu:

- **#1 Honest-persistence (🔴)** — `useLocalStorage.setValue` oraz `useTasks.updateTask`/`deleteTask` zwracają sukces zapisu (`boolean`); `commit`/`saveEdit`/`handleDelete` ruszają dalej (✓ + advance / zamknięcie edytora / mutacje sesji) **tylko po udanym zapisie**. Nowy efekt dokańcza commit (✓ + advance), gdy atrybut utrwali się po udanym `retry`. UI zawsze odzwierciedla zapisany stan.
- **#2 Potwierdzenie usuwania** — `ConfirmDialog` promowany z `decompose` do `shared/components/` (`useId` na aria, reuse); Trash otwiera dialog.
- **#3 Enter double-fire** — globalny `keyHandler` wygasza się też dla `BUTTON`/`A` (nie tylko INPUT/TEXTAREA); Enter na sfokusowanym przycisku/karcie działa natywnie.
- **#4 Powrót do summary z kroku 0** — `goBack` → summary przy `idx 0`; „← Wstecz" zawsze widoczne.
- **#5 Polonizacja + routing** — `pluralTasks(n)` (pełna reguła); opróżnienie sesji przez usunięcie → summary (nie done z zerem).
- **#6 Długa nazwa** — main `line-clamp-2` + tooltip; nagłówek stresora i breadcrumb `truncate` + tooltip.
- **#8 Sidebar** — lista z `max-h` + scroll; bieżący task auto-scrollowany (`scrollIntoView`).
- **#9 Scope toastu** — `storageView` agreguje read/write trzech storów (tasks/stressors/nextActions); `retry`/`dismiss` dla wszystkich.

Stories: `ProcessView` (+`LongName`, `StorageReadError`), `Shared/ConfirmDialog` (+`DeleteTask`).

## Odroczone (❌)
- **#7 Persystencja pozycji sesji** (`screen`+`cursorIndex`) — to **nowa funkcja** (wznowienie w miejscu po refresh), poza zakresem harden, który dodaje stany do istniejących flow, nie nowe zachowanie. Praca nie ginie: commitowane atrybuty trwają w storze, a `buildSession` liczy kolejkę na nowo.
- **#10 Link „← Dashboard"** — **decyzja designu** (świadomy escape hatch vs spec „brak wolnych linków nawigacji"), nie bug; zostawione designerowi.

## Impact
Prototyp `process` obsługuje teraz każdą ścieżkę flow, nie tylko happy path, przy zachowaniu dotychczasowego zachowania happy pathu. Największa usunięta kruchość: cicha utrata atrybutu przy pełnym/niedostępnym LocalStorage (fałszywy ✓) — teraz UI zostaje na kroku do czasu udanego zapisu. Wizualny poler to osobny przyszły `proto-design`. Model domeny (encje/akcje/stany) niezmieniony — `ConfirmDialog` to element UI, nie nowa akcja domenowa, więc `ACTIONS.md`/`ENTITY_MAP.md` nietknięte. Re-run `proto-edgecases` po dalszych zmianach odświeży baseline.
