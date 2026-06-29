import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PartyPopper } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BatteryIcon } from '@/modules/process/components/BatteryIcon';
import type { Context, Energy } from '@/modules/decompose/types/task';

import { CONTEXT_LABELS, CONTEXT_ORDER, ENERGY_LABELS, ENERGY_ORDER, type FilterSelection } from '../types/focus';

interface SessionFilterProps {
  selection: FilterSelection;
  onSelectionChange: (sel: FilterSelection) => void;
  /** Ile pending tasków z atrybutami pasuje do bieżącego filtra. */
  matchCount: number;
  /** Wszystkie pending taski z atrybutami (do komunikatu „brak czego opisać"). */
  totalAttributed: number;
  /** Atrybuowane taski już rozwiązane (done/skipped/dismissed) — do rozdzielenia
   * empty-state (#4): „nic nie opisano" vs „wszystko zrobione". */
  resolvedAttributed: number;
  onStart: () => void;
}

/**
 * Ekran wyboru sesji (krok 5). Jeden ekran: multi-select kontekstów + energii,
 * licznik dopasowanych na żywo, duży „Zacznij" (zablokowany przy braku wyboru
 * lub 0 dopasowań + info). Prezentacyjny — stan filtra trzymany przez rodzica.
 */
export function SessionFilter({
  selection,
  onSelectionChange,
  matchCount,
  totalAttributed,
  resolvedAttributed,
  onStart,
}: SessionFilterProps) {
  const isAllContexts = selection.contexts.length === CONTEXT_ORDER.length;
  const isAllEnergies = selection.energies.length === ENERGY_ORDER.length;

  const toggleAllContexts = () =>
    onSelectionChange({ contexts: isAllContexts ? [] : [...CONTEXT_ORDER], energies: selection.energies });

  const toggleAllEnergies = () =>
    onSelectionChange({ contexts: selection.contexts, energies: isAllEnergies ? [] : [...ENERGY_ORDER] });

  const toggleContext = (c: Context) => {
    // W trybie „Wszystkie" kliknięcie konkretnej opcji zawęża do niej samej.
    if (isAllContexts) {
      onSelectionChange({ contexts: [c], energies: selection.energies });
      return;
    }
    const has = selection.contexts.includes(c);
    onSelectionChange({
      contexts: has ? selection.contexts.filter((x) => x !== c) : [...selection.contexts, c],
      energies: selection.energies,
    });
  };

  const toggleEnergy = (e: Energy) => {
    if (isAllEnergies) {
      onSelectionChange({ contexts: selection.contexts, energies: [e] });
      return;
    }
    const has = selection.energies.includes(e);
    onSelectionChange({
      contexts: selection.contexts,
      energies: has ? selection.energies.filter((x) => x !== e) : [...selection.energies, e],
    });
  };

  const nothingSelected = selection.contexts.length === 0 || selection.energies.length === 0;
  const canStart = !nothingSelected && matchCount > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Sesja focus</h2>
        <p className="text-sm text-muted-foreground">
          Wybierz, jakimi zadaniami chcesz się teraz zająć — kontekst(y) i energię. Filtr wskaże, co realnie możesz zrobić.
        </p>
      </div>

      {totalAttributed === 0 ? (
        resolvedAttributed > 0 ? (
          // #4: taski opisane są, ale wszystkie rozwiązane — to nie brak danych,
          // tylko koniec lejka. Mylny komunikat „brak atrybutów" był frustrujący.
          <div className="rounded-lg border border-dashed p-10 text-center">
            <PartyPopper className="mx-auto size-6 text-muted-foreground" aria-hidden />
            <p className="mt-2 text-sm">
              <strong>Wszystkie zadania zrobione — brawo.</strong>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nie ma nic do zrobienia w tym filtrze. Dodaj lub opisz kolejne zadania w procesowaniu.
            </p>
            <Link to="/process" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4')}>
              Przejdź do procesowania
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Brak zadań opisanych atrybutami. Najpierw przypisz kontekst, energię i czas w{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">procesowaniu</code>.
            </p>
          </div>
        )
      ) : (
        <>
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Kontekst</legend>
            <div className="flex flex-wrap items-center gap-2">
              <Chip selected={isAllContexts} onClick={toggleAllContexts}>
                Wszystkie
              </Chip>
              <span aria-hidden className="h-4 w-px bg-border" />
              {CONTEXT_ORDER.map((c) => (
                <Chip key={c} selected={selection.contexts.includes(c)} onClick={() => toggleContext(c)}>
                  {CONTEXT_LABELS[c]}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Energia</legend>
            <div className="flex flex-wrap items-center gap-2">
              <Chip selected={isAllEnergies} onClick={toggleAllEnergies}>
                Wszystkie
              </Chip>
              <span aria-hidden className="h-4 w-px bg-border" />
              {ENERGY_ORDER.map((e) => (
                <Chip key={e} selected={selection.energies.includes(e)} onClick={() => toggleEnergy(e)}>
                  <BatteryIcon level={e} className="mr-1.5" />
                  {ENERGY_LABELS[e]}
                </Chip>
              ))}
            </div>
          </fieldset>

          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            {nothingSelected ? (
              <span className="text-muted-foreground">Wybierz co najmniej jeden kontekst i jeden poziom energii.</span>
            ) : matchCount === 0 ? (
              <span className="text-muted-foreground">Brak zadań pasujących do filtra — zmień wybór.</span>
            ) : (
              <span>
                <span className="font-semibold tabular-nums">{matchCount}</span> {pluralZadanie(matchCount)} pasuje do filtra.
              </span>
            )}
          </div>

          <Button type="button" size="lg" disabled={!canStart} onClick={onStart}>
            Zacznij
          </Button>
        </>
      )}
    </div>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:bg-muted',
      )}
    >
      {children}
    </button>
  );
}

/** Polska odmiana „zadanie". */
function pluralZadanie(n: number): string {
  if (n === 1) return 'zadanie';
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'zadania';
  return 'zadań';
}
