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
          Ułóż od najbardziej do najmniej stresującego
        </h2>
        <p className="text-sm text-muted-foreground">
          Przeciągnij uchwytem (☰) albo użyj strzałek ↑↓ na zaznaczonym wpisie
          {stressors.length >= 2 ? (
            <>
              {'. Możesz też '}
              <button
                type="button"
                className="font-medium underline"
                onClick={() => setPairing(true)}
              >
                uruchomić parowanie
              </button>
              .
            </>
          ) : (
            '.'
          )}
        </p>
      </div>

      {stressors.length === 0 ? (
        <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Brak stresorów do ułożenia. Wróć i wyrzuć coś z głowy.
        </p>
      ) : (
        <div role="list" aria-label="Stresory do ułożenia" className="space-y-2">
          {stressors.map((s, i) => (
            // Wiersz jest listitem (nie interaktywny), żeby uniknąć zagnieżdżonych
            // kontrolek. Drag (mysz) na całym wierszu; reorder z klawiatury/touch
            // przez jawne przyciski ↑/↓ poniżej.
            // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
            <div
              key={s.id}
              role="listitem"
              aria-label={`Stresor ${i + 1} z ${stressors.length}: ${s.text}`}
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
                  aria-label={`Przesuń „${s.text}" wyżej`}
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
                  aria-label={`Przesuń „${s.text}" niżej`}
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
          ← Wstecz
        </Button>
        <Button
          type="button"
          size="lg"
          disabled={stressors.length === 0}
          onClick={() => navigate('/decompose')}
        >
          Dalej →
        </Button>
      </div>
    </div>
  );
}
