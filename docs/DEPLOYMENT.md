# BECUGRAM — Deployment & Production Guide

This guide details how to deploy BecuGram on a standard Linux VPS (Ubuntu 22.04 / 24.04 LTS) with 2 GB RAM, external MongoDB Atlas, Node.js 20/22/25, and Nginx reverse proxy.

## 1. Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- MongoDB Atlas Cluster (Free M0 or Dedicated M10)
- Domain or Subdomain pointing to your VPS IP
- Telegram Bot from [@BotFather](https://t.me/BotFather)

## 2. Setting Up Telegram Bot
1. Open Telegram and search for `@BotFather`.
2. Send `/newbot`.
3. Provide the name: `BecuGram Verification Bot`.
4. Provide the username: `becugrambot` (or your chosen unique name).
5. Copy the generated Bot API token into `server/.env`:
   ```env
   TELEGRAM_BOT_TOKEN=7123456789:AAH...
   TELEGRAM_BOT_USERNAME=becugrambot
   ```

## 3. MongoDB Atlas Setup
1. Create a MongoDB Atlas account at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a free M0 cluster.
3. Under **Database Access**, create a user `becu_admin` with read/write privileges.
4. Under **Network Access**, add `0.0.0.0/0` or your VPS IP address.
5. Copy the connection string:
   ```env
   MONGODB_URI=mongodb+srv://becu_admin:<password>@cluster0.abcde.mongodb.net/becugram?retryWrites=true&w=majority
   ```

## 4. Building the Monorepo
From the project root:
```bash
# 1. Install dependencies
npm install

# 2. Build backend and frontend
npm run build
```

This compiles:
- Backend: `server/dist/server.js`
- Frontend: `client/dist/` (static assets)

## 5. Running with PM2 on VPS
```bash
npm install -g pm2
pm2 start server/dist/server.js --name "becugram-backend"
pm2 save
pm2 startup
```

## 6. Nginx Reverse Proxy Configuration
```nginx
server {
    server_name messenger.yourdomain.com;

    # Frontend Static Distribution
    location / {
        root /var/www/becugram/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads Static File Serving
    location /uploads/ {
        proxy_pass http://127.0.0.1:5000;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Real-Time WebSocket Proxy
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

## 7. Android Mobile APK Build (Capacitor)
When ready to produce the Android APK:
```bash
npm install -g @capacitor/cli @capacitor/core @capacitor/android
cd client
npx cap init BecuGram com.becugram.app --web-dir dist
npx cap add android
npm run build
npx cap sync android
npx cap open android
# Build signed APK in Android Studio
```

