# 0054 - Focus timer background behavior + tab title specified

**Date**: 2026-07-02
**Module**: focus
**Status**: Accepted

## Context
Detailing pass (`proto-detail focus`) dla feature'u z ADR 0053 (timer żywy w tle + czas w title karty). Trzeba ująć nowe zachowania w specu modułu i shared docs, by implementacja (residual direct-edits) miała pisemne odniesienie. Decyzje produktowe (live tick w tle, title = czas + nazwa appa) padły w `proto-feature`; w tym skillu potwierdzono dodatkowo suffix `· over` w title.

## Decision
Zespecyfikowano delty feature'u:
- `docs/modules/focus.md` — Vision (timer działa w tle, zawsze poprawny; czas w title karty), notka w akcjach Timera, nowy Edge case „Karta w tle / uśpiona karta (Edge Sleeping Tabs)".
- `docs/ENTITY_MAP.md` — encja `Timer`: dopisek o mechanizmie timestamp-based + poprawność w tle + Web Worker / Wake Lock / title.
- `docs/ACTIONS.md` — nowa akcja systemowa Timera „(stays accurate in background)".
- `docs/GLOSSARY.md` — rozszerzona definicja `Timer` (tło, title, Wake Lock, Web Worker).

Title format: `12:34 — Autowork` (+ `· paused` w pauzie, + `· over` po przekroczeniu oszacowania — `· over` potwierdzone z userem).

## Impact
Spec modułu + shared docs odzwierciedlają feature przed implementacją. Implementacja (residual: przepisanie `use-focus-timer.ts` na timestamp + nowy Worker + Wake Lock + hook title) realizuje to, co tu zapisano. Następnie `proto-edgecases focus` diagnozuje przypadki brzegowe tła/widoczności, a `proto-harden` weryfikuje robustność.
