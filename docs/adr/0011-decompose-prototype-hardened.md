# 0011 - Decompose prototype hardened
**Date**: 2026-06-28
**Module**: decompose
**Status**: Accepted

## Context
Prototyp `decompose` obsługiwał happy paths (WHY opcjonalny, HOW z gatingiem ≥1 next-action, skip rozbicia = 1 task, safety-net materializacji gołych next-actionów), ale `proto-edgecases` (ADR 0010) znalazł 14 nieobsłużonych przypadków brzegowych — najpoważniejsze to **cicha utrata danych w warstwie LocalStorage**: cztery store'y `decompose` (`reasons`, `nextActions`, `tasks`, `doneVisions`) wyrzucały status persystencji z `useLocalStorage`, więc nieudany zapis znikał bez śladu, a uszkodzony odczyt fallbackował do pustej listy po cichu. `proto-harden` wdraża stany, nie zmieniając happy pathu.

## Decision
Wdrożono **8/14** stanów brzegowych (priority order z `docs/modules/decompose-edgecases.md`):

1. **Persystencja (blokery danych)** — cztery hooki `decompose` (`use-tasks`, `use-reasons`, `use-next-actions`, `use-done-visions`) wystawiają teraz `storage` (status z `useLocalStorage`); `DecomposeView` renderuje wspólny `StorageStatusToast` (`writeError` z retry + `readError`), łącząc status czterech store'ów w jeden. `StorageStatusToast` uogólniony o `entityLabel` (współdzielony z `capture`, ADR 0009).
2. **Usuwanie — dialog potwierdzenia** (decyzja designu: potwierdzenie, **nie** undo — odmiennie niż `capture`/ADR 0004). Hand-built `ConfirmDialog` (AlertDialog-style, w stylu `DecomposeModal`) gate'uje delete next-action (z kaskadą tasków) i delete reason.
3. **Edycja-do-pustego = anuluj** — `NextActionItem.commit` przy pustym drafcie zostawia oryginał (nie usuwa po cichu; wzór capture #8).
4. **Zachowanie identyczności tasków** — `replaceTasksForNextAction` robi diff po tekście zamiast pełnego replace'u, zachowując ID tasków (a z nimi przyszłe atrybuty z `process`/`focus`); obserwacyjnie neutralne dziś (decompose-edgecases #7).
5. **Polish / a11y** — `maxLength` na polach (300 / 600 na textarea wizji), redukcja A/B „tablist" do przełącznika segmentowego (`role="group"` + `aria-pressed`), re-sync lokalnego draftu wizji międzykartowo w `WhyBlock`; initial focus + Escape w modalach.

**Odroczono (3)**: draft i aktywny indeks przy wyjściu (#5 — spójnie z decyzją designu `capture`: odrzuć; dane przetrwają); kaskada orphans przy usuwaniu stressora (#6 — wymaga modułu `run`, lazy-cleanup ryzykowne przy `readError` stressora); wirtualizacja długiej listy (#12 — polish, akceptowalne). **By-design bez zmian (2)**: duplikaty (#11), aktywny język jako nudge nie bramka (#14, ADR 0006). Backdrop-click-close modali świadomie pominięte — konwencja w projekcie (`PairingFlow` tego nie robi); focus-trap odroczony (spójnie z `capture`).

Decyzje designu (AskUserQuestion): scope → cały moduł; usuwanie → **dialog potwierdzenia** (nie undo).

Nie dodano frameworków/bibliotek — stany w istniejących komponentach (`@base-ui/react` + Tailwind), w stylu istniejących hand-built overlayów (`DecomposeModal`, `PairingFlow`). Persystencja synchroniczna → skeletony/in-flight N/A (jak w `capture`).

## Impact
Każdy flow `decompose` obsługuje teraz świadomie też ścieżki błędne; happy path bez zmian. Największa usunięta kruchość: **cicha utrata danych w LocalStorage** — tożsame z tym, co `capture` usunęło w ADR 0009. Nowe stany mają story w Storybooku (`Decompose/ConfirmDialog`, `Decompose/StorageStatusToast`). Po zmianach uruchomić ponownie `proto-edgecases`, żeby odświeżyć baseline. Wizualny polish to oddzielny przyszły `proto-design`.
