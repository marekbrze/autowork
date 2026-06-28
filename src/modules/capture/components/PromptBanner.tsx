import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';

import { Button } from '@/components/ui/button';

export interface PromptSuggestion {
  category: string;
  example: string;
}

const DEFAULT_PROMPTS: PromptSuggestion[] = [
  { category: 'finanse', example: 'A rata kredytu?' },
  { category: 'zdrowie', example: 'A zaplanowana wizyta u lekarza?' },
  { category: 'praca', example: 'A zbliżający się deadline?' },
  { category: 'relacje', example: 'A trudna rozmowa z kimś bliskim?' },
  { category: 'dom', example: 'A zaległe sprawy domowe?' },
  { category: 'dokumenty', example: 'A niezałatwione papiery?' },
  { category: 'auto', example: 'A przegląd samochodu?' },
];

interface PromptBannerProps {
  prompts?: PromptSuggestion[];
  onPick?: (text: string) => void;
  intervalMs?: number;
}

/**
 * Rotujący banner-prompt w brain dumpie. Pokazuje jedną podpowiedź naraz,
 * zmienia się co kilka sekund; ◀ ▶ do ręcznego przewijania; klik = pre-fill pola.
 * Pauzuje na hoverze, żeby nie uciekać podczas czytania.
 */
export function PromptBanner({ prompts = DEFAULT_PROMPTS, onPick, intervalMs = 4500 }: PromptBannerProps) {
  const [index, setIndex] = useState(0);

  const count = prompts.length;
  const current = prompts[index % count] ?? prompts[0];

  useEffect(() => {
    if (count <= 1) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => window.clearInterval(t);
  }, [count, intervalMs]);

  const go = (dir: -1 | 1) => setIndex((i) => (i + dir + count) % count);

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-muted/40 px-2 py-1.5">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Poprzednia podpowiedź"
        disabled={count <= 1}
        onClick={() => go(-1)}
      >
        <ChevronLeft />
      </Button>

      <button
        type="button"
        onClick={() => onPick?.(current.example)}
        title="Kliknij, aby wstawić do pola"
        aria-label={`Podpowiedź z kategorii ${current.category}: ${current.example}. Kliknij, aby wstawić do pola.`}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Lightbulb className="size-4 shrink-0" aria-hidden />
        <span className="inline-flex min-w-0 items-center gap-2">
          <span className="shrink-0 rounded bg-background px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide">
            {current.category}
          </span>
          <span className="truncate">{current.example}</span>
        </span>
      </button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Następna podpowiedź"
        disabled={count <= 1}
        onClick={() => go(1)}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
