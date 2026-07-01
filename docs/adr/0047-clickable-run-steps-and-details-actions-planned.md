# [0047] - Feature: clickable funnel steps + Run Details actions on top — planned
**Date**: 2026-07-01
**Status**: Accepted
**Supersedes**: 0001 (częściowo — zapis „Bez breadcrumbs")

## Context
Feature request na żywym systemie: (1) user chce nawigować po krokach Runa (Stresory › Ranking › Akcje › Procesowanie › Focus) klikając w już-wyświetlany `FunnelStepper` (dziś poglądowy), oraz (2) przenieść wszystkie akcje na `/run/:runId` nad listę tasków (dziś scroll na dno). Oba wymiary dotykają modułu `run` + shared `FunnelStepper`. Wymagały scoping'u przed implementacją — zwłaszcza że część 1 **odwraca** przyjętą decyzję „prowadzonego lejka bez breadcrumbs" (ADR 0001, UI-STRATEGY.md).

## Decision
Zaplanowane w `docs/changes/clickable-run-steps-and-details-actions-on-top.md`. Dotyka modułu `run` (model kroków + `RunDetails` IA) oraz shared `FunnelStepper`. **New module: nie.** MVP: wszystkie kroki klikalne (bez lockowania) + wszystkie akcje nad listą. **Supersede** zapisu „Bez breadcrumbs" z ADR 0001 / UI-STRATEGY — lejek staje się swobodnie nawigowalny w obrębie aktywnego Runa (user wprost: „kroki już istnieją i są wyświetlane — mają być po prostu klikalne"). 4 pozycje odłożone (lockowanie kroków, stepper na details, sticky action bar, stepper w shellu). Routing: `proto-detail run` → residual direct-edits (`FunnelStepper.tsx`, `RunDetails.tsx`) → `proto-edgecases run` → `proto-harden run` (warunkowo) → `proto-design/polish run`. 2 residual direct-edity.

## Impact
`proto-detail` zapisuje spec + shared-doc (UI-STRATEGY flip, ACTIONS +navigate, GLOSSARY opc.) i rejestruje ten ADR. Residual edity czynią stepper klikalnym (spans→Links + per-stage route) i przenoszą akcje nad listę. `proto-edgecases`/`harden` pokrywają skoki do kroków z niespełnionymi warunkami wstępnymi. `proto-design/polish` nadają affordance i hierarchię akcji. Re-run `proto-feature` jeśli scope się zmieni (np. lockowanie, stepper na details).
