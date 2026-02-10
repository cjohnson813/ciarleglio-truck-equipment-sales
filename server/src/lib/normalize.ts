/**
 * Normalize email: lowercase, trim.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Normalize phone: digits only (E.164-style without leading +).
 * Strips spaces, dashes, dots, parens.
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits;
}
