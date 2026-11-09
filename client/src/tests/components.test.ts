import { describe, it, expect } from 'vitest';
import { normalizePhoneNumber, formatPhoneDisplay } from '../utils/phone';

describe('BecuGram Client Unit Tests', () => {
  it('normalizes phone number into E.164 properly', () => {
    expect(normalizePhoneNumber('+998 90 123 45 67')).toBe('+998901234567');
    expect(normalizePhoneNumber('901234567')).toBe('+998901234567');
    expect(normalizePhoneNumber('998901234567')).toBe('+998901234567');
  });

  it('formats Uzbekistan phone numbers for clean mobile and desktop display', () => {
    expect(formatPhoneDisplay('+998901234567')).toBe('(+998) 90 123 45 67');
    expect(formatPhoneDisplay('901234567')).toBe('(+998) 90 123 45 67');
  });

  it('handles general international phone display safely', () => {
    expect(formatPhoneDisplay('+14155552671')).toBe('+14155552671');
  });
});

