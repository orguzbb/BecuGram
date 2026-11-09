import crypto from 'crypto';

/**
 * Generates a cryptographically random 6-digit numeric OTP.
 */
export function generateSixDigitOtp(): string {
  // Generate random integer between 100000 and 999999
  const randomBuffer = crypto.randomBytes(4);
  const randomNumber = randomBuffer.readUInt32BE(0);
  const otpNumber = 100000 + (randomNumber % 900000);
  return otpNumber.toString();
}

/**
 * Hashes an OTP with a server secret salt for safe database storage.
 */
export function hashOtp(otp: string): string {
  return crypto
    .createHmac('sha256', process.env.JWT_ACCESS_SECRET || 'becugram_otp_salt_secret')
    .update(otp)
    .digest('hex');
}

/**
 * Validates a submitted OTP against the stored hash.
 */
export function verifyOtpHash(submittedOtp: string, storedHash: string): boolean {
  const computedHash = hashOtp(submittedOtp);
  // Constant-time buffer comparison to prevent timing attacks
  const bufA = Buffer.from(computedHash, 'utf8');
  const bufB = Buffer.from(storedHash, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generates a high-entropy URL-safe pairing token.
 */
export function generatePairingToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

