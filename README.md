# autowork

A local-first app that turns a brain-dump of stressors into prioritized next actions. Instead of another list, it's a **funnel**: dump, rank, process, focus on one thing.

**Live →** <https://marekbrze.github.io/autowork/>

## How it works

You don't manage tasks — you process them, one **Run** at a time:

1. **Brain-dump** everything on your mind (stressors).
2. **Rank** them — drag to order, or run a pairwise comparison and let it sort for you.
3. **Process** each into a concrete next action.
4. **Focus** on one. Pause, resume, or archive the Run when you're done.

Each Run is its own object with its own stats, so you can see what you actually got through.

## Decisions worth noting

- **Local-first, single-user.** No account, no sync by default; your data stays in the browser.
- **Funnel, not a flat list.** The point is to narrow down, not to collect.
- **Pairwise ranking.** Optional comparison-based sorting when drag-ordering isn't enough.
- **Documented architecture.** 48+ architecture decision records under `docs/adr/`.

## Tech

React, Vite, TypeScript, Tailwind, Base UI. Component work happens in **Storybook with the a11y addon** — accessibility is checked at the component level, not bolted on later.

## Status

In active development. Design docs live under `docs/`.
