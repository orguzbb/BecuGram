import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env or server/.env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server', '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().default('5000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/becugram'),
  
  JWT_ACCESS_SECRET: z.string().min(16).default('becugram_jwt_access_secret_key_min_32_chars_long_2026'),
  JWT_REFRESH_SECRET: z.string().min(16).default('becugram_jwt_refresh_secret_key_min_32_chars_long_2026'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  TELEGRAM_BOT_USERNAME: z.string().default('becugrambot'),
  TELEGRAM_BOT_TOKEN: z.string().default(''),
  
  // Eskiz.uz SMS Provider
  ESKIZ_EMAIL: z.string().default(process.env.ESKIZ_EMAIL || ''),
  ESKIZ_PASSWORD: z.string().default(process.env.ESKIZ_PASSWORD || ''),
  ESKIZ_FROM: z.string().default(process.env.ESKIZ_FROM || '4546'),
  
  ENABLE_DEV_OTP_AUTOFILL: z.string().default('true').transform((val) => val === 'true'),
  
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./uploads'),
  MAX_FILE_SIZE_MB: z.string().default('25').transform(Number),
  
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX: z.string().default('300').transform(Number),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment configuration:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;

