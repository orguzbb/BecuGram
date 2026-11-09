# BECUGRAM — Phone & Telegram Bot Authentication Flow

## Overview
BecuGram implements a secure, privacy-first authentication system that combines phone number identification with Telegram Bot cryptographic pairing and OTP verification.

This prevents SMS toll fraud, bypasses expensive telecommunication aggregators, and prevents phone-spoofing attacks by requiring explicit verification via Telegram's native `request_contact` protocol.

```mermaid
sequenceDiagram
    autonumber
    actor User as User (BecuGram App)
    participant Client as BecuGram Web/Mobile Client
    participant Server as BecuGram Backend
    participant TG as Telegram Bot (@becugrambot)

    User->>Client: 1. Enters phone number (+998 90 123 45 67)
    Client->>Server: POST /api/auth/start { phoneNumber }
    Server->>Server: Normalize to E.164 (+998901234567)<br/>Generate Challenge ID & Cryptographic Pairing Token
    Server-->>Client: { challengeId, telegramDeepLink, expiresAt }
    
    User->>TG: 2. Opens https://t.me/becugrambot?start=<pairingToken>
    TG->>User: Prompts: "Please share your Telegram contact to verify phone ownership"
    User->>TG: Shares contact via Telegram Keyboard
    TG->>Server: Verifies contact user_id matches sender user_id<br/>Binds telegramChatId & verified phone to Challenge
    
    Server->>Server: Generates cryptographically secure 6-digit OTP<br/>Hashes OTP with bcrypt/sha256 and stores in DB
    Server->>TG: Send OTP message: "BecuGram code: 482 916. Valid for 5 min."
    TG-->>User: Delivers OTP message
    
    User->>Client: 3. Enters 6-digit OTP
    Client->>Server: POST /api/auth/verify { challengeId, otp }
    Server->>Server: Validate hash, expiration, attempt count, and identity binding
    Server-->>Client: Sets HttpOnly Refresh Cookie<br/>Returns { user, accessToken, isNewUser }
```

## Security Safeguards
1. **Never Trust Unverified Input:** A phone number submitted via the web client is marked as `PENDING_PAIRING` until Telegram's native contact verification confirms that the Telegram account transmitting the contact owns that exact MSISDN.
2. **Contact Spoofing Defense:** When the Telegram Bot receives a shared contact, it checks `contact.user_id === message.from.id`. Forwarded or forged contact objects are instantly rejected.
3. **One-Time Password Hashing:** OTP codes are hashed using `crypto.createHash('sha256')` with a server salt before being stored in MongoDB. Raw OTP codes are never logged or stored in plaintext.
4. **Rate Limiting & Expiration:**
   - Challenge lifetime: 10 minutes.
   - OTP lifetime: 5 minutes.
   - Maximum failed attempts: 5 per challenge before permanent invalidation.
   - Resend cool-down: 45 seconds.
5. **Token Issuance & Rotation:**
   - Short-lived Access Token (15 minutes).
   - Long-lived Refresh Token (30 days) with token family rotation and reuse detection.
   - HttpOnly, SameSite=Strict, Secure cookies for browser storage.

