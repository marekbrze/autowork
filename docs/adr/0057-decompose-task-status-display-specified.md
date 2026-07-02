# 0057 - Specify decompose task-status display (done / irrelevant)
**Date**: 2026-07-02
**Module**: decompose
**Status**: Accepted

## Context
`proto-feature` zaplanował cienki, read-only slice na `decompose` (plan: `docs/changes/decompose-task-status-indicator.md`, ADR 0056): pokazywać na ekranie Next actions, że task jest już `completed` (done) lub `dismissed` (irrelevant). `proto-feature` scopał *co* (read-only; tylko completed+dismissed; licznik + de-emphasis), ale zostawił `proto-detail` precyzyjną semantykę wyświetlania, którą zbuduje `proto-lofi`/`proto-harden`/`proto-design`.

## Decision
Zespecyfikowano w `docs/modules/decompose.md` (update istniejącego speca) + dwa terminy w `docs/GLOSSARY.md`. Semantyka:

- **Per-task** (`TaskStatusIndicator`): `completed` → glyph ✓; `dismissed` → glyph ⊘ (`Ban`) + etykieta „not relevant", muted. **Neutralnie — irrelevant NIE na czerwono** (DESIGN.md anti-ref „harsh red alarm"). Stany `skipped`/`active` w MVP niewidoczne (render neutralnie).
- **Per-next-action licznik**: `X/N done` (done = `completed` + `dismissed`, spójnie z `Run.progress`), pokazywany gdy ≥1 task załatwiony; przy 0 tasków — „to break down".
- **`ResolvedNextAction`** (wszystkie taski załatwione): strike-through + muted (de-emphasis), ale **nadal w pełni edytowalny** (edycja / rozbicie / usuwanie). Read-only dotyczy **stanu** tasków, nie CRUD next-actionu.
- **a11y**: stan przez glyph + tekst (`aria-label`), nie tylko kolor/przekreślenie.
- **Edge** (zdiagnozowane w specu, do wdrożenia w `proto-harden`): next-action bez tasków, mix stanów, ponowne rozbicie z done taskami (diff-po-tekście zachowuje `state`), stary task bez `state` → neutralnie.

Trzy wizualne mikro-decyzje wybrane jako zalecane (user AFK przy potwierdzeniu; do reopeningu jeśli się nie zgadza): dismissed = glyph+tag, resolved = strike+muted, licznik = „X/N done".

## Impact
`docs/modules/decompose.md` zaktualizowany (Vision, Screens, Actions, Edge Cases, Integration Points). `docs/GLOSSARY.md` +`TaskStatusIndicator`, +`ResolvedNextAction`. Następny krok: residual direct-edit w `src/modules/decompose/components/NextActionItem.tsx` (wg planu ADR 0056) → `proto-edgecases` → `proto-harden`. Bez zmian w `ACTIONS.md` (brak nowej akcji — read-only) i `ENTITY_MAP.md` (`Task.state` już istnieje).
