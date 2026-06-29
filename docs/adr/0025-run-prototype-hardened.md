# 0025 - run prototype hardened

**Date**: 2026-06-29
**Module**: run
**Status**: Accepted

## Context
Prototyp `run` obsługiwał happy paths, ale audyt `proto-edgecases` (`docs/modules/run-edgecases.md`, ADR 0024) znalazł 16 luk (🔴 0 · 🟡 9 · 🟢 7). Największa grupa — CM-1/2/3 (statystyki / `lastReachedStep` / review-items spięte z realnymi danymi lejka) — to **cross-module feature work** (wymaga `runId` na stresorach/taskach + partycji danych we wszystkich krokach lejka + scenariuszach), poza zakresem harden.

## Decision
Decyzja designu: **oznaczyć statystyki jako poglądowe + odłożyć realne spięcie** (CM-1/2/3 → ❌, faza integracji Runa / moduł `dashboard`). Dyskretny caption „Statystyki poglądowe…" na `RunStatTiles`. Reszta hardenu — lokalne stany na istniejących ekranach (6 wdrożonych):
- **LE-1** — stan błędu odczytu storage (`RunReadError`) zamiast mylnego empty-state na listach (`RunsList`, `ArchivedRuns`).
- **FI-1 / DS-2** — walidacja rename (disabled „Zapisz" + `aria-invalid` + komunikat) + `maxLength` 60 + `truncate` tytułu karty.
- **ST-1** — ukończony Run → sekcja celebracji + CTA „Archiwizuj" (`RunCompleted`).
- **AO-2** — `ConfirmDialog` na „Usuń przeterminowane" w Review.
- **AO-3** — honest persistence: dialog usuwania zamyka się tylko po udanym zapisie.

Odłożone (❌, z racją): CM-1/2/3 (cross-module), FI-2 (rename niedestrukcyjny), AO-1 (implicit feedback wystarcza), DS-1/DS-3/DS-4/LE-2/NF-1 (polish / świadome kompromisy). Każda luka ma status + `file:line` w `run-edgecases.md → Resolution`.

## Impact
Prototyp `run` obsługuje teraz świadomie każdą ścieżkę (pomyślną i błędną): błędy odczytu, walidację rename, potwierdzenia destrukcyjne, stan ukończenia. Happy path niezmieniony. Największa usunięta fragmentaryczność: mylny empty-state przy uszkodzonym `run:runs` → jasny stan błędu z naprawą. CM-1/2/3 pozostają otwartą decyzją architektoniczną na fazę integracji Runa. Oprawa wizualna / celebracja to przyszły `proto-design`.
