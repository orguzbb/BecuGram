# BECUGRAM — REST API Specification

Base URL: `/api`

All standard responses adhere to the standard envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional status message"
}
```
Error responses:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable explanation",
    "details": [ ... ]
  }
}
```

---

## 1. Authentication Endpoints

### `POST /api/auth/start`
Starts a phone verification challenge.
- **Request Body:**
  ```json
  {
    "phoneNumber": "+998901234567"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "challengeId": "67a123...",
      "pairingToken": "c8f94e2a...",
      "telegramDeepLink": "https://t.me/becugrambot?start=c8f94e2a...",
      "botUsername": "becugrambot",
      "expiresAt": "2026-11-08T18:35:00.000Z",
      "requiresPairing": true
    }
  }
  ```

### `GET /api/auth/status/:challengeId`
Polls pairing and OTP readiness status.
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "challengeId": "67a123...",
      "status": "PAIRED" | "PENDING_PAIRING" | "VERIFIED" | "EXPIRED",
      "attemptsLeft": 5,
      "pairedAt": "2026-11-08T18:25:00.000Z"
    }
  }
  ```

### `POST /api/auth/verify`
Verifies the 6-digit OTP code.
- **Request Body:**
  ```json
  {
    "challengeId": "67a123...",
    "otp": "482916"
  }
  ```
- **Response (200):** Sets HttpOnly refresh token cookie.
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "_id": "67b9...",
        "phoneNumber": "+998901234567",
        "username": "abdurahim",
        "displayName": "Abdurahim",
        "avatar": "/uploads/avatars/user1.jpg",
        "bio": "UI/UX Designer & Tech Enthusiast 🚀",
        "isVerified": true
      },
      "accessToken": "eyJhbGciOi...",
      "isNewUser": false
    }
  }
  ```

### `POST /api/auth/dev-pair` *(Dev & Test Mode Only)*
Simulates Telegram contact verification for local testing without external internet/Telegram API.
- **Request Body:**
  ```json
  {
    "challengeId": "67a123...",
    "telegramUserId": "12345678",
    "telegramChatId": "12345678"
  }
  ```

### `POST /api/auth/refresh`
Rotates refresh token and issues fresh access token.

### `POST /api/auth/logout`
Revokes active session and clears refresh token cookie.

---

## 2. User Endpoints

### `GET /api/users/me`
Retrieves authenticated user profile.

### `PATCH /api/users/me`
Updates profile details: `displayName`, `username`, `bio`, `avatar`, `privacySettings`, `notificationSettings`.

### `GET /api/users/search?q={query}`
Searches users by username, display name, or exact phone number.

### `GET /api/users/:username`
Fetches public profile of a user.

---

## 3. Conversation & Chat Endpoints

### `GET /api/chats`
Lists conversations for the authenticated user, sorted by last message time, including unread count, pinned status, and partner details.

### `POST /api/chats`
Creates or retrieves an existing 1-on-1 private chat.
- **Request Body:** `{ "recipientId": "..." }`

### `GET /api/chats/:id`
Retrieves conversation details.

### `DELETE /api/chats/:id`
Leaves or clears conversation.

### `PATCH /api/chats/:id/pin`
Toggles pinned state of conversation.

### `PATCH /api/chats/:id/mute`
Toggles muted notifications.

---

## 4. Message Endpoints

### `GET /api/chats/:id/messages?cursor={cursor}&limit=30`
Cursor-based pagination of conversation message history.

### `POST /api/chats/:id/messages`
Sends a new message (text, media, audio, document, voice).
- **Request Body:**
  ```json
  {
    "type": "text" | "image" | "video" | "audio" | "voice" | "document",
    "content": "Are you coming today?",
    "media": { "url": "...", "name": "...", "size": 12345 },
    "replyToId": "67b9..."
  }
  ```

### `POST /api/messages/:id/read`
Marks message and all preceding messages in the chat as read.

### `POST /api/messages/:id/react`
Adds or toggles emoji reaction (e.g., "🔥", "❤️", "👍").

### `PATCH /api/messages/:id`
Edits message content (only allowed for sender).

### `DELETE /api/messages/:id`
Soft-deletes message.

---

## 5. Contact Endpoints

### `GET /api/contacts`
Lists saved contacts grouped alphabetically.

### `POST /api/contacts`
Adds user to contacts by user ID or phone number.

### `DELETE /api/contacts/:id`
Removes a contact.

---

## 6. Groups & Communities

### `GET /api/groups`
Lists user's groups and communities.

### `POST /api/groups`
Creates a new group/community with name, description, avatar, and initial members.

### `GET /api/groups/:id`
Gets group details, rules, and participant list.

### `PATCH /api/groups/:id`
Updates group metadata (Admin only).

### `POST /api/groups/:id/members`
Adds members to group.

### `DELETE /api/groups/:id/members/:userId`
Removes member or leaves group.

---

## 7. Media Endpoints

### `POST /api/media/upload`
Multi-part form data upload for images, audio, voice notes, and documents.
- Restricts executable formats.
- Max file size: 25MB.
- Returns `{ url, mimeType, size, originalName }`.

