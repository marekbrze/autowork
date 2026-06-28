import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * AlertDialog-style potwierdzenie akcji niszczącej w `decompose` (usuwanie
 * next-actionu z taskami, usuwanie powodu). Hand-built, w stylu `DecomposeModal`:
 * Escape i klik w tło = anuluj; fokus trafia na „Anuluj" (najmniej destruktywna
 * akcja — Enter nie usuwa). Wybór designu: potwierdzenie, nie undo (odmiennie
 * niż capture/ADR 0004).
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Usuń',
  cancelLabel = 'Anuluj',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Przenieś fokus do dialogu (na „Anuluj") przy otwarciu.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => panelRef.current?.querySelector('button')?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  // Escape = anuluj (spójnie z `DecomposeModal`).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="decompose-confirm-title"
        aria-describedby="decompose-confirm-desc"
        className="w-full max-w-sm space-y-4 rounded-xl border bg-background p-6 shadow-xl"
      >
        <div className="space-y-1.5">
          <h3 id="decompose-confirm-title" className="text-lg font-semibold leading-tight">
            {title}
          </h3>
          <p id="decompose-confirm-desc" className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
