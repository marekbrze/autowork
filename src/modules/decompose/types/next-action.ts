import type { BaseEntity } from '@/shared/types';

/**
 * Kierunek / pomysł, co pchnie stresor do przodu (HOW w `decompose`).
 * Grubszy niż task — zapisany **aktywnym, konkretnym językiem** (czasownik
 * na początku, fizycznie wykonalne; standard ADR 0006). Rozbijany na 1..N
 * `Task` (konkretny next-action = 1 task; gruby = kilka).
 */
export interface NextAction extends BaseEntity {
  stressorId: string;
  text: string;
}
