# [0049] - Run clickable-steps feature edge-case baseline
**Date**: 2026-07-01
**Module**: run
**Status**: Accepted

## Context
Feature `clickable-run-steps-and-details-actions-on-top` (ADR 0047/0048) został zbudowany (residual direct-edits, commit `5ed168a`): klikalny `FunnelStepper`, guard wyjścia z aktywnej sesji focus (ConfirmDialog), reorder akcji nad listą na `RunDetails`. Moduł `run` był już audytowany (bazowy ADR 0024 + per-run-isolation ADR 0046) — ten audit dotyczy **tylko** nowych przypadków wprowadzonych przez feature, głównie „skok do kroku z niespełnionymi warunkami" (ekrany lejka dawniej osiągalne tylko z guidowanego flow, teraz bezpośrednio).

## Decision
Audyt do `docs/modules/run-edgecases.md` (sekcja „Feature audit: clickable funnel steps…", kody `CS-*`). **6** nowych luk: 🔴 0 · 🟡 2 · 🟢 4. Pozytywny wynik: wszystkie 5 ekranów lejka degraduje do empty-state'a/CTA przy skoku z pustym lejkiem — brak blank-screenów i dead-endów. Top priorytety: **CS-2** (klikalne „przyszłe" kroki wyglądają na disabled — affordance, → design/polish) i **CS-1** (guard sesji tylko na stepperze, back/reload nie pytają — niespójność, → harden/kompromis).

## Impact
`proto-harden` ma tu niewiele: decyzja CS-1 (akcept vs rozszerzenie guardu) + drobny CS-3 (dobić guard na `currentTask`). Większość trafia do `proto-design`/`proto-polish` (affordance CS-2, copy CS-4, degenerowany stan CS-5, a11y CS-6). Brak luk wymagających `proto-lofi` — feature funkcjonalnie kompletny. Odświeżyć ten baseline, jeśli feature się zmieni (np. lockowanie kroków, stepper na Szczegółach).
