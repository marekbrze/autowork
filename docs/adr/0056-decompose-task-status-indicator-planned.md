# 0056 - Feature decompose task-status indicator planned
**Date**: 2026-07-02
**Status**: Accepted

## Context
A feature request on the living system: na ekranie **Next actions** (`decompose`, blok HOW) user chce widzieć, że task został już oznaczony `completed` (done) lub `dismissed` (irrelevant) — bo dziś każdy task renderuje się jako nagi bullet niezależnie od stanu. Wymagał impact scopingu przed implementacją.

## Decision
Zaplanowane w `docs/changes/decompose-task-status-indicator.md`.

- **Zasięg (potwierdzony z userem):** read-only (bez zmiany stanu z `decompose`); tylko `completed` + `dismissed`; licznik postępu `{resolved}/{total} done` przy next-actionie + de-emphasis next-actionu w pełni załatwionego.
- **Moduł:** rozszerza **tylko `decompose`**. `NextActionItem` **już dostaje pełne obiekty `Task` z `state`** — pole jest w danych, tylko się go nie wyświetla.
- **Nowy moduł:** nie.
- **Cross-module:** brak nowej integracji — czysty odczyt istniejącego pola (stan ustawiają `focus`/`run`; ten sam byt `Task`).
- **MVP:** 3 punkty; odłożone: akcje zmiany stanu z decompose, stany `skipped`/`active`, hi-fi (decompose jeszcze neutralny).
- **Routing:** `proto-detail decompose` (light) → **residual direct-edit w `NextActionItem.tsx`** (trzon) → `proto-edgecases` → `proto-harden` (głównie a11y); `proto-design`/`polish` odłożone do hi-fi decompose.
- **Residual:** 1 plik (`NextActionItem.tsx`) — znacznik stanu taska + licznik + de-emphasis.

Niskie ryzyko — cienki, read-only slice na jednym komponencie.

## Impact
`proto-detail`/`edgecases`/`harden` działają na planie; trzon implementuje residual edit. Constraint z DESIGN.md: `dismissed` neutralne (anti-ref „harsh red alarm"), jeden akcent. Re-run `proto-feature`, jeśli scope się zmieni (np. dodanie akcji zmiany stanu lub stanów skipped/active).
