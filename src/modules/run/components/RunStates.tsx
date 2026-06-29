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
      <h2 className="mt-2 text-lg font-semibold">Nie udało się wczytać runów</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Zapisane dane mogły ulec uszkodzeniu. Odśwież stronę — jeśli problem wróci,
        przełącz scenariusz w pasku deweloperskim.
      </p>
      <Button type="button" variant="outline" className="mt-4" onClick={onReload}>
        <RotateCw /> Odśwież
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
      aria-label="Przejazd ukończony"
    >
      <div>
        <h3 className="font-semibold">Przejazd ukończony</h3>
        <p className="text-sm text-muted-foreground">
          Wszystkie taski w tym Runie są zrobione. Archiwizuj przejazd, by zachować go w historii.
        </p>
      </div>
      <Button type="button" onClick={onArchive}>
        <Archive /> Archiwizuj ten przejazd
      </Button>
    </section>
  );
}
