import { useEffect, useRef } from 'react';

interface UseFocusTabTitleArgs {
  /** Czy sesja focus trwa (task pod timerem, running lub paused). */
  active: boolean;
  /** Sformatowany elapsed (np. `12:34`). */
  clock: string;
  /** Czy timer zapauzowany → suffix `· paused`. */
  paused: boolean;
  /** Czy przekroczono oszacowanie → suffix `· over`. */
  over: boolean;
}

const SUFFIX_SEP = ' — ';

/**
 * Pokazuje live elapsed timera w `document.title` podczas aktywnej sesji focus
 * (ADR 0053): `${clock}${ · paused}${ · over} — <tytuł bazowy>`. Poza sesją /
 * w podsumowaniu oraz przy unmount wraca do tytułu bazowego (czytanego przy starcie).
 * Dzięki temu user widzi czas rzutem oka w pasku Edge'a bez wracania na kartę.
 */
export function useFocusTabTitle({ active, clock, paused, over }: UseFocusTabTitleArgs) {
  const baseRef = useRef(document.title);

  // Zapamiętaj tytuł bazowy przy starcie; przywróć go przy unmount.
  useEffect(() => {
    baseRef.current = document.title;
    return () => {
      document.title = baseRef.current;
    };
  }, []);

  useEffect(() => {
    if (!active) {
      document.title = baseRef.current;
      return;
    }
    const tags: string[] = [];
    if (paused) tags.push('paused');
    if (over) tags.push('over');
    const tagPart = tags.length > 0 ? ` · ${tags.join(' · ')}` : '';
    document.title = `${clock}${tagPart}${SUFFIX_SEP}${baseRef.current}`;
  }, [active, clock, paused, over]);
}
