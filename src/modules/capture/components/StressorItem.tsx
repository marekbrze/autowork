import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { Stressor } from '../types/stressor';

interface StressorItemProps {
  stressor: Stressor;
  /** 0-based pozycja w liście. */
  index: number;
  isFocused: boolean;
  /** Rejestracja refu przycisku-wiersza (do nawigacji strzałkami z parenta). */
  registerRef: (index: number, el: HTMLButtonElement | null) => void;
  onFocus: (id: string) => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
  onSave: (id: string, text: string) => void;
}

export function StressorItem({
  stressor,
  index,
  isFocused,
  registerRef,
  onFocus,
  onMove,
  onDelete,
  onSave,
}: StressorItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(stressor.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startEdit = () => {
    setDraft(stressor.text);
    setEditing(true);
  };

  const commit = () => {
    const text = draft.trim();
    // Pusty draft = anuluj edycję (zostaw oryginał). Usuwanie to osobna, jawna akcja
    // (przycisk ✕ / Backspace) — czyszczenie pola nie usuwa stresora po cichu.
    if (text && text !== stressor.text) onSave(stressor.id, text);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-ring bg-background px-3 py-2">
        <span className="w-6 text-sm text-muted-foreground tabular-nums">{index + 1}</span>
        <input
          ref={inputRef}
          className="h-7 flex-1 bg-transparent text-sm outline-none"
          aria-label={`Edit stressor: ${stressor.text}`}
          value={draft}
          maxLength={300}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              setDraft(stressor.text);
              setEditing(false);
            }
          }}
          onBlur={commit}
        />
        <Button type="button" size="icon-sm" variant="ghost" aria-label="Save changes" onClick={commit}>
          <Check />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors',
        isFocused ? 'border-ring bg-muted' : 'bg-background hover:bg-muted/50',
      )}
    >
      <span className="w-6 text-sm font-medium text-muted-foreground tabular-nums">{index + 1}</span>
      <button
        type="button"
        ref={(el) => registerRef(index, el)}
        onFocus={() => onFocus(stressor.id)}
        onClick={startEdit}
        title="Click to edit (↑↓ arrows to navigate, Backspace to delete)"
        className="min-w-0 flex-1 truncate rounded-md text-left text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            startEdit();
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            onMove(1);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            onMove(-1);
          } else if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            onDelete();
          }
        }}
      >
        {stressor.text}
      </button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label={`Delete stressor: ${stressor.text}`}
        onClick={onDelete}
        className="opacity-60 hover:opacity-100"
      >
        <X />
      </Button>
    </div>
  );
}
