import { useEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { NextAction } from '../types/next-action';

interface DecomposeModalProps {
  nextAction: NextAction;
  /** Teksty istniejących tasków tego next-actionu (do edycji). */
  initialSteps: string[];
  /** Zastępuje zestaw tasków (N tekstów = N tasków; skip = 1 tekst). */
  onSave: (texts: string[]) => void;
  onClose: () => void;
}

/**
 * Modal rozbicia next-actionu na taski (HOW w `decompose`). Prompt
 * „Jak to możesz robić?" + Enter dodaje mniejsze kroki; „Pomiń" = 1 task
 * (konkretny next-action). Wzorzec nudge (prompt + skip), ADR 0006.
 */
export function DecomposeModal({ nextAction, initialSteps, onSave, onClose }: DecomposeModalProps) {
  const [steps, setSteps] = useState<string[]>(initialSteps);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const addStep = () => {
    const text = draft.trim();
    if (!text) return;
    setSteps((prev) => [...prev, text]);
    setDraft('');
  };

  const save = () => {
    onSave(steps);
    onClose();
  };

  const skip = () => {
    onSave([nextAction.text]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation">
      <div
        className="w-full max-w-md space-y-5 rounded-xl border bg-background p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="decompose-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 id="decompose-title" className="text-lg font-semibold leading-tight">
              Rozbij na mniejsze taski
            </h3>
            <p className="text-sm text-muted-foreground">{nextAction.text}</p>
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Anuluj rozbicie"
            onClick={onClose}
          >
            <X />
          </Button>
        </div>

        <div className="space-y-2">
          <label htmlFor="decompose-step" className="block text-sm font-medium">
            Jak to możesz rozbić?
          </label>
          <p className="text-xs text-muted-foreground">
            Wpisz mniejsze, wykonalne kroki — Enter dodaje kolejny. Pusty = ten next-action jest już
            jednym konkretnym taskiem.
          </p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addStep();
            }}
          >
            <input
              id="decompose-step"
              ref={inputRef}
              className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="np. znajdź numer infolinii…"
              autoComplete="off"
              maxLength={300}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button type="submit" size="icon" aria-label="Dodaj krok" disabled={!draft.trim()}>
              <Plus />
            </Button>
          </form>

          {steps.length > 0 ? (
            <ul className="space-y-1">
              {steps.map((step, i) => (
                <li key={`${step}-${i}`} className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5">
                  <span className="w-5 shrink-0 text-xs text-muted-foreground tabular-nums">{i + 1}.</span>
                  <span className="min-w-0 flex-1 text-sm">{step}</span>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    aria-label={`Usuń krok: ${step}`}
                    onClick={() => setSteps((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground/70">
              Brak kroków — to OK. Wciśnij „Pomiń", a next-action stanie się jednym konkretnym taskiem.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="ghost" onClick={skip}>
            Pomiń → 1 task
          </Button>
          <Button type="button" onClick={save} disabled={steps.length === 0}>
            Zapisz → {steps.length} {steps.length === 1 ? 'task' : 'tasków'}
          </Button>
        </div>
      </div>
    </div>
  );
}
