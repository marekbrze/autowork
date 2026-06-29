import { buildFocusSeed } from './data/focus';
import type { AppData } from './types';

/**
 * Scenariusz `focus` — pełny payoff lejka: 3 stresory z atrybuowanymi taskami
 * (Context/Energy/EstimatedTime) i materiałem motywacyjnym, gotowe do filtrowania
 * sesji. Wybierany z DevToolbar (na dole ekranu).
 */
export function focusScenario(): AppData {
  const seed = buildFocusSeed();
  return {
    'capture:stressors': seed.stressors,
    'decompose:reasons': seed.reasons,
    'decompose:nextActions': seed.nextActions,
    'decompose:tasks': seed.tasks,
    'decompose:doneVisions': Object.fromEntries(seed.doneVisions),
  };
}
