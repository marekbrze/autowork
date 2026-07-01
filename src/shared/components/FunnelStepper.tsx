import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';

/**
 * Stepper postępu lejka (ADR 0001) — prowadzi przez kroki aktywnego Runa:
 * capture → ranking → decompose → process → focus. Wspólny dla wszystkich
 * modułów Core; renderowany w ekranach lejka.
 *
 * Klikalna nawigacja (ADR 0048 — supersede wczesnego „leading, nie menu"):
 * każdy krok to link do trasy aktywnego Runa; bieżący = no-op (link do samego siebie).
 * Opcjonalny `onBeforeNavigate` blokuje skok (zwraca false) — np. ConfirmDialog
 * przed wyjściem z aktywnej sesji focus (focus/FocusView).
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
  /** Guard: zwróć false, by zablokować skok (np. potwierdzenie wyjścia z aktywnej sesji). */
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
              'rounded-full px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              isActive && 'bg-primary text-primary-foreground',
              isDone && 'text-foreground',
              !isActive && !isDone && 'text-muted-foreground/60 hover:text-foreground',
            )}
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
