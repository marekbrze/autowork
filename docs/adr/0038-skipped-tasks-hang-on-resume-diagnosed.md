# 0038 - Bug „Skipped tasks hang on Resume" diagnosed
**Date**: 2026-06-30
**Status**: Accepted

## Context
A bug report: po skipnięciu zadań i wyjściu z sesji, Resume pokazuje „3 of 3" — skipnięte taski „wiszą" (niedostępne / wyglądają na załatwione). Objaw utrzymuje się mimo fixu ADR 0034 (`2a0a7f7`), który sam w sekcji Impact przewidział *„resume-snapshot interaction with the restored-to-pending tasks"*.

## Decision
Diagnosed in `docs/changes/skipped-tasks-hang-on-resume.md`. Przyjęty model (user): **Resume bez zmian** (tam, gdzie przerwałeś; skips wracają przy świeżym Starcie). Root cause: **logic** — `exit()` wcześnie resetuje `skipped → pending` (`FocusView.tsx:290`) zamiast zostawić je odłożone do Startu (`:194`), tworząc `pending`-za-kursorem nieosiągalne na Resume i niespójne z nawigacją-na-Dashboard; + wskaźnik pozycji „3 of 3" (`:399`) myli, licząc odłożone-behind jako załatwione. Severity: 🟡 medium. Routes to **direct-edit** (2 edycje: usuń wczesny reset `:290`; wskaźnik „deferred" `:399` + `FocusTaskScreen`) + opcjonalnie `proto-polish` (copy) / `proto-edgecases` (lifecycle skip × Resume). Regression sites: `clearCompleted`/`onNewSession` (`:327`, `:429`), `attributed` (`:78-90`), `start` (`:194`).

## Impact
Fix implementowany z change-doc. Re-run proto-bug jeśli fix odkryje głębszą przyczynę.
