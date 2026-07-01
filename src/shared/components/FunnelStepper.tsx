import { cn } from '@/lib/utils';

/**
 * Stepper postępu lejka (ADR 0001) — prowadzi przez kroki Runa:
 * capture → ranking → decompose → process → focus. Wspólny dla wszystkich
 * modułów Core; renderowany w AppShell. leading, nie menu (brak linków).
 */
const STAGES = [
  { key: 'capture', label: '1. Stressors' },
  { key: 'ranking', label: '2. Ranking' },
  { key: 'decompose', label: '3. Actions' },
  { key: 'process', label: '4. Process' },
  { key: 'focus', label: '5. Focus' },
] as const;

export type FunnelStage = (typeof STAGES)[number]['key'];

export function FunnelStepper({ current }: { current: FunnelStage }) {
  const activeIndex = STAGES.findIndex((s) => s.key === current);

  return (
    <nav aria-label="Funnel progress" className="flex flex-wrap items-center gap-1.5">
      {STAGES.map((s, i) => {
        const isActive = i === activeIndex;
        const isDone = i < activeIndex;
        return (
          <span
            key={s.key}
            aria-current={isActive ? 'step' : undefined}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-semibold transition-colors',
              isActive && 'bg-primary text-primary-foreground',
              isDone && 'text-foreground',
              !isActive && !isDone && 'text-muted-foreground/60',
            )}
          >
            {s.label}
          </span>
        );
      })}
    </nav>
  );
}
