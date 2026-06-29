# Change: App language Polish → English

## Type
Direction change / content (diagnosed by proto-bug) — **not a defect in the original build**. The app was authored consistently in Polish: specs (`docs/modules/*.md`, `MODULES.md`) and code are both Polish. The owner now wants the user-facing UI in English. Two distinct items fall out of that.

## Severity
🟡 medium — functionally nothing is broken; but the deployed site is in the wrong language for the intended audience, and the document is mislabeled (`lang="pl"`), which is an accessibility/SEO defect.

## Item A — `lang` attribute is wrong (real defect, trivial fix)

### Reproduction
Inspect the deployed HTML: `<html lang="pl">` (`index.html:2`, present verbatim in `dist/index.html:2`). The whole UI is being declared Polish to browsers, screen readers, and search engines — regardless of the actual target language.

**Expected**: `lang` matches the rendered language (English once Item B lands, at minimum not `pl`).
**Actual**: `lang="pl"`.
**Location**: `index.html:2`.

### Root cause
**Class**: spec-vs-code drift (hand-written boilerplate never updated when the project standardized on Polish during prototyping).

**Fix plan**: `index.html:2` — `<html lang="pl">` → `<html lang="en">`. One line. (Also re-check the `<title>` at `index.html:7` — currently `"Autowork"`, which is language-neutral and fine; update only if a Polish title is added later.)

### Routing
Direct edit — `index.html:2`. No proto skill needed.

## Item B — translate all user-visible copy to English (content scope)

### Scope
User-facing strings across all 6 modules are Polish. Representative examples (all `file:line`):

| Where | Polish string |
|---|---|
| `src/shared/components/ModulePlaceholder.tsx:28-30,33` | "Moduł … — ekrany do zbudowania w `proto-lofi`.", "← Wróć do Dashboardu" |
| `src/shared/components/ConfirmDialog.tsx:26` (+ defaults) | `confirmLabel = 'Usuń'`, "Anuluj" |
| `src/modules/dashboard/components/DominantRunCard.tsx:42,53,84,89,108` | "Kontynuuj, gdzie skończyłeś", "Przejazd ukończony", "Jeszcze bez tasków — zacznij od brain dumpu", "zrobione · zostały", "Szczegóły" |
| `src/modules/dashboard/components/DashboardView.tsx` | runway headings + empty states |
| `src/modules/capture/components/*` | "Co cię teraz stresuje?" brain-dump prompt, ranking copy |
| `src/modules/decompose`, `process`, `focus`, `run/*` | WHY/HOW labels, battery/energy copy, timer labels, summaries, toasts |

Polish appears in ~68 files under `src/modules/` (count includes code comments — comments need not be translated; only the rendered strings do). The reference UX, `marekbrze/dopadone` (see memory), is the English-language baseline to match tone with.

### Root cause
**Class**: direction change — the prototype was authored in Polish by design; switching to English is a new product decision, not a bug.

### Fix plan
1. Decide target voice/tone (concise, action-oriented, English). Match the `dopadone` reference register.
2. Translate rendered strings module-by-module (capture → decompose → process → focus → run → dashboard), preserving the active/concrete phrasing the specs call for.
3. Code comments and `docs/modules/*.md` can stay Polish (internal) OR be translated in a separate doc pass — the user only sees the UI.
4. Item A (`lang="en"`) lands in the same pass.

### Routing
| Step | Skill / action | Target | What |
|------|----------------|--------|------|
| 1 | (direct edit) | `index.html:2` | `lang="pl"` → `lang="en"` (Item A, do immediately). |
| 2 | proto-polish | all modules | sweep all rendered copy → English; proto-polish explicitly covers copy as part of the ship pass. Do this *after* the routing fix (so you're polishing a dashboard people can actually reach). |
| 3 | (optional) proto-feature | i18n | if multi-language is a future goal, add an i18n layer instead of hard-coding English; otherwise a one-time translation is sufficient for a prototype. |

## Hand-off
1. Do Item A now (one-line `lang` fix) — it's independent of everything.
2. Land the routing fix from `dashboard-blank-on-pages.md` first (the dashboard must be reachable).
3. Then run `proto-polish` (or a dedicated translation pass) across modules for the full English copy, matching the `dopadone` reference tone.
