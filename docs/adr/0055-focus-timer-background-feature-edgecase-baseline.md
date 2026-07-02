# 0055 - Focus timer background feature edge-case baseline

**Date**: 2026-07-02
**Module**: focus
**Status**: Accepted

## Context
Re-audit po wdrożeniu feature'u z ADR 0053/0054 (timer timestamp-based + Web Worker + Wake Lock + resync + czas w `document.title`). Moduł focus był już edge-cased + hardened dwukrotnie (oryginał: ADR 0018/0019; session-queue: re-audit 2026-07-01) — ten pass obejmuje **tylko nowe zachowania**.

## Decision
Audyt dołączony jako nowa sekcja w `docs/modules/focus-edgecases.md` („Re-audit: timer background keep-alive + tab title feature"). **6 luk**: 🔴 0 · 🟡 1 · 🟢 5. Top priorytet: **FT-1** — reset timera key'owany na wartość `initialElapsed` zamiast na tożsamość taska; w multi-tab tej samej sesji powoduje cofnięcie timera (flush z karty A → `storage` event → reset w B). Pozostałe: FT-2 (clamp na zmianę zegara), FT-3 (weryfikacja Workera po deploymencie), FT-4/FT-5 (udokumentowane ograniczenia best-effort/per-Run), FT-6 (affordance odroczony w planie).

## Impact
Feature jest robustny (brak 🔴, brak nowych stanów UI — fallbacki degradują po cichu). Realna zmiana to **FT-1/FT-2** (logika → residual direct-edit, nie klasyczny `proto-harden`). `proto-harden` opcjonalny/brak kluczowej roboty. Re-run `proto-edgecases` po FT-1, by odświeżyć baseline.
