import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Polska pluralizacja: `pluralize(n, ['jeden', 'dwa-trzy-cztery', 'pięć'])`.
 * Np. pluralize(1, ['stresor','stresory','stresorów']) → "stresor",
 *     pluralize(3, ...) → "stresory", pluralize(5, ...) → "stresorów".
 */
export function pluralize(n: number, forms: [one: string, few: string, many: string]): string {
  if (n === 1) return forms[0];
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return forms[1];
  return forms[2];
}
