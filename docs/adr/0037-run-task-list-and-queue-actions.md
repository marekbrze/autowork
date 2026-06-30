# 0037 - Lista zadań na RunDetails + akcje kolejki

**Date**: 2026-06-30
**Module**: run, focus
**Status**: Accepted

## Context
Feature `session-queue-order-and-run-task-list` (ADR 0035): user chce widzieć **realną listę zadań** (nie tylko agregaty) na Szczegółach `run` i działać z listy; oraz ręcznie przełożyć kolejność w filtrze `focus`. `TaskOrder` jako współdzielony model ustalono w ADR 0036.

## Decision

**A) Akcje kolejki (`focus`)** — dopisane do `ACTIONS.md` (encja `Task`):
- `Reorder queue` — drag / ↑↓ na liście dopasowanych; aktualizuje `TaskOrder` (ADR 0036). Honest persistence: przy awarii zapisu lokalny stan się nie psuje (wzorzec `ProcessView`).
- `Reset queue order` — czyści `TaskOrder` → powrót do ranku stresora.

**B) Lista zadań na RunDetails (`run`)** — nowa sekcja „Tasks" między statystykami (`RunStatTiles`) a blokiem Continue:
- Lista wszystkich tasków (`decompose:tasks`, globalne — ADR 0020) **pogrupowana stanem**: **To do** (`pending`/`skipped`/`active`), **Done** (`completed`), **Not relevant** (`dismissed`); sort wewnątrz grupy po `TaskOrder` (ADR 0036).
- Wiersz: tekst + plakietka stanu (+ labelka „untagged" gdy bez atrybutów) + akcje.
- Akcje z listy (dopisane do `ACTIONS.md`):
  - `Mark task done (from details)` — `pending`/`skipped`/`active` → `completed`.
  - `Mark task not-relevant (from details)` — → `dismissed` (terminalnie; undo; liczy do progresem, ADR 0017).
- **`run` po raz pierwszy mutuje stany tasków** — cross-module write przez `updateTask` (`decompose/hooks/use-tasks.ts`). Statystyki (`deriveRunStats`, `stats.ts`) i krok resume (`deriveLastReachedStep`) czytają `state` bezpośrednio → przeliczają się na żywo.

**Poza scopem (Later):** edycja tekstu/atrybutów i usuwanie taska z RunDetails; „otwórz ponownie" (→ `pending`) z listy; `Skip` z listy (skip = pojęcie sesji, nie listy).

## Impact
- `ACTIONS.md`: 5 nowych akcji (`Reorder queue`, `Reset queue order`, `View run task list`, `Mark task done (from details)`, `Mark task not-relevant (from details)`).
- `GLOSSARY.md`: dodano termin `Lista zadań Runa` (`RunTaskList`).
- `run.md`: nowy flow „Praca z listą zadań", zaktualizowany ekran RunDetails (sekcja „Tasks"), nowe edge case'y.
- `focus.md`: zaktualizowany flow/ekran filtra (lista dopasowanych + reset).
- Cross-module: `run` → store tasków `decompose` (read + write) — **pierwszy zapis z `run`**; weryfikacja live-odświeżania statystyk po mutacjach.
- Otwarte (→ `edgecases`/`harden`): wpływ done/dismiss z listy na `lastReachedStep`/routing resume; empty-state listy; task bez atrybutów („untagged"); done/dismiss na już-w-tym-stanie; dismiss z listy (confirm vs undo).
