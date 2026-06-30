# 0036 - TaskOrder: jeden współdzielony model kolejności zadań

**Date**: 2026-06-30
**Module**: focus, run
**Status**: Accepted

## Context
Feature `session-queue-order-and-run-task-list` (ADR 0035) wprowadza ręczne przekładanie kolejki w filtrze `focus` oraz listę zadań na Szczegółach `run`. Plan feature'u zostawił **otwarte pytanie**: jak sortować listę na run — po ranku stresora, czy po manualnym porządku z focusa? Dodatkowo: czy porządek filtra i porządek listy run to **dwie niezależne rzeczy**, czy **jeden model**?

W wywiadzie `proto-detail` user rozstrzygnął: porządek ma służyć **elastyczności** — grupowanie powiązanych zadań obok siebie oraz sekwencjonowanie zależności (jedno musi być wcześniej, bo z niego wynika drugie). Nie chodzi o „łatwe najpierw" ani „najgorsze najpierw".

## Decision
Wprowadzamy **`TaskOrder`** — uporządkowaną listę ID tasków — jako **jeden współdzielony model kolejności** w całej aplikacji:

- **Default** (pusty `TaskOrder` / po resecie) = kolejność po ranku stresora (najbardziej stresujący → pierwsze), jak dotąd (`FocusView.attributed`).
- **Ręczne przełożenie** (drag / ↑↓ na liście dopasowanych w filtrze `focus`) **nadpisuje** default.
- Ten sam `TaskOrder` decyduje o kolejności w **trzech miejscach**: liście dopasowanych w filtrze `focus`, kolejce sesji po Starcie, oraz liście zadań na Szczegółach `run` (sort wewnątrz grup stanu).
- **Reset do defaultu** dostępny w filtrze `focus` (i dziedziczony przez listę `run`).
- W prototypie `TaskOrder` jest **globalne** (dane lejka bez `runId`, ADR 0020); w intencji per-Run — przy przyszłym spięciu per-Run staje się per-Run bez zmiany modelu.

**Win = elastyczność, nie nudge.** Oddajemy userowi panowanie nad kolejnością; nie sugerujemy żadnej konkretnej logiki.

## Impact
- `ENTITY_MAP.md`: dodano `TaskOrder` (typ wartości / relacja `Run 1—1 TaskOrder 1—* Task`) + notka o współdzielonym modelu.
- `GLOSSARY.md`: dodano termin `Ręczny porządek kolejki` (`TaskOrder`).
- `focus.md`: ekran filtra dwuczęściowy (filtry + lista dopasowanych z drag/↑↓ + reset); Start buduje kolejkę w porządku `TaskOrder`.
- `run.md`: lista zadań na Szczegółach sortowana wewnątrz grup stanu po `TaskOrder`.
- Nowe akcje: `Reorder queue`, `Reset queue order` (→ ADR 0037).
- Otwarte (→ `edgecases`/`harden`): taski dodane po nadaniu `TaskOrder`; `TaskOrder` wskazujący usunięte taski (prune) lub taski spoza bieżącego filtru; reset (confirm vs undo).
