import { AlertTriangle, RefreshCw, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface StorageStatusToastProps {
  /** The last write failed (quota/disabled). */
  writeError: boolean;
  /** Reading data at startup failed. */
  readError: boolean;
  onRetry: () => void;
  onDismiss: () => void;
  /** What the read concerned (in the read-error message). Defaults to "data". */
  entityLabel?: string;
}

/**
 * Persistence-status message — a toast (not a banner) per the design decision.
 * Shows ONLY when there is a read/write error; otherwise it renders nothing.
 * Shared by modules that persist to LocalStorage (capture, decompose, …).
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
