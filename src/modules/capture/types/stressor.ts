import type { BaseEntity } from '@/shared/types';

/**
 * Pojedyncza stresująca rzecz wyrzucona z głowy w brain dumpie.
 * Surowy materiał, zanim zostanie rozbity na akcje.
 *
 * Kolejność (rank: najbardziej → najmniej stresujący) jest kanonicznie
 * reprezentowana przez pozycję w tablicy (entry order w brain dumpie,
 * potem ułożona ręcznie lub przez `Pairing` w rankingu).
 */
export interface Stressor extends BaseEntity {
  text: string;
}
