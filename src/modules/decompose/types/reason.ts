import type { BaseEntity, Valence } from '@/shared/types';

/**
 * Powód, dla którego stresor jest dla usera ważny — element materiału
 * motywacyjnego (WHY w `decompose`). Niesie walencję: pozytywną (zysk)
 * lub negatywną (uniknięcie bólu). Tworzony w `decompose`, konsumowany
 * później w `focus` jako przypomnienie „po co to robisz".
 */
export interface Reason extends BaseEntity {
  stressorId: string;
  text: string;
  valence: Valence;
}
