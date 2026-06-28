import { useEffect, useRef, useState } from 'react';

interface TaskNameEditorProps {
  initial: string;
  /** Zapisz (Enter) — tylko niepusty, przycięty tekst. */
  onSave: (text: string) => void;
  /** Anuluj (Esc / utrata focusu) — zostawia oryginał. */
  onCancel: () => void;
}

/**
 * Inline-edycja tekstu taska (Edit Task w scope `process`). Wchodzi w miejsce
 * nazwy; Enter zapisuje, Esc / blur anuluje. Pusty draft też anuluje (nie usuwa
 * po cichu — spójnie z `decompose`). Autofocus + zaznaczenie całego tekstu.
 */
export function TaskNameEditor({ initial, onSave, onCancel }: TaskNameEditorProps) {
  const [text, setText] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const save = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    const trimmed = text.trim();
    if (trimmed) onSave(trimmed);
    else onCancel();
  };

  const cancel = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onCancel();
  };

  return (
    <input
      ref={inputRef}
      value={text}
      aria-label="Edycja nazwy zadania"
      onChange={(e) => setText(e.target.value)}
      // stopPropagation: globalny handler ProcessView ma nie łapać Enter/Esc z inputu
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          e.preventDefault();
          save();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          cancel();
        }
      }}
      onBlur={cancel}
      className="w-full rounded-md border border-ring bg-background px-2 py-1 text-xl font-semibold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    />
  );
}
