import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * English pluralization: `pluralize(n, ['one', 'other'])`.
 * E.g. pluralize(1, ['stressor','stressors']) → "stressor",
 *      pluralize(3, ...) → "stressors".
 */
export function pluralize(n: number, forms: [one: string, other: string]): string {
  return n === 1 ? forms[0] : forms[1];
}
