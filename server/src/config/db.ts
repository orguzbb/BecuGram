import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDB(): Promise<typeof mongoose> {
  // Prevent Mongoose from hanging indefinitely on buffering when offline
  mongoose.set('bufferCommands', false);

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 1500,
      socketTimeoutMS: 10000,
    });

    logger.info(`MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB runtime connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection disconnected.');
    });

    return conn;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    // In local development or if MongoDB Atlas is not yet configured,
    // we log actionable advice instead of crashing ungracefully.
    logger.warn('Please ensure MONGODB_URI is properly configured in server/.env (e.g. MongoDB Atlas connection string)');
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected cleanly.');
}

