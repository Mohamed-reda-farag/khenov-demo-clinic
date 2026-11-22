import { toLatinDigits } from './text';

/** Digits only, Latin numerals. */
export function normalizePhone(input: string): string {
  return toLatinDigits(input).replace(/\D/g, '');
}

/** Egyptian mobile: 11 digits, 010 / 011 / 012 / 015. */
export function isValidEgyptianMobile(input: string): boolean {
  return /^01[0125]\d{8}$/.test(normalizePhone(input));
}

/** True when the query is made of digits and appears in the phone number. */
export function phoneMatches(query: string, phone: string): boolean {
  const digits = normalizePhone(query);
  return digits.length >= 2 && phone.includes(digits);
}
