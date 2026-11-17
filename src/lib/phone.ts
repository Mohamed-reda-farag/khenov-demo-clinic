import { toLatinDigits } from './text';

/** Digits only, Latin numerals. */
export function normalizePhone(input: string): string {
  return toLatinDigits(input).replace(/\D/g, '');
}

/** Egyptian mobile: 11 digits, 010 / 011 / 012 / 015. */
export function isValidEgyptianMobile(input: string): boolean {
  return /^01[0125]\d{8}$/.test(normalizePhone(input));
}
