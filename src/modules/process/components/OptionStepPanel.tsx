import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

import { cn } from '@/lib/utils';
import { BatteryIcon } from './BatteryIcon';

/** Pojedyncza opcja w kroku atrybutu (kontekst / energia / czas). */
export interface Opt {
  /** The shortcut key shown as a badge (e.g. "1"). */
  key: string;
  label: string;
  /** For energy: how many batteries to draw. */
  battery?: 1 | 2 | 3;
  /** An icon (e.g. for contexts). */
  Icon?: ComponentType<LucideProps>;
}

interface OptionStepPanelProps {
  options: Opt[];
  /** The currently highlighted option (hover / key / ↑↓). */
  pendingKey: string | null;
  /** The grid class — the parent picks the layout by option count. */
  gridClassName: string;
  /** Tekst pomocy nad gridem. */
  hint: string;
  /** Highlight an option (card hover/focus). */
  onHover: (key: string) => void;
  /** Confirm an option (a mouse click = a direct commit). */
  onConfirm: (opt: Opt) => void;
  /** Skip the step (Esc). */
  onSkip: () => void;
}

/**
 * An option-card grid for the current attribute step (the `dopadone` pattern).
 * A card is a <button> (keyboard-accessible via Tab/Enter); a mouse click =
 * a direct commit. The keyboard (1..N / ↑↓ / Enter / Esc) is handled globally
 * w ProcessView, tu tylko wizualna reakcja na `pendingKey`.
 */
export function OptionStepPanel({
  options,
  pendingKey,
  gridClassName,
  hint,
  onHover,
  onConfirm,
  onSkip,
}: OptionStepPanelProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div className={cn('grid gap-2', gridClassName)}>
        {options.map((opt) => {
          const highlighted = pendingKey === opt.key;
          const { Icon } = opt;
          return (
            <button
              key={opt.key}
              type="button"
              aria-pressed={highlighted}
              onMouseEnter={() => onHover(opt.key)}
              onFocus={() => onHover(opt.key)}
              onClick={() => onConfirm(opt)}
              className={cn(
                'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                highlighted
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-ring/50 hover:bg-muted/50',
              )}
            >
              {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
              {opt.battery && (
                <BatteryIcon
                  level={opt.battery}
                  className={cn('shrink-0', highlighted ? 'text-foreground' : 'text-muted-foreground')}
                />
              )}
              <span className="min-w-0 flex-1 truncate font-medium">{opt.label}</span>
              <kbd className="shrink-0 rounded border bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
                {opt.key}
              </kbd>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onSkip}
        className="text-xs text-muted-foreground underline-offset-4 outline-none hover:underline focus-visible:underline"
      >
        Skip <kbd className="ml-0.5 rounded border bg-muted px-1 py-0.5 text-[0.65rem]">Esc</kbd>
      </button>
    </div>
  );
}
