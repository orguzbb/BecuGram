import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/error.js';

export function createApp(): Express {
  const app = express();

  // Security Middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // Allows flexible avatar/media rendering
    })
  );

  // CORS Configuration
  const allowedOrigins = [
    env.CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Permissive in dev mode for Capacitor mobile apps
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Rate Limiting on API endpoints
  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP. Please try again later.',
      },
    },
  });

  app.use('/api', limiter);

  // Body parsers & Cookies
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Static files for media uploads
  const uploadsDir = path.resolve(process.cwd(), env.STORAGE_LOCAL_PATH);
  app.use('/uploads', express.static(uploadsDir));

  // Mount API Router
  app.use('/api', apiRouter);

  // Serve static files for frontend production build
  const clientDist = path.resolve(process.cwd(), 'client', 'dist');
  app.use(express.static(clientDist));

  // Root / route handler (redirects to client dev URL or serves client dist)
  app.get('/', (req, res) => {
    const indexPath = path.join(clientDist, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.redirect(env.CLIENT_URL || 'http://localhost:5173');
    }
  });

  // Catch-all for SPA navigation (excluding /api, /uploads, /socket.io)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) {
      return next();
    }
    const indexPath = path.join(clientDist, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.redirect(env.CLIENT_URL || 'http://localhost:5173');
    }
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

