import { cn } from '@/lib/utils';

/**
 * Poziom energii (1..3) jako bateryjki — trzy segmenty, wypełnione wg `level`.
 * Dziedziczy kolor tekstu (bg-current), więc akcent ustala rodzic.
 * Dekoracyjne (aria-hidden) — wartość niesie też etykieta i klawisz.
 */
export function BatteryIcon({ level, className }: { level: 1 | 2 | 3; className?: string }) {
  return (
    <span className={cn('inline-flex items-end gap-0.5', className)} aria-hidden>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            'w-1.5 rounded-sm',
            // rosnąca wysokość segmentów — czytelna skala nawet bez koloru
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
