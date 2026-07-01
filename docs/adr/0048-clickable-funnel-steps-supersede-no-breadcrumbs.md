# [0048] - Clickable funnel steps (supersede "no breadcrumbs")
**Date**: 2026-07-01
**Module**: run
**Status**: Accepted
**Supersedes**: 0001 (zapis „Bez breadcrumbs")

## Context
Podczas `proto-detail` modułu `run` (feature `clickable-run-steps-and-details-actions-on-top`, plan ADR 0047) user potwierdził, że kroki lejka już wyświetlane na ekranach funnel (`FunnelStepper`) mają być po prostu klikalne — swobodna nawigacja po krokach aktywnego Runa. Odwraca to przyjętą w ADR 0001 / UI-STRATEGY decyzję „prowadzony lejek bez breadcrumbs / kroki nie są wolnymi linkami".

## Decision
`FunnelStepper` staje się klikalną nawigacją: wszystkie 5 kroków = linki do `STEP_ROUTE` aktywnego Runa; bieżący krok = też link (klik = no-op); wyjście z aktywnej sesji focus → ConfirmDialog (confirm = pauza + persyst `focus:session` snapshot, wznawialny przez `SessionResumeBanner`; cancel = zostajemy). Skok **nie aktualizuje `lastReachedStep`** (Continue nadal wyprowadzany z danych lejka, nie z ostatniego skoku). Lockowanie przyszłych kroków odłożone (Later). Dwie decyzje potwierdzone wprost z userem: (1) bieżący krok = też link (no-op); (2) wyjście z aktywnej sesji = ConfirmDialog (nie ciche pauzowanie).

## Impact
`UI-STRATEGY.md`: flip „Breadcrumbs: Nie" → „Tak" + aktualizacja notki o strukturze nawigacji. `ACTIONS.md`: +akcja „Navigate to funnel step". `GLOSSARY.md`: +termin `FunnelStepper`. `docs/modules/run.md`: nowy flow „Nawigacja po krokach Runa (klikalny stepper)", zaktualizowany flow/screen „View Details" (akcje nad listą), +akcja w tabeli, +edge cases. Implementują: residual direct-edits (`FunnelStepper.tsx` spans→Links, `RunDetails.tsx` reorder) → `proto-edgecases run` (skoki do kroków z niespełnionymi warunkami, spójność po reorderze) → `proto-harden run` → `proto-design/polish run`. Zapis „Bez breadcrumbs" z ADR 0001 — superseded.
