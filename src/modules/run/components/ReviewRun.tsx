import { Link, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StorageStatusToast } from '@/modules/capture/components/StorageStatusToast';

import { useRuns } from '../hooks/use-runs';

/** Ręczny przegląd Runa (ADR 0023): każda pozycja → aktualna (relevant) / do usunięcia (stale). */
export function ReviewRun() {
  const { runId } = useParams<{ runId: string }>();
  const { getRun, setReviewItemStale, clearStaleReviewItems, storage } = useRuns();

  const run = runId ? getRun(runId) : undefined;

  if (!run) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 rounded-lg border border-dashed p-10 text-center">
        <p className="text-sm text-muted-foreground">Nie znaleziono takiego Runa.</p>
        <Link to="/run" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          ← Moje Runy
        </Link>
      </div>
    );
  }

  const staleCount = run.reviewItems.filter((it) => it.stale).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <Link
          to={`/run/${run.id}`}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          ← {run.name}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Przegląd</h1>
        <p className="text-sm text-muted-foreground">
          Przejrzyj, co nadal obowiązuje. Oflaguj przeterminowane, potem je usuń.
        </p>
      </header>

      {run.reviewItems.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Nic do przeglądu — wszystko aktualne.
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {run.reviewItems.map((item) => (
              <li
                key={item.id}
                className={cn(
                  'flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3',
                  item.stale && 'border-dashed bg-muted/40',
                )}
              >
                <div className="min-w-0 space-y-0.5">
                  <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {item.kind === 'stressor' ? 'Stresor' : 'Task'}
                  </span>
                  <span className={cn('text-sm', item.stale && 'text-muted-foreground line-through')}>
                    {item.text}
                  </span>
                </div>

                {/* Toggle: Aktualne / Do usunięcia */}
                <div className="flex shrink-0 overflow-hidden rounded-md border">
                  <button
                    type="button"
                    aria-pressed={!item.stale}
                    onClick={() => setReviewItemStale(run.id, item.id, false)}
                    className={cn(
                      'px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                      !item.stale ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                    )}
                  >
                    Aktualne
                  </button>
                  <button
                    type="button"
                    aria-pressed={item.stale}
                    onClick={() => setReviewItemStale(run.id, item.id, true)}
                    className={cn(
                      'px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                      item.stale ? 'bg-destructive text-destructive-foreground' : 'hover:bg-muted',
                    )}
                  >
                    Do usunięcia
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex justify-end">
            <Button
              variant="destructive"
              disabled={staleCount === 0}
              onClick={() => clearStaleReviewItems(run.id)}
            >
              Usuń przeterminowane{staleCount > 0 ? ` (${staleCount})` : ''}
            </Button>
          </div>
        </>
      )}

      <StorageStatusToast
        writeError={storage.writeError}
        readError={storage.readError}
        onRetry={storage.retry}
        onDismiss={storage.dismiss}
        entityLabel="runa"
      />
    </div>
  );
}
