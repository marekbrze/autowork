import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';

/**
 * Funnel progress stepper (ADR 0001) — guides through the steps of the active Run:
 * capture → ranking → decompose → process → focus. Shared across all
 * Core modules; rendered on the funnel screens.
 *
 * Clickable navigation (ADR 0048 — supersedes the early "leading, not a menu"):
 * each step is a link to the active Run's route; the current one is a no-op (a link to itself).
 * Optional `onBeforeNavigate` blocks the jump (returns false) — e.g. a ConfirmDialog
 * before leaving an active focus session (focus/FocusView).
 */
const STAGES = [
  { key: 'capture', label: '1. Stressors', route: '/capture' },
  { key: 'ranking', label: '2. Ranking', route: '/capture/ranking' },
  { key: 'decompose', label: '3. Actions', route: '/decompose' },
  { key: 'process', label: '4. Process', route: '/process' },
  { key: 'focus', label: '5. Focus', route: '/focus' },
] as const;

export type FunnelStage = (typeof STAGES)[number]['key'];

interface FunnelStepperProps {
  current: FunnelStage;
  /** Guard: return false to block the jump (e.g. confirm leaving an active session). */
  onBeforeNavigate?: (stage: FunnelStage, route: string) => boolean;
}

export function FunnelStepper({ current, onBeforeNavigate }: FunnelStepperProps) {
  const activeIndex = STAGES.findIndex((s) => s.key === current);

  return (
    <nav aria-label="Funnel progress" className="flex flex-wrap items-center gap-1.5">
      {STAGES.map((s, i) => {
        const isActive = i === activeIndex;
        const isDone = i < activeIndex;
        return (
          <Link
            key={s.key}
            to={s.route}
            aria-current={isActive ? 'step' : undefined}
            onClick={(e) => {
              if (onBeforeNavigate && !onBeforeNavigate(s.key, s.route)) e.preventDefault();
            }}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px',
              // Affordance aligned to system nav/chip pattern (NavLink ghost, SessionFilter Chip):
              // non-active steps are full-opacity text + hover:bg-muted — clearly interactive, never
              // the washed-out muted/60 that reads as disabled. Active = strong brand-green marker.
              isActive
                ? 'bg-primary text-primary-foreground'
                : cn(
                    'hover:bg-muted',
                    isDone ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                  ),
            )}
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
