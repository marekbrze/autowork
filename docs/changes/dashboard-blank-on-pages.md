# Bug: Dashboard not visible on GitHub Pages (`/autowork/` shows a placeholder)

## Type
Bug (diagnosed by proto-bug)

## Severity
🔴 high — On the **live deployed site** (`https://marekbrze.github.io/autowork/`), the app's landing screen (Dashboard) is unreachable. Every visitor lands on a "module not built yet" placeholder. The primary flow is broken in production; only someone who knows the `/dashboard` deep link can reach it.

## Reproduction
1. Open the deployed site: `https://marekbrze.github.io/autowork/` (also reproducible locally at `http://localhost:4321/autowork/`).
2. The page renders the heading **"autowork"** and the copy **"Moduł `autowork` — ekrany do zbudowania w `proto-lofi`."** with a **"← Wróć do Dashboardu"** link.
3. No dashboard, no run cards, no "Continue / Start new" runway.

**Expected**: the entry URL shows the Dashboard (runway — dominant run card + Start new). See `docs/modules/dashboard.md` §Vision: *"User otwiera apkę i od razu widzi możliwość działania"*.
**Actual**: the entry URL renders `ModulePlaceholder` for `moduleName="autowork"`.
**Reliability**: every time, on every visit, dev and prod. Independent of data/state.
**Location**: routing decision in `src/App.tsx:18` (`<BrowserRouter>` with no `basename`) → the catch-all `src/App.tsx:40` `<Route path="/:moduleName" element={<ModulePlaceholder />} />` wins. Placeholder content: `src/shared/components/ModulePlaceholder.tsx:20-36`.

Verified against the app's own `react-router@7.18.0` `matchRoutes`:

| URL pathname (what `BrowserRouter` sees, basename defaults to `/`) | Matched route | Renders |
|---|---|---|
| `/autowork/`  ← the live entry | `/:moduleName` | `ModulePlaceholder` (moduleName = "autowork") |
| `/autowork` | `/:moduleName` | `ModulePlaceholder` |
| `/` | `index` | `DashboardView` ✓ |
| `/dashboard` | `/dashboard` | `DashboardView` ✓ |

## Root cause
**Class**: logic / config (deployment-aware router configuration missing)

**Cause**: `vite.config.ts:12` sets `base: '/autowork/'` so Vite builds and the dev server serve the app under the `/autowork/` prefix — correct and required for a GitHub *project* Pages site (`<user>.github.io/<repo>/`, repo = `marekbrze/autowork`). But the React Router at `src/App.tsx:18` is `<BrowserRouter>` with **no `basename`**, so its default basename is `/`. The router therefore matches against the full browser pathname. When the browser is at `/autowork/`, no route literally equals `/`, so the dynamic catch-all `/:moduleName` (`App.tsx:40`) matches with `moduleName = "autowork"` and renders the placeholder — instead of the `index` route (`DashboardView`). The deploy (ADR 0031) wired up the Vite `base` but never told the router about it; the two halves of "serve under /autowork/" were never joined.

**Evidence**:
- `vite.config.ts:12` — `base: '/autowork/'` (the prefix the app is served under).
- `src/App.tsx:18` — `<BrowserRouter>` with no `basename` (default `/`).
- `src/App.tsx:40` — `<Route path="/:moduleName" element={<ModulePlaceholder />} />` (the route that swallows `/autowork`).
- `src/App.tsx:22` — `<Route index element={<DashboardView />} />` (the route that *should* match, only resolves at `/`).
- No `basename` anywhere in the codebase (`grep -rn basename src/` → none).
- `matchRoutes` proof (table above): with `basename="/autowork"`, `/autowork/` strips to `/` and resolves to the `index` → `DashboardView`.

> Note on the `/autowork` URL itself: the segment in the address bar is **inherent** to a GitHub *project* Pages site and is not, by itself, the bug. This fix makes the app work *correctly under* `/autowork/`; it does not remove `/autowork` from the URL. Removing it requires a different deploy target (a `marekbrze.github.io` user/org repo, or a custom domain) — a separate decision, out of scope here.

## Fix plan
**Change**: give the router the same base prefix Vite uses. In `src/App.tsx:18`:

```tsx
// now:
<BrowserRouter>

// change to (recommended — auto-syncs with vite.config.ts `base`):
<BrowserRouter basename={import.meta.env.BASE_URL}>
```

`import.meta.env.BASE_URL` is Vite's `base` (`/autowork/` in dev and prod), so the router and the build can never drift. (Equivalent hardcoded alternative: `basename="/autowork"` — simpler but couples the source to the repo name.)

Because all 33 navigation call sites (`<Link>` ×19, `useNavigate` ×12, `<Navigate>` ×2) go through react-router, the `basename` is auto-prefixed: `to="/capture"` resolves to `/autowork/capture`, the `<Navigate to="/">` fallbacks resolve to `/autowork/`, etc. No call site needs to change.

**Spec impact**: none. The dashboard spec already treats `/` (the runway) as the landing screen; this restores that intent on the deployed path.

## Regression scope
- **Internal navigation (low risk)**: every `<Link to>`, `<Navigate to>`, `useNavigate(...)` is now prefixed by `basename`. Verify the cross-module flows still land correctly — most exposed: `Continue` from `DominantRunCard.tsx` / `DashboardView.tsx` (smart-routing to a funnel step), `← Wróć do Dashboardu` in `ModulePlaceholder.tsx:32`, the `/run` → `/` redirect at `App.tsx:25`. Expect all to resolve under `/autowork/...`.
- **No manual URL construction found**: the only `window.location` usages are `window.location.reload()` (`FocusView.tsx:353`, `DashboardView.tsx:61`, `ArchivedRuns.tsx:40`, `scenarios/loader.ts:20`, `RunStates.stories.tsx:21`) — basename-safe.
- **Storybook stories** that mount `<Routes>` with absolute paths (`ReviewRun.stories.tsx`, `RunDetails.stories.tsx`) run under Storybook's own router, not the production `BrowserRouter` — unaffected.
- **Deep-link refresh**: the `cp dist/index.html dist/404.html` step in `.github/workflows/deploy.yml:33` already supports refresh on client-side routes; with `basename` set, `/autowork/run/:id` will resolve correctly on a hard refresh too.
- **Dev parity**: `vite dev` serves at `/autowork/` (same as prod), so this also fixes the local dev entry — the dashboard is currently not visible at the dev URL either.

## Routing
| Step | Skill / action | Target | What |
|------|----------------|--------|------|
| 1 | (direct edit) | `src/App.tsx:18` | now: `<BrowserRouter>`; change to: `<BrowserRouter basename={import.meta.env.BASE_URL}>`; why: router must share Vite's `/autowork/` base so `/autowork/` resolves to the dashboard `index` route. |
| 2 | (verify) | `https://marekbrze.github.io/autowork/` | after redeploy: entry shows Dashboard; deep links (`/autowork/dashboard`, `/autowork/run/:id`) and hard-refresh still work. |
| 3 | (optional) | `.github/workflows/deploy.yml` / docs | no code change needed; optionally note in ADR 0031 that router `basename` is now derived from `import.meta.env.BASE_URL`. |

No `proto-harden` / `proto-polish` needed — this is a logic/config fix with no proto skill covering router configuration.

## Hand-off
Apply the one-line direct edit at `src/App.tsx:18` (`basename={import.meta.env.BASE_URL}`), then `npm run build` + push (the deploy workflow auto-publishes) and confirm the dashboard is the first thing visible at `https://marekbrze.github.io/autowork/`. Verify the `Continue` runway and one deep-link refresh before calling it done.
