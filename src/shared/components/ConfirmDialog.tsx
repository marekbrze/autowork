import { useEffect, useId, useRef } from 'react';

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
 * AlertDialog-style potwierdzenie akcji niszczącej. Hand-built, w stylu modali
 * w projekcie: Escape i klik w tło = anuluj; fokus trafia na pierwszy przycisk
 * („Anuluj" — najmniej destruktywna akcja, Enter nie usuwa). Współdzielony przez
 * moduły (decompose, process). Wybór designu: potwierdzenie, nie undo (odmiennie
 * niż capture/ADR 0004). `useId` zapewnia unikalne aria-id w wielu instancjach.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const titleId = `${reactId}-title`;
  const descId = `${reactId}-desc`;

  // Przenieś fokus do dialogu (na „Anuluj") przy otwarciu.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => panelRef.current?.querySelector('button')?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  // Escape = anuluj (spójnie z resztą modali w projekcie).
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
      onClick={(e) => {
        // Klik w tło (nie w panel) = anuluj; klik w panelu się nie propaguje.
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-sm space-y-4 rounded-xl border bg-background p-6 shadow-xl"
      >
        <div className="space-y-1.5">
          <h3 id={titleId} className="text-lg font-semibold leading-tight">
            {title}
          </h3>
          <p id={descId} className="text-sm text-muted-foreground">
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
