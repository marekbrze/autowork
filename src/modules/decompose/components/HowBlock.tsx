import { useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { NextActionItem } from './NextActionItem';
import type { NextAction } from '../types/next-action';
import type { Task } from '../types/task';

/** Przykłady modelujące aktywny, konkretny język (ADR 0006).
 *  Wartość z końcową spacją ląduje w polu (gotowa do dokończenia);
 *  wielokropek doklejamy tylko do etykiety chipa. */
const ACTION_EXAMPLES = ['Zadzwoń do ', 'Wyślij ', 'Wpłać ', 'Umów '];

interface HowBlockProps {
  stressorId: string;
  nextActions: NextAction[];
  tasks: Task[];
  onAddNextAction: (stressorId: string, text: string) => void;
  onUpdateNextAction: (id: string, text: string) => void;
  onDeleteNextAction: (id: string) => void;
  onReplaceTasks: (nextAction: NextAction, texts: string[]) => void;
}

/**
 * KROK B — JAK to mądrze popchnąć (HOW). Dodawanie next-actionów (Enter),
 * przykłady aktywnego języka, lista z rozbiciem na taski. „Dalej" (w rodzicu)
 * aktywowany przy ≥1 next-actionie.
 */
export function HowBlock({
  stressorId,
  nextActions,
  tasks,
  onAddNextAction,
  onUpdateNextAction,
  onDeleteNextAction,
  onReplaceTasks,
}: HowBlockProps) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const tasksByAction = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      const list = map.get(t.nextActionId);
      if (list) list.push(t);
      else map.set(t.nextActionId, [t]);
    }
    return map;
  }, [tasks]);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onAddNextAction(stressorId, text);
    setDraft('');
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-3">
      <div className="space-y-0.5">
        <h3 className="text-base font-semibold">Jak to mądrze popchnąć?</h3>
        <p className="text-sm text-muted-foreground">
          Wypisz konkretne akcje — czasownik na początku, fizycznie wykonalne. Enter dodaje kolejną.
        </p>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          ref={inputRef}
          className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="np. Zadzwoń do doradcy o warunki restrukturyzacji…"
          aria-label="Nowy next-action"
          autoComplete="off"
          maxLength={300}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="submit" size="lg" disabled={!draft.trim()}>
          <Plus />
          Dodaj
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">np.</span>
        {ACTION_EXAMPLES.map((ex) => (
          <button
            key={ex.trim()}
            type="button"
            className="rounded-full border border-input bg-background px-2 py-0.5 text-xs outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={() => {
              setDraft(ex);
              inputRef.current?.focus();
            }}
          >
            {ex.trim()}…
          </button>
        ))}
      </div>

      {nextActions.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Jeszcze żadnej akcji. Wymyśl pierwszy konkretny krok — cokolwiek, co pchnie to do przodu.
        </p>
      ) : (
        <ul className="space-y-2">
          {nextActions.map((na) => (
            <li key={na.id}>
              <NextActionItem
                nextAction={na}
                tasks={tasksByAction.get(na.id) ?? []}
                onUpdate={onUpdateNextAction}
                onDelete={onDeleteNextAction}
                onReplaceTasks={onReplaceTasks}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
