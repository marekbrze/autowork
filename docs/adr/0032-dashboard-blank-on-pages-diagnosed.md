# 0032 - Dashboard blank on GitHub Pages diagnosed
**Date**: 2026-06-29
**Status**: Accepted

## Context
A bug report: on the live GitHub Pages site (`https://marekbrze.github.io/autowork/`) the Dashboard is not visible — visitors land on a "module not built" placeholder, and the `/autowork` path reads as "weird". Needed root-cause diagnosis before fixing.

## Decision
Diagnosed in `docs/changes/dashboard-blank-on-pages.md`. Root cause: **logic/config** — `vite.config.ts` ships the app under `base: '/autowork/'` (correct for a project-Pages site), but the router at `src/App.tsx:18` is `<BrowserRouter>` with **no `basename`**, so the entry pathname `/autowork/` matches the catch-all `/:moduleName` route (`App.tsx:40`) and renders `ModulePlaceholder` instead of the dashboard `index` route. Confirmed against the app's own `react-router@7.18.0` `matchRoutes`. Severity 🔴 high (primary flow broken in production).

Fix: `<BrowserRouter basename={import.meta.env.BASE_URL}>` (router and build share the same base, no drift). Low regression risk — all 33 nav call sites go through react-router, which auto-prefixes `basename`.

A secondary, separate concern — switching the UI from Polish to English (incl. the mislabeled `lang="pl"`) — is recorded in `docs/changes/ui-language-polish-to-english.md`; it is a direction change, not a bug, and routes to a `proto-polish` copy pass.

## Impact
The one-line router fix is applied directly (not via a proto skill). After redeploy, the Dashboard is the first screen at `/autowork/` and deep links + hard refreshes resolve correctly. Re-run proto-bug if the fix reveals a deeper cause.
