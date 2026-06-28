# 0009 - Capture prototype hardened
**Date**: 2026-06-28
**Module**: capture
**Status**: Accepted

## Context
Prototyp `capture` obsługiwał happy paths, ale `proto-edgecases` (ADR 0008) znalazł 15 nieobsłużonych przypadków brzegowych — najpoważniejszą była **cicha utrata danych w warstwie LocalStorage** (zapis udawał się w UI, a po refresh znikał; uszkodzony odczyt zerował listę bez słowa). `proto-harden` wdraża stany, nie zmieniając happy pathu.

## Decision
Wdrożono **12/15** stanów brzegowych (priority order z `docs/modules/capture-edgecases.md`):

1. **Persystencja (blokery danych)** — `useLocalStorage` teraz „uczciwa": przy nieudanym zapisie NIE aktualizuje stanu (UI zawsze odzwierciedla to, co zapisane), raportuje `writeError` z retry ostatniej failed wartości; uszkodzony odczyt raportuje `readError` zamiast cichego fallback do `[]`. Powierzchnia: toast `StorageStatusToast` (toast z retry — decyzja designu, nie banner). Dodatkowo: synchronizacja multi-tab (zdarzenie `storage`) i fallback `generateId` dla secure-context.
2. **Usuwanie/undo** — globalny `Ctrl/Cmd+Z` (z godem na pola tekstowe), **stos undo** (kilka szybkich usunięć all cofnalnych, `UndoToast`), edycja-do-pustego **anuluje** zamiast usuwać.
3. **Parowanie** — licznik postępu (Pytanie N, Stresor X z Y; naprawia off-by-one „Pytanie 0") + potwierdzenie przerwania mid-sequence.
4. **Ranking na touch** — jawne przyciski ↑/↓ na wierszu (drag i strzałki na focuście pozostają); wiersz przepisany z `role="button"` na `role="listitem"`, żeby uniknąć zagnieżdżonych kontrolek (a11y).
5. **Polish** — polska pluralizacja (`pluralize`), `maxLength` 300 na polach.

**Odroczono (3)**: scope'owanie stresorów do aktywnego Runa (#3 — wymaga modułu `run`, cross-module feature); draft w polu przy „Dalej" (#5 — designer wybrał odrzucenie); wirtualizacja długiej listy (#15 — polish, akceptowalne). Focus-trap w modalu parowania pozostaje (niski priorytet a11y). Loading/in-flight (skeletons/spinners) N/A — persystencja synchroniczna.

Decyzje designu (AskUserQuestion): błąd zapisu → **toast z retry** (nie banner); draft przy „Dalej" → **odrzuć** (zachowanie bez zmian).

Nie dodano frameworków/bibliotek — stany w istniejących komponentach (`@base-ui/react` + Tailwind), w stylu istniejących hand-built overlayów (modal PairingFlow, toast undo).

## Impact
Każdy flow `capture` obsługuje teraz świadomie też ścieżki błędne, nie tylko happy path; happy path bez zmian. Największa usunięta kruchość: **cicha utrata danych w LocalStorage**. Nowe stany mają story w Storybooku (`Capture/StorageStatusToast`, `Capture/UndoToast`, `Capture/PairingFlow` z fazami). Po zmianach w prototypie uruchomić ponownie `proto-edgecases`, żeby odświeżyć baseline. Wizualny polish to oddzielny przyszły `proto-design`.
