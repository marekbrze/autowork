import { useEffect, useState } from 'react';

import type { DoneVision } from '@/shared/types';

import { ReasonColumn } from './ReasonColumn';
import type { Reason } from '../types/reason';

const EMOJI_CHOICES = ['✨', '🎉', '😌', '💪', '🧘', '🏠', '💰', '☀️'];

interface WhyBlockProps {
  stressorId: string;
  reasons: Reason[];
  onAddReason: (stressorId: string, text: string, valence: 'positive' | 'negative') => void;
  onDeleteReason: (id: string) => void;
  doneVision?: DoneVision;
  onSetDoneVision: (stressorId: string, vision: DoneVision | null) => void;
}

/**
 * KROK A — DLACZEGO to jest ważne (WHY). Dwie kolumny walencji
 * (co zyskam ‖ co mnie czeka) + opcjonalna wizja efektu (tekst + emoji).
 * Blok opcjonalny/skippowalny (ADR 0005) — nigdy nie blokuje przejścia.
 */
export function WhyBlock({
  stressorId,
  reasons,
  onAddReason,
  onDeleteReason,
  doneVision,
  onSetDoneVision,
}: WhyBlockProps) {
  const [visionText, setVisionText] = useState(doneVision?.text ?? '');
  const [visionEmoji, setVisionEmoji] = useState(doneVision?.emoji ?? '✨');

  // Re-sync lokalnego draftu, gdy wizja zmieni się z zewnątrz (np. inna karta —
  // warstwa storage synchronizuje się zdarzeniem `storage`). decompose #13.
  useEffect(() => {
    setVisionText(doneVision?.text ?? '');
    setVisionEmoji(doneVision?.emoji ?? '✨');
  }, [doneVision]);

  const positive = reasons.filter((r) => r.valence === 'positive');
  const negative = reasons.filter((r) => r.valence === 'negative');

  const commitVision = () => {
    const text = visionText.trim();
    onSetDoneVision(stressorId, text ? { text, emoji: visionEmoji } : null);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <ReasonColumn
          valence="positive"
          title="What I gain when this is done"
          hint="Gain — moving toward something good."
          reasons={positive}
          onAdd={(text) => onAddReason(stressorId, text, 'positive')}
          onDelete={onDeleteReason}
        />
        <ReasonColumn
          valence="negative"
          title="What's coming if I don't"
          hint="The cost of delay — what gets worse if you put it off."
          reasons={negative}
          onAdd={(text) => onAddReason(stressorId, text, 'negative')}
          onDelete={onDeleteReason}
        />
      </div>

      <div className="space-y-2 rounded-lg border p-3">
        <div className="space-y-0.5">
          <h4 className="text-sm font-semibold">Vision of the outcome</h4>
          <p className="text-xs text-muted-foreground">
            Optional. What does done look like? Vivid, sensory — this "charges the battery" you'll
            spend later in focus.
          </p>
        </div>

        <textarea
          className="min-h-16 w-full resize-y rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="e.g. sitting on the couch, the loan paid off, the phone silent…"
          aria-label="Vision of the outcome"
          rows={2}
          maxLength={600}
          value={visionText}
          onChange={(e) => setVisionText(e.target.value)}
          onBlur={commitVision}
        />

        <div className="flex flex-wrap items-center gap-1">
          {EMOJI_CHOICES.map((emoji) => {
            const selected = visionEmoji === emoji;
            return (
              <button
                key={emoji}
                type="button"
                aria-label={`Select emoji ${emoji}`}
                aria-pressed={selected}
                onClick={() => {
                  setVisionEmoji(emoji);
                  if (visionText.trim()) onSetDoneVision(stressorId, { text: visionText.trim(), emoji });
                }}
                className={
                  'flex size-7 items-center justify-center rounded-md border text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ' +
                  (selected ? 'border-ring bg-muted' : 'border-transparent hover:bg-muted/60')
                }
              >
                {emoji}
              </button>
            );
          })}
        </div>

        {doneVision && (
          <p className="text-xs text-muted-foreground">
            Saved vision: <span className="font-medium text-foreground">{doneVision.emoji} {doneVision.text}</span>
          </p>
        )}
      </div>
    </div>
  );
}
