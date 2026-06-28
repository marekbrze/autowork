# 0008 - Capture edge-case baseline
**Date**: 2026-06-28
**Module**: capture
**Status**: Accepted

## Context
Prototyp modułu `capture` (brain dump + ranking + parowanie) obsługiwał happy paths, ale nie był wystresowany pod kątem przypadków brzegowych. Moduł to wejście do apki (pierwszy kontakt z obietnicą „zdejmij ciężar decydowania"), więc luki w obsłudze stanów nie-happy najbardziej bolą. `proto-detail` zostawił systematyczny audyt na później — wykonuje go `proto-edgecases`.

## Decision
Przeprowadzono systematyczny stress-test (checklist kategorii: data states, forms, action outcomes, state transitions, loading, errors, navigation, cross-module/lifecycle, prototype-specific LocalStorage). Wynik w `docs/modules/capture-edgecases.md`. Znaleziono **15 luk**: 🔴 2 · 🟡 9 · 🟢 4.

Top priorytety (do wdrożenia przez `proto-harden`):
1. **Cicha utrata zapisu/odczytu LocalStorage** (quota/disabled + uszkodzony JSON) — `use-local-storage.ts` tylko `console.error`/fallback do `[]`; UI kłamie, że zapisało, albo bezgłośnie zeruje dane.
2. **Stresory nie scope'owane do Runa** — „Zacznij nowy Run" pokazuje dane poprzedniego przejazdu, brak resetu (moduł `run` niezaimplementowany).
3. **Utrata wpisanych danych** — draft ginie przy „Dalej"; undo niedostępne przez Ctrl+Z (wbrew ADR 0004), tylko 6-sekundowy toast.
4. **Ranking zablokowany na touch** (HTML5 DnD nie działa na mobilnych, brak przycisków ↑↓ na ekranie).

Największe źródło luk: warstwa persystencji LocalStorage (ciche awarie zapisu i parse) — to „backend" prototypu i jest tam najkruchsze.

## Impact
`proto-harden` wdraża priority list, potwierdzając/nadpisując każdą sugerowaną zachowaniowo decyzję z designerem. Po zmianach w prototypie uruchomić ponownie `proto-edgecases`, żeby odświeżyć baseline (nowy kod = nowe edge case'y).
