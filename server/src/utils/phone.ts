/**
 * Normalizes phone numbers to standard E.164 format.
 * Uzbekistan standard: +998 XX XXX XX XX -> +998XXXXXXXXX
 */
export function normalizePhoneNumber(rawNumber: string): string {
  // Strip all non-digit characters except leading '+'
  let cleaned = rawNumber.trim().replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Handle local Uzbekistan 9-digit format (e.g. 901234567 -> 998901234567)
  if (cleaned.length === 9) {
    cleaned = `998${cleaned}`;
  }

  return `+${cleaned}`;
}

export function isValidPhoneNumber(phoneNumber: string): boolean {
  const normalized = normalizePhoneNumber(phoneNumber);
  // Standard E.164 validation: 10 to 15 digits
  const regex = /^\+[1-9]\d{9,14}$/;
  return regex.test(normalized);
}

export function formatPhoneDisplay(e164: string): string {
  const normalized = normalizePhoneNumber(e164);
  // Special formatting for Uzbekistan (+998 XX XXX XX XX)
  if (normalized.startsWith('+998') && normalized.length === 13) {
    const code = normalized.substring(0, 4);
    const op = normalized.substring(4, 6);
    const p1 = normalized.substring(6, 9);
    const p2 = normalized.substring(9, 11);
    const p3 = normalized.substring(11, 13);
    return `(${code}) ${op} ${p1} ${p2} ${p3}`;
  }
  return normalized;
}

