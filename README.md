# BecuGram — Modern Real-Time Instant Messaging Platform

> *"Connect. Communicate. Belong."*

BecuGram is an independent, real-time messaging application engineered with React 19, TypeScript, Tailwind CSS, Node.js, Express, Socket.IO, and MongoDB Atlas. 

It features native phone number onboarding verified via Telegram Bot cryptographic pairing, end-to-end real-time direct & group messaging, voice messages, media sharing, contact management, rich user profiles, and customizable dark/light aesthetics matching the original design system specification.

---

## Visual Design Reference
The UI/UX is built to replicate the 6 visual screens of the BecuGram design system:
1. **01 | Phone & Bot OTP** — Phone input with Uzbekistan default (+998), Telegram deep-link pairing, 6-digit OTP verification.
2. **02 | Main Inbox** — Filter tabs (All, Personal, Groups, Unread), online badges, unread counter pills, floating compose action.
3. **03 | Private Messaging** — Real-time chat bubbles, quotes/replies, typing indicators, read receipts, reactions, voice player, message composer.
4. **04 | Contacts & Groups** — Alphabetical contacts list with A-Z fast scroller, shortcuts, community & group cards.
5. **05 | Settings** — Account, privacy & security, notifications, theme switchers, accent color palette picker.
6. **06 | User Profile & Media** — Large avatar, user metadata, quick action buttons, tabbed media gallery (Photos, Videos, Files, Links).

---

## Tech Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Zustand, TanStack Query, Socket.IO Client, React Hook Form, Zod, date-fns.
- **Backend:** Node.js, Express, TypeScript, Socket.IO, Mongoose, JWT, Helmet, Pino Logger, Multer.
- **Database:** MongoDB Atlas / Local MongoDB.
- **Real-Time:** WebSockets via Socket.IO with authenticated channels and room authorization.

---

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy the example environment file:
```bash
cp .env.example server/.env
```
*(Optionally provide your own MongoDB Atlas connection URI and Telegram Bot Token)*

### 3. Seed Realistic Demo Data
Populate the database with sample users (Abdurahim, Azizbek, Muhammad, Sardor, etc.), conversations, and messages:
```bash
npm run seed
```

### 4. Run Development Servers
Start both the backend server (port 5000) and the frontend client (port 5173):
```bash
npm run dev
```

Visit: [http://localhost:5173](http://localhost:5173)

---

## Project Structure
```text
becugram/
├── client/          # Vite + React 19 + TypeScript + Tailwind CSS Frontend
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── features/ (authentication, chats, contacts, groups, profile, settings)
│       ├── hooks/
│       ├── layouts/
│       ├── stores/
│       ├── types/
│       └── utils/
├── server/          # Node.js + Express + TypeScript + Socket.IO Backend
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       ├── sockets/
│       ├── storage/
│       └── utils/
├── docs/            # Comprehensive API, Database, Auth & Deployment specs
└── README.md
```

