# 0031 - Deploy to GitHub Pages

**Date**: 2026-06-29
**Status**: Accepted

## Context

The dashboard prototype is functionally complete (lo-fi built, edge cases hardened, states
implemented per ADR 0030) and needs a public, shareable URL for users. GitHub Pages is the
natural target: free hosting for static builds, auto-deploy on push via GitHub Actions.

The repo lives at `marekbrze/autowork` (project pages, not user pages), so the app is served
from `https://marekbrze.github.io/autowork/` — a sub-path, not the domain root.

## Decision

Deploy via a modern GitHub Actions workflow (`actions/deploy-pages@v5`) to GitHub Pages at
**https://marekbrze.github.io/autowork/**. Every push to `main` triggers a redeploy.

Concretely:

- **Vite `base`** set to `/autowork/` so built asset URLs match the sub-path Pages serves from.
- **SPA refresh support**: `dist/index.html` is copied to `dist/404.html` in CI, so deep-link
  refreshes resolve client-side instead of 404'ing.
- **Production scenario locked to `empty`** in `src/scenarios/loader.ts` — first-time visitors
  (fresh browser, empty localStorage) and developers visiting from a tainted browser both see
  the clean onboarding state. The DevToolbar (which hosts the scenario picker) already returns
  `null` under `import.meta.env.PROD`, so it never ships to end users.
- **Reproducible CI**: `npm ci` requires a committed lockfile, so `package-lock.json` was
  un-ignored and tracked. The repo was flipped to **public** (private Pages requires a paid plan).
- **Manual fallback**: a `deploy:manual` script (`npm run build && gh-pages -d dist`) pushes
  `dist/` to a `gh-pages` branch, usable if the workflow is ever disabled (requires switching the
  Pages source to "Deploy from a branch" → `gh-pages`).

## Impact

- Pushing to `main` redeploys automatically (~1–2 min). No manual deploy needed in the normal case.
- End users see the locked `empty` scenario — no dev toolbar, no scenario picker, no leaked dev data.
- A custom domain (CNAME) is out of scope for this ADR; if set later, `base` should revert to `/`.
