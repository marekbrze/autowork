import { useState } from 'react';
import { Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { ConfirmDialog } from './ConfirmDialog';
import type { Reason } from '../types/reason';
import type { Valence } from '@/shared/types';

interface ReasonColumnProps {
  valence: Valence;
  title: string;
  hint: string;
  /** Powody już przefiltrowane na tę walencję (i stresor). */
  reasons: Reason[];
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Jedna kolumna powodów w bloku WHY — dla jednej walencji. Enter dodaje
 * powód, każdy wiersz ma znak walencji (+ zysk / − ból) i usuwanie.
 */
export function ReasonColumn({ valence, title, hint, reasons, onAdd, onDelete }: ReasonColumnProps) {
  const [draft, setDraft] = useState('');
  // ID powodu czekającego na potwierdzenie usunięcia (null = dialog zamknięty).
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const positive = valence === 'positive';

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onAdd(text);
    setDraft('');
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="space-y-0.5">
        <h4 className="text-sm font-semibold">{title}</h4>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          className="h-8 flex-1 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder={positive ? 'np. spokój psychiczny…' : 'np. windykacja…'}
          aria-label={title}
          autoComplete="off"
          maxLength={300}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="submit" size="icon" aria-label={`Dodaj powód: ${title}`} disabled={!draft.trim()}>
          <Plus />
        </Button>
      </form>

      {reasons.length > 0 ? (
        <ul className="space-y-1">
          {reasons.map((r) => (
            <li key={r.id} className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5">
              <span className="w-4 shrink-0 text-center text-sm font-bold text-muted-foreground" aria-hidden>
                {positive ? '+' : '−'}
              </span>
              <span className="min-w-0 flex-1 text-sm">{r.text}</span>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                aria-label={`Usuń powód: ${r.text}`}
                onClick={() => setConfirmId(r.id)}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground/70">Brak — dopisz, co przyjdzie do głowy.</p>
      )}

      <ConfirmDialog
        open={confirmId !== null}
        title="Usunąć ten powód?"
        description="Ta operacja nie da się cofnąć."
        confirmLabel="Usuń"
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) onDelete(confirmId);
          setConfirmId(null);
        }}
      />
    </div>
  );
}
