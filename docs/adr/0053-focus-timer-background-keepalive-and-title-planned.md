# 0053 - Focus timer background keep-alive + tab title planned

**Date**: 2026-07-02
**Module**: focus
**Status**: Accepted

## Context
Feature request na żywym systemie: (1) title karty ma pokazywać live elapsed timera sesji focus; (2) timer w Edge'u przestaje odliczać, gdy karta jest w tle (throttling/usypianie `setInterval` głównego wątku). Root cause: `use-focus-timer.ts` liczy **tickami** (`prev + 1`), nie czasem — więc utracone ticki w tle = trwały dryft. Wymagano skanowania wpływu przed implementacją.

## Decision
Zaplanowane w `docs/changes/focus-timer-background-keepalive-and-tab-title.md`. Dotyka **tylko modułu `focus`**; brak nowego modułu, brak nowych encji/pól (zmiana mechaniczna `Timer`, nie modelowa). MVP: title = `${clock} · [state] — Autowork`; timer **timestamp-based** (zawsze poprawny po powrocie) + **live tick w tle** (Web Worker) + Wake Lock (ekran aktywny gdy widoczny) + resync na `visibilitychange`. 3 pozycje odłożone (Later).

Routing: **głównie residual direct-edit** (przepisanie `use-focus-timer.ts` na timestamp + nowy Worker + Wake Lock + hook title) — klasyczny lejek `lofi`/`harden`/`design` się nie aplikuje, bo feature nie dodaje ekranów ani powierzchni wizualnych. Wspierająco: `proto-detail focus` (spec delty + shared-doc notki) → residual → `proto-edgecases focus` → ew. `proto-harden focus`. 5 residual direct-edits (file:line w change doc).

## Impact
`proto-detail` wpisuje notki do ENTITY_MAP/ACTIONS/GLOSSARY + nowy edge case w `focus.md`. Residual buduje mechanizm w `src/modules/focus/`. `proto-edgecases`/`proto-harden` weryfikują robustność tła/widoczności. DESIGN.md nietknięty (brak on-screen zmiany). Re-run `proto-feature`, jeśli scope się zmieni.
