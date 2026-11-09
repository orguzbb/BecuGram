import { describe, it, expect } from 'vitest';
import { normalizePhoneNumber, isValidPhoneNumber, formatPhoneDisplay } from '../utils/phone.js';
import { generateSixDigitOtp, hashOtp, verifyOtpHash, generatePairingToken } from '../utils/otp.js';

describe('BecuGram Authentication & Phone Utils', () => {
  it('should correctly normalize Uzbekistan and international phone numbers into E.164', () => {
    expect(normalizePhoneNumber('+998 90 123 45 67')).toBe('+998901234567');
    expect(normalizePhoneNumber('998901234567')).toBe('+998901234567');
    expect(normalizePhoneNumber('901234567')).toBe('+998901234567');
    expect(normalizePhoneNumber('+1 (555) 234-5678')).toBe('+15552345678');
  });

  it('should validate E.164 phone numbers accurately', () => {
    expect(isValidPhoneNumber('+998901234567')).toBe(true);
    expect(isValidPhoneNumber('+14155552671')).toBe(true);
    expect(isValidPhoneNumber('12345')).toBe(false);
    expect(isValidPhoneNumber('not-a-number')).toBe(false);
  });

  it('should format phone numbers into clean presentation string', () => {
    expect(formatPhoneDisplay('+998901234567')).toBe('(+998) 90 123 45 67');
  });

  it('should generate secure 6-digit OTP codes and verify hashes', () => {
    const otp = generateSixDigitOtp();
    expect(otp).toMatch(/^\d{6}$/);

    const hash = hashOtp(otp);
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64); // SHA-256 hex string

    // Correct verification
    expect(verifyOtpHash(otp, hash)).toBe(true);
    // Invalid code verification
    expect(verifyOtpHash('000000', hash)).toBe(false);
  });

  it('should generate high entropy pairing tokens for Telegram bot deep links', () => {
    const token1 = generatePairingToken();
    const token2 = generatePairingToken();
    expect(token1).toBeDefined();
    expect(token1.length).toBeGreaterThan(20);
    expect(token1).not.toBe(token2);
  });
});

