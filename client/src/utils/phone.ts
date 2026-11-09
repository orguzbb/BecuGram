export function normalizePhoneNumber(rawNumber: string): string {
  let cleaned = rawNumber.trim().replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.length === 9) {
    cleaned = `998${cleaned}`;
  }
  return `+${cleaned}`;
}

export function formatPhoneDisplay(e164: string): string {
  const normalized = normalizePhoneNumber(e164);
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

