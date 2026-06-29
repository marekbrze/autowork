import { AlertTriangle, RefreshCw, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface StorageStatusToastProps {
  /** Nie udał się ostatni zapis (quota/disabled). */
  writeError: boolean;
  /** Nie udało się odczytać danych przy starcie. */
  readError: boolean;
  onRetry: () => void;
  onDismiss: () => void;
  /** Czego dotyczył odczyt (w komunikacie read-error). Domyślnie „danych". */
  entityLabel?: string;
}

/**
 * Komunikat stanu persystencji — toast (nie banner) wg decyzji designu.
 * Pokazuje się TYLKO gdy jest błąd zapisu/odczytu; w p.p. nic nie renderuje.
 * Współdzielony przez moduły persystujące do LocalStorage (capture, decompose, …).
 */
export function StorageStatusToast({
  writeError,
  readError,
  onRetry,
  onDismiss,
  entityLabel = 'data',
}: StorageStatusToastProps) {
  if (!writeError && !readError) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-16 left-1/2 z-50 flex w-[min(92vw,30rem)] -translate-x-1/2 items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 shadow-lg"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-destructive">
          {writeError ? 'Failed to save changes' : `Failed to load ${entityLabel}`}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {writeError
            ? 'Browser storage may be full or unavailable. Try again.'
            : 'Saved data was corrupted — starting from an empty list.'}
        </p>
        {writeError && (
          <Button type="button" size="xs" variant="outline" className="mt-2" onClick={onRetry}>
            <RefreshCw /> Try again
          </Button>
        )}
      </div>
      <Button
        type="button"
        size="icon-xs"
        variant="ghost"
        aria-label="Dismiss message"
        onClick={onDismiss}
      >
        <X />
      </Button>
    </div>
  );
}
