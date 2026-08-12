import { cn } from '@/lib/utils';

/**
 * Energy level (1..3) as batteries — three segments, filled per `level`.
 * Inherits the text color (bg-current), so the parent sets the accent.
 * Decorative (aria-hidden) — the value is also carried by the label and the key.
 */
export function BatteryIcon({ level, className }: { level: 1 | 2 | 3; className?: string }) {
  return (
    <span className={cn('inline-flex items-end gap-0.5', className)} aria-hidden>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            'w-1.5 rounded-sm',
            // increasing segment height — a readable scale even without color
            i === 1 && 'h-2',
            i === 2 && 'h-2.5',
            i === 3 && 'h-3',
            i <= level ? 'bg-current' : 'bg-muted-foreground/25',
          )}
        />
      ))}
    </span>
  );
}
