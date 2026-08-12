import { useEffect, useRef, useState } from 'react';

interface TaskNameEditorProps {
  initial: string;
  /** Save (Enter) — only non-empty, trimmed text. */
  onSave: (text: string) => void;
  /** Cancel (Esc / blur) — leaves the original. */
  onCancel: () => void;
}

/**
 * Inline-edycja tekstu taska (Edit Task w scope `process`). Wchodzi w miejsce
 * of the name; Enter saves, Esc / blur cancels. An empty draft also cancels (it doesn't
 * silently delete — consistent with `decompose`). Autofocus + select all the text.
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
      aria-label="Edit task name"
      onChange={(e) => setText(e.target.value)}
      // stopPropagation: the global ProcessView handler must not catch Enter/Esc from the input
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
