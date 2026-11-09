import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { normalizePhoneNumber } from '../utils/phone.js';
import { generateSixDigitOtp, hashOtp } from '../utils/otp.js';
import { memoryChallenges } from '../controllers/auth.controller.js';

let botInstance: TelegramBot | null = null;

function getSavedUserPhone(chatId: number | string): string | null {
  try {
    const filePath = path.resolve(process.cwd(), 'telegram_users.json');
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data.byChatId?.[chatId.toString()] || null;
    }
  } catch {}
  return null;
}

function saveUserBinding(phone: string, chatId: number | string, userId?: number | string, firstName?: string) {
  try {
    const filePath = path.resolve(process.cwd(), 'telegram_users.json');
    let data: any = { byChatId: {} };
    if (fs.existsSync(filePath)) {
      try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {}
    }
    if (!data.byChatId) data.byChatId = {};
    data[phone] = {
      chatId: chatId.toString(),
      userId: userId ? userId.toString() : chatId.toString(),
      firstName: firstName || 'User',
      updatedAt: new Date().toISOString(),
    };
    data.byChatId[chatId.toString()] = phone;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    logger.info(`[TELEGRAM BOT] Foydalanuvchi bog'landi: ${phone} <-> Chat ID: ${chatId}`);
  } catch (e) {
    logger.error('Failed to save user binding:', e);
  }
}

function saveOtp(phone: string, otp: string, chatId: number | string) {
  try {
    const filePath = path.resolve(process.cwd(), 'bot_otps.json');
    let store: any = {};
    if (fs.existsSync(filePath)) {
      try {
        store = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {}
    }
    store[phone] = {
      otp,
      chatId: chatId.toString(),
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2));

    // Also update any active memory challenge
    for (const [id, ch] of memoryChallenges.entries()) {
      if (ch.phoneNumber === phone) {
        ch.otpHash = hashOtp(otp);
        ch.status = 'PAIRED';
        ch.pairedAt = new Date();
        ch.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      }
    }
  } catch (e) {
    logger.error('Failed to save OTP:', e);
  }
}

