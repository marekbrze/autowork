import { AlertTriangle, Archive, RotateCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Stany pomocnicze `run` wydzielone jako komponenty prezentacyjne — żeby każdy
 * miał osobną story (read-error / completed). Neutralne shadcn — celebracyjna
 * oprawa wizualna to przyszły `proto-design`.
 */

interface RunReadErrorProps {
  onReload: () => void;
}

/**
 * Stan błędu odczytu storage (LE-1). Gdy `readError`, hook fallbackuje do `[]`,
 * co bez tego stanu pokazywało mylny empty-state listy („brak runów"). Tu: jasny
 * komunikat awarii + odśwież (localStorage czytany raz, przy starcie).
 */
export function RunReadError({ onReload }: RunReadErrorProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/40 bg-destructive/10 p-8 text-center"
    >
      <AlertTriangle className="mx-auto size-6 text-destructive" aria-hidden />
      <h2 className="mt-2 text-lg font-semibold">Couldn't load your runs</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Saved data may be corrupted. Refresh the page — if it keeps happening,
        switch scenarios in the dev toolbar.
      </p>
      <Button type="button" variant="outline" className="mt-4" onClick={onReload}>
        <RotateCw /> Refresh
      </Button>
    </div>
  );
}

interface RunCompletedProps {
  onArchive: () => void;
}

/**
 * Stan ukończonego Runa (ST-1). Wszystkie taski zrobione → celebracja + naturalna
 * następna akcja (archiwizuj). Zastępuje sekcję „Kontynuuj" na Szczegółach, bo
 * kontynuacja nie ma sensu, gdy nie ma już nic do zrobienia.
 */
export function RunCompleted({ onArchive }: RunCompletedProps) {
  return (
    <section
      className="space-y-3 rounded-lg border bg-muted/30 p-4"
      aria-label="Run complete"
    >
      <div>
        <h3 className="font-semibold">Run complete</h3>
        <p className="text-sm text-muted-foreground">
          All tasks in this run are done. Archive it to keep it in your history.
        </p>
      </div>
      <Button type="button" onClick={onArchive}>
        <Archive /> Archive this run
      </Button>
    </section>
  );
}
