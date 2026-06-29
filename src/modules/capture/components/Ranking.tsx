import { useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FunnelStepper } from '@/shared/components/FunnelStepper';

import { PairingFlow } from './PairingFlow';
import { useStressors } from '../hooks/use-stressors';

export function Ranking() {
  const navigate = useNavigate();
  const { stressors, moveStressor, reorder, setOrder } = useStressors();

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [pairing, setPairing] = useState(false);

  // Strzałki ↑/↓ na focuście przycisku wiersza — zmieniają kolejność.
  const onArrowKey = (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveStressor(id, -1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveStressor(id, 1);
    }
  };

  return (
    <div className="space-y-6">
      <FunnelStepper current="ranking" />

      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">
          Order from most to least stressful
        </h2>
        <p className="text-sm text-muted-foreground">
          Drag by the handle (☰) or use the ↑↓ arrows on the selected item
          {stressors.length >= 2 ? (
            <>
              {". You can also "}
              <button
                type="button"
                className="font-medium underline"
                onClick={() => setPairing(true)}
              >
                start pairing
              </button>
              .
            </>
          ) : (
            "."
          )}
        </p>
      </div>

      {stressors.length === 0 ? (
        <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No stressors to order. Go back and brain-dump something.
        </p>
      ) : (
        <div role="list" aria-label="Stressors to order" className="space-y-2">
          {stressors.map((s, i) => (
            // Wiersz jest listitem (nie interaktywny), żeby uniknąć zagnieżdżonych
            // kontrolek. Drag (mysz) na całym wierszu; reorder z klawiatury/touch
            // przez jawne przyciski ↑/↓ poniżej.
            // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
            <div
              key={s.id}
              role="listitem"
              aria-label={`Stressor ${i + 1} of ${stressors.length}: ${s.text}`}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIndex(i);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null && dragIndex !== i) reorder(dragIndex, i);
                setDragIndex(null);
                setOverIndex(null);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={cn(
                'flex cursor-grab items-center gap-2 rounded-lg border bg-background px-3 py-2',
                dragIndex === i && 'opacity-40',
                overIndex === i && dragIndex !== i && 'border-ring',
              )}
            >
              <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="w-7 text-sm font-semibold tabular-nums">{i + 1}.</span>
              <span className="min-w-0 flex-1 truncate text-sm" title={s.text}>
                {s.text}
              </span>
              {/* Przyciski ↑↓ — działają też na touch (HTML5 drag nie działa na mobilnym)
                  i są dostępną z klawiatury drogą zmiany kolejności. Gdy przycisk ma focus,
                  strzałki ↑/↓ też przesuwają (zgodnie ze spec). */}
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`Move "${s.text}" up`}
                  disabled={i === 0}
                  onClick={() => moveStressor(s.id, -1)}
                  onKeyDown={(e) => onArrowKey(e, s.id)}
                >
                  <ChevronUp />
                </Button>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`Move "${s.text}" down`}
                  disabled={i === stressors.length - 1}
                  onClick={() => moveStressor(s.id, 1)}
                  onKeyDown={(e) => onArrowKey(e, s.id)}
                >
                  <ChevronDown />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pairing && (
        <PairingFlow
          stressors={stressors}
          onClose={() => setPairing(false)}
          onApply={(ids) => {
            setOrder(ids);
            setPairing(false);
          }}
        />
      )}

      <div className="flex items-center justify-between gap-2 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/capture')}>
          ← Back
        </Button>
        <Button
          type="button"
          size="lg"
          disabled={stressors.length === 0}
          onClick={() => navigate('/decompose')}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