export function initTelegramBot(): TelegramBot | null {
  if (!env.TELEGRAM_BOT_TOKEN) {
    logger.warn('TELEGRAM_BOT_TOKEN is not set. Telegram bot polling disabled.');
    return null;
  }

  // Prevent multiple polling instances
  if (botInstance) {
    return botInstance;
  }

  try {
    botInstance = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: true });
    logger.info(`🤖 BecuGram Telegram Bot polling started as @${env.TELEGRAM_BOT_USERNAME}`);

    botInstance.on('polling_error', (err: any) => {
      // Gracefully log without crashing if another instance is temporarily polling
      if (err.message && err.message.includes('409 Conflict')) {
        logger.warn('Telegram bot polling conflict (another process is running bot). Standalone bot or primary polling active.');
      } else {
        logger.warn(`Telegram polling error: ${err.message || err}`);
      }
    });

    // Handle /start
    botInstance.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const firstName = msg.from?.first_name || 'Foydalanuvchi';

      logger.info(`[BOT /start] Chat ID: ${chatId}, Ism: ${firstName}`);

      // Check if user already registered their phone previously
      const existingPhone = getSavedUserPhone(chatId);

      if (existingPhone) {
        // User already verified before! Send OTP directly, DO NOT ask for number again!
        const otpCode = generateSixDigitOtp();
        const formattedOtp = `${otpCode.slice(0, 3)} ${otpCode.slice(3)}`;
        saveOtp(existingPhone, otpCode, chatId);

        const returnText =
          `👋 *Qaytganingiz bilan, ${firstName}!*\n\n` +
          `Sizning tasdiqlangan raqamingiz: *${existingPhone}*\n\n` +
          `🔐 *BecuGram tasdiqlash kodi:*\n\n` +
          `\`${formattedOtp}\`\n\n` +
          `⏱️ _Bu kod 5 daqiqa davomida amal qiladi. Hech kimga bermang._\n\n` +
          `Ushbu kodni BecuGram ilovasiga kiriting.`;

        try {
          await botInstance?.sendMessage(chatId, returnText, {
            parse_mode: 'Markdown',
            reply_markup: { remove_keyboard: true },
          });
        } catch (err: any) {
          logger.error('[BOT Error]:', err.message);
        }
        return;
      }

      // New user who hasn't shared their number yet
      const welcomeText =
        `👋 *Assalomu alaykum, ${firstName}!*\n\n` +
        `✨ *BecuGram* xavfsizlik va autentifikatsiya botiga xush kelibsiz.\n\n` +
        `BecuGram profilingizga kirish kodini olish uchun, iltimos, pastdagi *"📱 Share My Phone Number"* tugmasini bosing va raqamingizni bir marta tasdiqlang.\n\n` +
        `_Connect. Communicate. Belong._`;

      const keyboard = {
        reply_markup: {
          keyboard: [
            [
              {
                text: '📱 Share My Phone Number',
                request_contact: true,
              },
            ],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
        parse_mode: 'Markdown' as const,
      };

      try {
        await botInstance?.sendMessage(chatId, welcomeText, keyboard);
      } catch (err: any) {
        logger.error('[BOT Error]:', err.message);
      }
    });

    // Handle Contact sharing
    botInstance.on('contact', async (msg) => {
      const chatId = msg.chat.id;
      const contact = msg.contact;
      const fromUser = msg.from;

      if (!contact || !fromUser) return;

      // Anti-spoofing verification
      if (contact.user_id && contact.user_id !== fromUser.id) {
        await botInstance?.sendMessage(
          chatId,
          `❌ Xatolik: Iltimos, faqat o'zingizning Telegram raqamingizni yuboring. Boshqa odamning kontaktini ulashish taqiqlangan.`,
          { reply_markup: { remove_keyboard: true } }
        );
        return;
      }

      const sharedPhone = normalizePhoneNumber(contact.phone_number);
      const firstName = fromUser.first_name || contact.first_name || 'Foydalanuvchi';

      // Permanently save user binding!
      saveUserBinding(sharedPhone, chatId, fromUser.id, firstName);

      // Generate OTP
      const otpCode = generateSixDigitOtp();
      const formattedOtp = `${otpCode.slice(0, 3)} ${otpCode.slice(3)}`;
      saveOtp(sharedPhone, otpCode, chatId);

      const successText =
        `✅ *Raqamingiz muvaffaqiyatli saqlandi!*\n\n` +
        `Telefon: *${sharedPhone}*\n\n` +
        `🔐 *BecuGram tasdiqlash kodi:*\n\n` +
        `\`${formattedOtp}\`\n\n` +
        `⏱️ _Bu kod 5 daqiqa davomida amal qiladi. Hech kimga bermang._\n\n` +
        `Endi ushbu kodni BecuGram ilovasida kiriting. Keyingi safar ilovada raqamingizni kiritishingiz bilanoq kod avtomatik shu yerga keladi!`;

      try {
        await botInstance?.sendMessage(chatId, successText, {
          parse_mode: 'Markdown',
          reply_markup: { remove_keyboard: true },
        });
      } catch (err: any) {
        logger.error('[BOT Contact Error]:', err.message);
      }
    });

    return botInstance;
  } catch (err) {
    logger.error('Failed to initialize Telegram Bot polling:', err);
    return null;
  }
}

export async function sendOtpToTelegram(chatId: string, otpCode: string): Promise<boolean> {
  const formattedOtp = `${otpCode.slice(0, 3)} ${otpCode.slice(3)}`;
  const message =
    `🔐 *BecuGram tasdiqlash kodi:*\n\n` +
    `\`${formattedOtp}\`\n\n` +
    `⏱️ _Bu kod 5 daqiqa davomida amal qiladi. Hech kimga bermang._\n\n` +
    `_Connect. Communicate. Belong._`;

  if (botInstance) {
    try {
      await botInstance.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      return true;
    } catch (err: any) {
      logger.error('Failed to send OTP via botInstance:', err.message);
    }
  }

  // Fallback to direct HTTP fetch if botInstance not active
  try {
    const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
    return res.ok;
  } catch (err: any) {
    logger.error('Direct Telegram API send failed:', err.message);
    return false;
  }
}
