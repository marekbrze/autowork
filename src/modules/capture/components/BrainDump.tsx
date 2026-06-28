import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { pluralize } from '@/lib/utils';
import { FunnelStepper } from '@/shared/components/FunnelStepper';

import { PromptBanner } from './PromptBanner';
import { StressorItem } from './StressorItem';
import { StorageStatusToast } from './StorageStatusToast';
import { UndoToast } from './UndoToast';
import { useStressors } from '../hooks/use-stressors';
import type { Stressor } from '../types/stressor';

type UndoEntry = { item: Stressor; index: number };

export function BrainDump() {
  const navigate = useNavigate();
  const { stressors, addStressor, updateStressor, deleteStressor, restoreStressor, storage } =
    useStressors();

  const [draft, setDraft] = useState('');
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // Stos undo: kilka szybkich usunięć jest all cofnalnych (nie tylko ostatnie).
  // Ref jest źródłem prawdy dla restore (unikamy efektów ubocznych w updaterze),
  // state odbija stan dla rendera.
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const undoStackRef = useRef<UndoEntry[]>([]);

  const undoTimer = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rowEls = useRef<Map<number, HTMLButtonElement>>(new Map());

  const registerRef = (index: number, el: HTMLButtonElement | null) => {
    if (el) rowEls.current.set(index, el);
    else rowEls.current.delete(index);
  };

  const moveFocus = (from: number, dir: -1 | 1) => {
    rowEls.current.get(from + dir)?.focus();
  };

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    addStressor(text);
    setDraft('');
    inputRef.current?.focus();
  };

  const handleDelete = (id: string) => {
    const idx = stressors.findIndex((s) => s.id === id);
    const removed = deleteStressor(id);
    if (removed) {
      const next = [...undoStackRef.current, removed];
      undoStackRef.current = next;
      setUndoStack(next);
      if (undoTimer.current) window.clearTimeout(undoTimer.current);
      undoTimer.current = window.setTimeout(() => {
        undoStackRef.current = [];
        setUndoStack([]);
      }, 6000);
    }
    // po commicie przenieś focus na sąsiada (lub wróć do pola)
    window.setTimeout(() => {
      const el = rowEls.current.get(idx) ?? rowEls.current.get(idx - 1);
      if (el) el.focus();
      else inputRef.current?.focus();
    }, 0);
  };

  const undoDelete = useCallback(() => {
    const stack = undoStackRef.current;
    if (stack.length === 0) return;
    const last = stack[stack.length - 1];
    restoreStressor(last.item, last.index);
    const next = stack.slice(0, -1);
    undoStackRef.current = next;
    setUndoStack(next);
    if (next.length === 0 && undoTimer.current) {
      window.clearTimeout(undoTimer.current);
    }
  }, [restoreStressor]);

  // Ctrl/Cmd+Z = cofnij ostatnie usunięcie (ADR 0004). W polu tekstowym zostawiamy
  // natywne undo (cofanie wpisywania), żeby nie kolidować z edycją.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isUndo =
        (e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey && !e.altKey;
      if (!isUndo) return;
      const t = e.target as HTMLElement | null;
      const inTextField =
        !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (inTextField) return;
      if (undoStackRef.current.length > 0) {
        e.preventDefault();
        undoDelete();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undoDelete]);

  return (
    <div className="space-y-6">
      <FunnelStepper current="capture" />

      <div className="space-y-2">
        <label htmlFor="brain-dump-input" className="block text-xl font-semibold tracking-tight">
          Co cię teraz stresuje?
        </label>
        <p className="text-sm text-muted-foreground">
          Wyrzuć z głowy wszystko, hasłowo, jedno pod drugim. Enter dodaje.
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
          id="brain-dump-input"
          ref={inputRef}
          className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="np. samochód, wypowiedzenie umowy…"
          autoComplete="off"
          maxLength={300}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' && stressors.length > 0) {
              e.preventDefault();
              rowEls.current.get(0)?.focus();
            }
          }}
        />
        <Button type="submit" size="lg" disabled={!draft.trim()}>
          <Plus />
          Dodaj
        </Button>
      </form>

      <PromptBanner
        onPick={(text) => {
          setDraft(text);
          inputRef.current?.focus();
        }}
      />

      {stressors.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Lista pusta. Wyrzuć pierwszy stresor wyżej — cokolwiek, co ci teraz ciąży. Podpowiedzi
            z banera mogą pomóc zacząć.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {stressors.map((s, i) => (
            <li key={s.id}>
              <StressorItem
                stressor={s}
                index={i}
                isFocused={focusedId === s.id}
                registerRef={registerRef}
                onFocus={setFocusedId}
                onMove={(dir) => moveFocus(i, dir)}
                onDelete={() => handleDelete(s.id)}
                onSave={updateStressor}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-2 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/')}>
          ← Dashboard
        </Button>
        <span className="text-xs text-muted-foreground">
          {stressors.length === 0
            ? 'Dodaj co najmniej jeden stresor, żeby iść dalej'
            : `${stressors.length} ${pluralize(stressors.length, ['stresor', 'stresory', 'stresorów'])}`}
        </span>
        <Button
          type="button"
          size="lg"
          disabled={stressors.length === 0}
          onClick={() => navigate('/capture/ranking')}
        >
          Dalej →
        </Button>
      </div>

      {undoStack.length > 0 && (
        <UndoToast
          text={undoStack[undoStack.length - 1].item.text}
          remaining={undoStack.length}
          onUndo={undoDelete}
        />
      )}

      <StorageStatusToast
        writeError={storage.writeError}
        readError={storage.readError}
        onRetry={storage.retry}
        onDismiss={storage.dismiss}
        entityLabel="stresorów"
      />
    </div>
  );
}
