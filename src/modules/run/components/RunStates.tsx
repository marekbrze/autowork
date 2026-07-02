import { AlertTriangle, Archive, CheckCircle2, RotateCw } from 'lucide-react';

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
      // Earned celebration moment (DESIGN.md motion #1): brand-green wash + scale-in.
      // Pixel face stays reserved for `focus`; here Nunito extrabold carries the joy.
      className="animate-celebrate space-y-4 rounded-xl border border-brand-400/50 bg-brand-300/60 p-6"
      aria-label="Run complete"
    >
      <div className="flex items-center gap-3">
        <CheckCircle2 className="size-10 shrink-0 text-brand-700" aria-hidden />
        <div className="space-y-0.5">
          <h3 className="text-xl font-extrabold tracking-tight text-brand-700">Run complete</h3>
          <p className="text-sm text-muted-foreground">
            Every task in this run is done. Archive it to keep the win in your history.
          </p>
        </div>
      </div>
      <Button type="button" size="lg" onClick={onArchive}>
        <Archive /> Archive this run
      </Button>
    </section>
  );
}
