# [0026] - dashboard as action runway, progress-first

**Date**: 2026-06-29
**Module**: dashboard
**Status**: Accepted

## Context
During the dashboard module detailing, the user described the dashboard not as a neutral overview but as a **runway** — its first job is to put the user back to work in one tap. The user wants to "see immediately the possibility of action": a dominant card for the most-recently-worked run (large, Continue on top), an adjacent "start new" button, smaller active-run cards below, and the archive reachable at the end of the active list. The primary motivator is progress momentum; WHY/vision and run-to-run contrast are explicitly not on this screen.

## Decision
Dashboard is a launcher/runway. Layout top→bottom: **dominant last-worked run card** (progress-forward — bar, done/remaining, %; light time-spent accent; Continue primary, Details secondary) → adjacent **"Start new"** button (conscious, secondary) → **smaller active run cards** (each exposes Continue + Details; visual hierarchy only — same actions as the dominant card) → **archive entry** at the end of the active list. Empty state (zero runs) shows a large, inviting "start work" button.

## Impact
Updates `MODULES.md` dashboard description and `GLOSSARY.md` Dashboard term to reflect the runway/launcher framing. Sets the layout the lofi prototype will build. Dominant card is driven by `lastActiveAt` (ADR 0028); "Compare runs" removed from MVP scope (ADR 0027).
