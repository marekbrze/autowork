# 0058 - Decompose task-status display edge-case baseline
**Date**: 2026-07-02
**Module**: decompose
**Status**: Accepted

## Context
`proto-feature` (ADR 0056) i `proto-detail` (ADR 0057) zaplanowały cienki, read-only slice na `decompose`: pokazywać stan taska (`completed`/`dismissed`) + licznik postępu + de-emphasis resolved next-actionu. Przed implementacją (residual edit w `NextActionItem.tsx`) przeprowadzono feature-focused stress-test nowych zachowań. Reszta modułu była już zaudytowana/zahardowana (`decompose-edgecases.md`, ADR 0010/0011) — nie powtórzono.

## Decision
Zdiagnozowano w `docs/modules/decompose-task-status-edgecases.md`. **11** wyników: 🔴 0 · 🟡 4 · 🟢 7. Największe źródło kruchości: **interakcja z istniejącym `DecomposeModal`** — modal operuje na samych tekstach i nie wie o stanie taska, więc edycja tekstu done tasku po cichu cofa go do `pending` (#1).

Top priorytety dla `proto-harden` (wdrożyć razem z residual edit):
- #1 — `DecomposeModal` świadomy stanu (pokaż ✓/⊘ przy kroku albo ostrzeż przy edycji załatwionego).
- #3 — a11y: done/irrelevant + resolved next-action przekazane do AT (glyph+tekst + aria).
- #4 — defensive default→neutral dla brakującego `state` (`migrate.ts` nie backfilluje `state`).
- #2 — potwierdzić wording licznika (default „X/N done", parity z `Run.progress`).

## Impact
Brak 🔴 — feature read-only, bez utraty danych / dead-endów / blokerów. `proto-harden` wdroży #1/#3/#4 razem z residual edit w `src/modules/decompose/components/NextActionItem.tsx` (+ ew. `DecomposeModal.tsx` dla #1) i doda story (resolved next-action, mix stanów, dismissed-only, task bez `state`). Po implementacji uruchomić ponownie `proto-edgecases`, żeby odświeżyć baseline.
