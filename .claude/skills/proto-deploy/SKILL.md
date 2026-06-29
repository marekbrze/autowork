---
name: proto-deploy
description: >
  Prepare a working proto project for public deployment to GitHub Pages — configure Vite's
  `base` path from the detected repo, ensure the production build ships with a clean empty
  state (DevToolbar hidden, no scenario picker, no stale dev data leaking to end users),
  add a modern GitHub Actions workflow (actions/deploy-pages@v5) that auto-deploys on push,
  enable Pages programmatically via `gh api`, set the live URL in the repo's About panel,
  and document a manual `gh-pages` CLI fallback for branch-based deploys. Detects package
  manager from the lockfile and Pages type (user/org vs project) from `git remote`. Use
  after the project is functionally complete and `npm run build` succeeds. This skill
  WRITES code: vite.config, .github/workflows/deploy.yml, package.json scripts, optionally
  DevToolbar/loader gates. Triggers on: "deploy to github pages", "ship to pages", "publish
  prototype", "prepare deploy", "github pages", "deploy", "opublikuj", "deploy na pages",
  "shipnij na pages", "wrzuć na github pages", "publish prototype". For local dev setup use
  proto-devsetup instead — this skill assumes the project already runs and builds.
---

You are a developer shipping a working proto prototype to a public URL the user can share. The hardening is done (`proto-harden`), the polish pass is complete (`proto-polish`), and `npm run build` succeeds. Your job: take the project from "builds locally" to "live at `https://USER.github.io/REPO/`" — with a clean end-user experience (no dev chrome, no scenario picker, no developer's localStorage leaking through) and a deploy pipeline that re-runs itself on every push.

You reason from the deploy's two hard requirements: (1) **the URL works** — Vite's `base` matches the path GitHub Pages serves from, assets load, deep links survive a refresh; (2) **the public sees the right thing** — DevToolbar and the scenario picker are production-gated, the app starts in the empty scenario for first-time visitors. Everything else is convenience (auto-enable Pages, set homepage URL, manual fallback).

## Git checkpoint

Every proto skill keeps the project's git history clean so each stage is its own rollback-able checkpoint — you can `git reset` / `git checkout` back to any skill's state. Commits land **on the current branch only**: never push, never create branches, never rewrite history or force-push. The user controls pushing.

### Before your own work — checkpoint pending changes

Do this **first**, before reading prerequisites or touching anything, so this skill's commit only contains this skill's work:

1. In a git repo? `git rev-parse --is-inside-work-tree` — if it errors, the project isn't a repo; skip the checkpoint and tell the user.
2. Anything pending? `git status --porcelain` — empty means nothing to checkpoint; continue.
3. **Stop and ask the user** if there's an unfinished merge/rebase/cherry-pick, unresolved conflicts, or staged changes you didn't make — never commit someone else's half-finished state.
4. **Don't commit generated junk**: if `node_modules/`, `dist/`, `build/`, `.next/`, `.turbo/`, or other build output would be staged, stop and tell the user to add a `.gitignore` first.
5. Stage and commit the pending work: `git add -A && git commit -m "chore(proto): checkpoint before deploy"`.
6. Tell the user what you checkpointed (one line + file count).

### After your work — commit this skill's checkpoint

When you finish the skill, before the handoff:

1. `git status --porcelain` — empty means nothing changed; skip.
2. `git add -A && git commit -m "proto-deploy: configure github pages deploy"` — or include the module/scope if obvious, e.g. `proto-deploy(recipe-sharing): configure github pages`.
3. Tell the user the commit hash and what's in it.

The two commits are separate on purpose: the first locks in whatever came before; the second locks in this skill's work.

## Prerequisites

Read before starting:

- `package.json` — confirm a `build` script exists and the project is Vite (look for `vite` in `devDependencies`). If it's not Vite, stop — this skill is Vite-scoped; tell the user to use a generic Pages deploy skill instead.
- `vite.config.ts` / `vite.config.js` / `vite.config.mjs` — read it; you'll be adding `base`.
- `src/shared/components/DevToolbar.tsx` — must exist (from `proto-devsetup` template). If it doesn't, the project wasn't set up with the template — stop and tell the user.
- `src/scenarios/loader.ts` — must exist (from template). Same constraint.
- `docs/MODULES.md` — context for what's being deployed.

**Git remote** — `git remote get-url origin` must return a GitHub URL. If there's no remote or it's not GitHub, stop and tell the user to add a GitHub remote first (`git remote add origin git@github.com:USER/REPO.git`).

**Package manager** — detect from the lockfile at the project root: `package-lock.json` → npm, `pnpm-lock.yaml` → pnpm, `bun.lockb` / `bun.lock` → bun, `deno.lock` → deno. If none, default to npm and tell the user. Use this PM for every install / script invocation in the skill.

**`gh` CLI** — the auto-enable and homepage-URL steps require GitHub CLI installed and authenticated. Check with `gh auth status`. If it's missing or not authenticated, skip those steps and tell the user to do them manually in GitHub Settings (the workflow still works without `gh`).

**Build must pass** — run the build once up front: `npm run build` (or detected PM). If it fails, stop. Deploying a broken build wastes everyone's time.

## Decisions — ask the designer (one at a time)

**Production scenario** — "Który scenariusz danych ma się ładować dla userów na Pages? (empty / minimal / full)". Default `empty`. Empty is the right default for a deploy aimed at first-time users — it shows the onboarding/empty state. Lock this choice in code (Step 4).
**Branch** — "Na jaki branch ma reagować workflow? (default: main)". Default `main`. Use whatever the user's default branch is (`git symbolic-ref refs/remotes/origin/HEAD --short 2>/dev/null | sed 's@^origin/@@'` if uncertain, else ask).

Don't ask about the URL path, repo name, or base — those are detected, not chosen. Don't ask about per-step choices (which workflow action versions, whether to enable Pages) — those are decided by the standard.

## Step 1: Detect repo, Pages type, and base path

Run `git remote get-url origin`. Parse the owner/repo from either form:

- SSH: `git@github.com:OWNER/REPO.git`
- HTTPS: `https://github.com/OWNER/REPO.git`

Strip the trailing `.git`. **Pages type** is decided by the repo name:

- **User/org pages** — repo name is `OWNER.github.io` (or `*.github.io`). Base path: `/`. Final URL: `https://OWNER.github.io/`.
- **Project pages** — repo name is anything else. Base path: `/REPO/` (note the trailing slash). Final URL: `https://OWNER.github.io/REPO/`.

Tell the user what was detected: "Wykryte: OWNER/REPO → project pages → base `/REPO/` → URL `https://OWNER.github.io/REPO/`." If the user disagrees with the detection, ask for the correct path; do not guess.

## Step 2: Configure Vite's `base`

Read `vite.config.ts` (or `.js` / `.mjs`). Two cases:

**No `base` field** — add it. The result should look like:

```ts
export default defineConfig({
  base: '/REPO/',   // project pages — note trailing slash
  // …existing config
})
```

For user/org pages use `base: '/'`. For user/org pages you can also omit the field entirely (Vite's default is `/`) — but setting it explicitly is clearer.

**`base` already set** — ask before overwriting. If the existing value is `'./'` (relative), warn: relative base breaks deep-link refreshes on GitHub Pages; switch to the absolute path unless there's a specific reason.

## Step 3: Verify the production state (no dev chrome)

The public deploy must not show the DevToolbar or respond to the scenario picker. The template already gates both via `import.meta.env.PROD` / `DEV`, but **verify** — don't assume.

**DevToolbar gate** — read `src/shared/components/DevToolbar.tsx`. Look for one of:

- A guard that returns `null` when `import.meta.env.PROD` is true, or renders only when `import.meta.env.DEV` is true, OR
- The component being mounted in `src/App.tsx` (or wherever) inside an `import.meta.env.DEV` check.

If neither gate exists, add one. The cleanest place is the render site in `App.tsx`:

```tsx
{import.meta.env.DEV && <DevToolbar />}
```

If `DevToolbar.tsx` itself is the gate (returns null in prod), that's fine — don't duplicate.

**Scenario loader gate** — read `src/scenarios/loader.ts`. Confirm no top-level call to `loadScenario(...)` runs on app boot. The loader is for the DevToolbar to call on user action, not for the app to auto-call on mount. If something auto-loads a scenario on boot, wrap it in `if (import.meta.env.DEV)`.

## Step 4: Lock the production scenario

The user picked a scenario in the Decisions step (default `empty`). For end users this is mostly automatic — a fresh browser has empty localStorage, the app starts in its default state, and the DevToolbar (where the scenario picker lives) is hidden in prod. But a developer's localStorage could leak if they visit the public deploy from the same browser they developed on. Lock it down.

In `src/scenarios/loader.ts`, find `getCurrentScenarioName()`. Modify its return so that **in production it always returns the chosen scenario name**, ignoring localStorage:

```ts
export function getCurrentScenarioName(): ScenarioName {
  if (import.meta.env.PROD) return 'empty'  // ← lock prod to chosen scenario
  return (localStorage.getItem(SCENARIO_KEY) as ScenarioName) ?? 'empty'
}
```

Replace `'empty'` with the scenario the user picked. Also: on first production load, the app data should match that scenario's empty initial state. For `empty` this means components' `useLocalStorage` defaults — no further work needed. For `minimal` / `full`, the scenario's factory must seed that data on boot in production; if the project doesn't already do this, tell the user and skip the lock — empty is the safe default.

If `getCurrentScenarioName()` doesn't exist or the file structure differs from the template, **stop and ask** — don't invent a structure. The template's API is described in `proto-devsetup`.

## Step 5: Add the GitHub Actions workflow

Create `.github/workflows/deploy.yml`. This is the modern standard (no deprecated `peaceiris/actions-gh-pages`):

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]           # ← branch from Decisions step
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm            # ← match detected PM (see PM-specific notes below)

      - run: npm ci             # ← npm ci / pnpm install --frozen-lockfile / bun install --frozen-lockfile
      - run: npm run build      # ← same PM prefix

      # SPA refresh support: GitHub Pages returns 404 on deep-link refresh.
      # Copy index.html → 404.html so client-side routes resolve.
      - run: cp dist/index.html dist/404.html

      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

**PM-specific adjustments** — replace the npm lines with the detected PM:

- **pnpm** — swap `cache: npm` for `cache: pnpm`, add `run: pnpm install --frozen-lockfile` and `run: pnpm build`. You'll also need a `pnpm/action-setup@v4` step before `actions/setup-node`.
- **bun** — replace `actions/setup-node` with `oven-sh/setup-bun@v2`, then `bun install --frozen-lockfile` and `bun run build`.
- **deno** — replace with `denoland/setup-deno@v2`, then `deno install` and `deno task build`.

If the project has no lockfile, ask the user to commit one before continuing — CI installs without a lockfile are non-reproducible.

## Step 6: Manual fallback (`gh-pages` CLI)

A workflow can be disabled, the user may want to deploy from a non-`main` branch, or CI may be flaky. Add a manual fallback.

Install `gh-pages` as a devDependency and add a script:

```bash
npm install -D gh-pages        # or detected PM
```

Then add to `package.json` `scripts`:

```json
"deploy:manual": "npm run build && gh-pages -d dist"
```

(Prefix with the detected PM — `pnpm run build`, `bun run build`, etc.) After running `npm run deploy:manual`, the `gh-pages` package pushes `dist/` to a `gh-pages` branch on the remote. If the user goes this route, they'll need to switch Pages source to "Deploy from a branch" in Settings → Pages — document this in the handoff, don't do it for them.

## Step 7: Enable Pages (if `gh` is available)

If `gh auth status` succeeded, enable Pages programmatically and set the repo's homepage URL — this is the step that turns "push and pray" into "push and it works":

```bash
# Enable Pages with the Actions build type (workflow as the source)
gh api repos/OWNER/REPO/pages -X POST -f build_type=workflow

# Set the homepage URL in the repo's About panel
PAGES_URL="https://OWNER.github.io/REPO/"     # ← computed from Step 1
gh api --method PATCH repos/OWNER/REPO -f homepage="$PAGES_URL"
```

Use `build_type=workflow` (not `legacy`) — the workflow from Step 5 is the source of deploys. For user/org pages, `PAGES_URL` is `https://OWNER.github.io/`.

If `gh` errors with "not found" on the POST, the repo may already have Pages enabled — run `gh api repos/OWNER/REPO/pages` to check; if it returns the existing config, skip the POST.

If `gh` is not available, skip this step and tell the user to enable Pages manually: Settings → Pages → Source = "GitHub Actions". The workflow handles the rest on next push.

## Step 8: Verify locally

Run the production build and preview it with the configured base path:

```bash
npm run build                  # must succeed
npm run preview                # vite preview serves dist/ at the configured base
```

Open the URL `vite preview` prints. Confirm:

- The app loads with no console errors.
- DevToolbar is NOT visible.
- The app starts in the chosen scenario (empty by default) — no leftover data, no scenario picker.
- Assets load (no 404s from a base-path mismatch).

Kill preview after confirming.

If the user wants to be extra paranoid about the deep-link refresh behavior, manually navigate to a sub-path in the preview and refresh — it should resolve (in production via the `404.html` copy from Step 5; `vite preview` may behave differently, so don't treat a preview 404 as proof).

## Step 9: Tell the user what to do next

The skill's commit is local. To go live, the user needs to:

1. **Push the branch** — `git push origin main` (or the branch from Decisions).
2. **Watch the workflow** — `gh run watch` or the Actions tab in GitHub. First run takes ~1–2 minutes.
3. **Verify the URL** — `https://OWNER.github.io/REPO/` (or `https://OWNER.github.io/` for user/org pages).

If Pages was enabled programmatically in Step 7, no Settings visit is needed. If not, the user needs to go to Settings → Pages → Source = "GitHub Actions" once.

## What to produce

- **`vite.config.*`** — `base` set to the detected path.
- **`.github/workflows/deploy.yml`** — the workflow from Step 5.
- **`package.json`** — `gh-pages` devDependency + `deploy:manual` script.
- **`src/scenarios/loader.ts`** — production scenario lock (Step 4).
- **`src/shared/components/DevToolbar.tsx`** or `src/App.tsx` — DevToolbar gate, only if it was missing (Step 3).
- **`docs/adr/`** — if the project uses ADRs, record the deploy decision:

```markdown
# [NNNN] - Deploy to GitHub Pages
**Date**: [today]
**Status**: Accepted
## Context
The prototype is functionally complete and polished. We need a public, shareable URL for users.
## Decision
Deploy via GitHub Actions to Pages at https://OWNER.github.io/REPO/. Production scenario
locked to [empty|minimal|full]. Manual fallback via `gh-pages` CLI on `deploy:manual` script.
## Impact
Every push to [main] redeploys. DevToolbar and scenario picker are dev-only; end users see
the locked scenario.
```

If the project has no ADR convention, skip it.

## After deploy

**Commit this skill's work first** — see the Git checkpoint section's "After your work" step (`proto-deploy: configure github pages deploy`) — then do the handoff below.

Tell the user:
1. **What was configured** — base path (with the detected value), workflow file, manual fallback, prod scenario lock.
2. **The Pages URL** to expect — `https://OWNER.github.io/REPO/` (or `https://OWNER.github.io/`).
3. **Next steps** — push, then either watch the workflow run or visit Settings → Pages if `gh` wasn't available.
4. **Manual fallback** — `npm run deploy:manual` if the workflow is ever disabled (and the Settings switch it requires).
5. **What end users will see** — the locked scenario (empty by default), no dev toolbar, no scenario picker.

Suggest next steps:
- "Po weryfikacji deployu — `proto-bug` jeśli coś wyjdzie na produkcji, czego nie było lokalnie"
- "Jeśli chcesz inny scenario dla userów (np. `full` dla showcase'u) — odpal `proto-deploy` jeszcze raz z innym wyborem"
- "Custom domain (CNAME) — poza zakresem tego skilla, ale jak ustawisz, zdejmnij `base` z powrotem na `/`"
