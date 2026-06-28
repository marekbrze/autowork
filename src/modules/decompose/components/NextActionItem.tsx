import { useEffect, useRef, useState } from 'react';
import { Check, Scissors, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { DecomposeModal } from './DecomposeModal';
import type { NextAction } from '../types/next-action';
import type { Task } from '../types/task';

interface NextActionItemProps {
  nextAction: NextAction;
  /** Taski tego next-actionu (przefiltrowane przez rodzica). */
  tasks: Task[];
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onReplaceTasks: (nextAction: NextAction, texts: string[]) => void;
}

/**
 * Jeden next-action w bloku HOW. Klik tekstu = edycja inline (jak StressorItem
 * w capture); „Rozbij…" otwiera modal dekompozycji; [×] usuwa (z taskami).
 */
export function NextActionItem({ nextAction, tasks, onUpdate, onDelete, onReplaceTasks }: NextActionItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(nextAction.text);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    const text = draft.trim();
    // Pusty draft = anuluj edycję (zostaw oryginał). Usuwanie to osobna, jawna akcja
    // (✕ → potwierdzenie) — czyszczenie pola nie usuwa next-actionu po cichu (ADR capture #8).
    if (text && text !== nextAction.text) onUpdate(nextAction.id, text);
    setEditing(false);
  };

  const taskCount = tasks.length;

  return (
    <div
      className={cn(
        'rounded-lg border bg-background px-3 py-2 transition-colors',
        editing && 'border-ring',
      )}
    >
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            className="h-7 flex-1 bg-transparent text-sm outline-none"
            aria-label={`Edytuj next-action: ${nextAction.text}`}
            maxLength={300}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                setDraft(nextAction.text);
                setEditing(false);
              }
            }}
            onBlur={commit}
          />
          <Button type="button" size="icon-sm" variant="ghost" aria-label="Zapisz zmiany" onClick={commit}>
            <Check />
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            title="Kliknij, aby edytować"
            className="min-w-0 flex-1 truncate rounded-md text-left text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {nextAction.text}
          </button>

          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-xs',
              taskCount > 0 ? 'bg-muted text-foreground' : 'text-muted-foreground/70',
            )}
          >
            {taskCount > 0 ? `${taskCount} ${taskCount === 1 ? 'task' : 'tasków'}` : 'do rozbicia'}
          </span>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setModalOpen(true)}
          >
            <Scissors />
            Rozbij…
          </Button>

          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={`Usuń next-action: ${nextAction.text}`}
            className="opacity-60 hover:opacity-100"
            onClick={() => setConfirmOpen(true)}
          >
            <X />
          </Button>
        </div>
      )}

      {taskCount > 0 && !editing && (
        <ul className="mt-1.5 space-y-0.5 pl-1">
          {tasks.map((t) => (
            <li key={t.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span aria-hidden>–</span>
              <span className="min-w-0 truncate">{t.text}</span>
            </li>
          ))}
        </ul>
      )}

      {modalOpen && (
        <DecomposeModal
          nextAction={nextAction}
          initialSteps={tasks.map((t) => t.text)}
          onSave={(texts) => onReplaceTasks(nextAction, texts)}
          onClose={() => setModalOpen(false)}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Usunąć ten next-action?"
        description="Usunę też jego taski. Tej operacji nie da się cofnąć."
        confirmLabel="Usuń"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          onDelete(nextAction.id);
          setConfirmOpen(false);
        }}
      />
    </div>
  );
}
