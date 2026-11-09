import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocketIO } from './sockets/index.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  try {
    // 1. Initialize Express App & HTTP Server
    const app = createApp();
    const server = http.createServer(app);

    // 2. Initialize Socket.IO
    initSocketIO(server, env.CLIENT_URL);
    logger.info('Real-time Socket.IO engine initialized.');

    // 3. Start HTTP Server immediately so port 5000 is ready without delay
    server.listen(env.PORT, () => {
      logger.info(`🚀 BecuGram Server is running on http://localhost:${env.PORT}`);
      logger.info(`📡 Client Origin: ${env.CLIENT_URL}`);
      logger.info(`✨ Mode: ${env.NODE_ENV}`);
    });

    // 4. Connect Database asynchronously (non-blocking fallback to local JSON/memory)
    connectDB().catch(() => {
      logger.warn('⚠️ MongoDB is not running locally. Starting in Zero-Config Dev Mode with local JSON storage.');
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Gracefully shutting down BecuGram server...`);
      server.close(async () => {
        await disconnectDB();
        logger.info('Server closed. Process terminating cleanly.');
        process.exit(0);
      });

      // Force exit after 10s if shutdown hangs
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    logger.error('Fatal startup error:', err);
    process.exit(1);
  }
}

bootstrap();

