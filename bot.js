/**
 * BECUGRAM — Standalone Telegram Verification Bot
 * Bot Username: @becugrambot
 * Run: node bot.js
 */

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9290958097:AAFgRfx4G-BEO_SGrknM2WecoutZzQv8ilQ';

console.log('----------------------------------------------------');
console.log('🤖 BecuGram Telegram Bot ishga tushmoqda...');
console.log(`🔑 Bot Token: ${BOT_TOKEN.slice(0, 10)}...`);
console.log('----------------------------------------------------');

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

function normalizePhone(raw) {
  let cleaned = String(raw).trim().replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
  if (cleaned.length === 9) cleaned = '998' + cleaned;
  return '+' + cleaned;
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getSavedUserPhone(chatId) {
  try {
    if (fs.existsSync('telegram_users.json')) {
      const data = JSON.parse(fs.readFileSync('telegram_users.json', 'utf8'));
      return data.byChatId?.[chatId.toString()] || null;
    }
  } catch {}
  return null;
}

function saveUserBinding(phone, chatId, userId, firstName) {
  try {
    let data = { byChatId: {} };
    if (fs.existsSync('telegram_users.json')) {
      data = JSON.parse(fs.readFileSync('telegram_users.json', 'utf8'));
    }
    if (!data.byChatId) data.byChatId = {};
    data[phone] = {
      chatId: chatId.toString(),
      userId: userId ? userId.toString() : chatId.toString(),
      firstName: firstName || 'User',
      updatedAt: new Date().toISOString(),
    };
    data.byChatId[chatId.toString()] = phone;
    fs.writeFileSync('telegram_users.json', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to save user binding:', e);
  }
}

function saveOtp(phone, otp, chatId) {
  try {
    let store = {};
    if (fs.existsSync('bot_otps.json')) {
      store = JSON.parse(fs.readFileSync('bot_otps.json', 'utf8'));
    }
    store[phone] = {
      otp,
      chatId: chatId.toString(),
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync('bot_otps.json', JSON.stringify(store, null, 2));
  } catch (e) {
    console.error('Failed to save OTP:', e);
  }
}

// Handle /start command
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'Foydalanuvchi';

  console.log(`[BOT /start] Chat ID: ${chatId}, Foydalanuvchi: ${firstName}`);

  // Check if this user already shared their phone number previously
  const existingPhone = getSavedUserPhone(chatId);

  if (existingPhone) {
    // User is already registered! Immediately generate fresh OTP and send
    const otpCode = generateOtp();
    const formattedOtp = `${otpCode.slice(0, 3)} ${otpCode.slice(3)}`;
    saveOtp(existingPhone, otpCode, chatId);

    console.log(`[BOT] Avval ro'yxatdan o'tgan foydalanuvchi: ${existingPhone} -> Yangi OTP: ${otpCode}`);

    const existingUserText =
      `👋 *Qaytganingiz bilan, ${firstName}!*\n\n` +
      `Sizning tasdiqlangan raqamingiz: *${existingPhone}*.\n\n` +
      `🔐 *BecuGram tasdiqlash kodi:*\n\n` +
      `\`${formattedOtp}\`\n\n` +
      `⏱️ _Bu kod 5 daqiqa davomida amal qiladi. Hech kimga bermang._\n\n` +
      `Ushbu kodni BecuGram ilovasidagi oyna maydoniga kiriting.`;

    try {
      await bot.sendMessage(chatId, existingUserText, {
        parse_mode: 'Markdown',
        reply_markup: { remove_keyboard: true },
      });
      return;
    } catch (err) {
      console.error('[BOT Xatolik]:', err.message);
    }
  }

  // If new user who has never shared contact before:
  const welcomeText = 
    `👋 *Assalomu alaykum, ${firstName}!*\n\n` +
    `✨ *BecuGram* xavfsizlik va autentifikatsiya botiga xush kelibsiz.\n\n` +
    `BecuGram profilingizga kirish kodini olish uchun, iltimos, pastdagi *"📱 Share My Phone Number"* tugmasini bir marta bosing va telefon raqamingizni tasdiqlang.\n\n` +
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
    parse_mode: 'Markdown',
  };

  try {
    await bot.sendMessage(chatId, welcomeText, keyboard);
    console.log(`[BOT] Kontakt so'rovi yuborildi: ${chatId}`);
  } catch (err) {
    console.error('[BOT Xatolik /start]:', err.message);
  }
});

// Handle Contact sharing
bot.on('contact', async (msg) => {
  const chatId = msg.chat.id;
  const contact = msg.contact;
  const fromUser = msg.from;

  if (!contact) return;

  console.log(`[BOT Kontakt] Qabul qilindi: ${contact.phone_number} (User ID: ${fromUser.id})`);

  // Anti-spoofing check
  if (contact.user_id && contact.user_id !== fromUser.id) {
    await bot.sendMessage(
      chatId,
      '❌ *Xatolik:* Siz o\'zingizning shaxsiy kontaktingizni yuborishingiz kerak!',
      { parse_mode: 'Markdown', reply_markup: { remove_keyboard: true } }
    );
    return;
  }

  const normalizedPhone = normalizePhone(contact.phone_number);
  const otpCode = generateOtp();
  const formattedOtp = `${otpCode.slice(0, 3)} ${otpCode.slice(3)}`;

  // Save binding permanently & save OTP
  saveUserBinding(normalizedPhone, chatId, fromUser.id, fromUser.first_name);
  saveOtp(normalizedPhone, otpCode, chatId);

  console.log('====================================================');
  console.log(`✅ TASDIQLANDI VA SAQLANDI: ${normalizedPhone} (Chat ID: ${chatId})`);
  console.log(`🔢 YARATILGAN OTP KOD: ${otpCode}`);
  console.log('====================================================');

  const otpMessage = 
    `🎉 *Telefon raqamingiz muvaffaqiyatli saqlandi!*\n\n` +
    `Raqam: *${normalizedPhone}*\n\n` +
    `🔐 *BecuGram tasdiqlash kodi:*\n\n` +
    `\`${formattedOtp}\`\n\n` +
    `⏱️ _Bu kod 5 daqiqa davomida amal qiladi. Hech kimga bermang._\n\n` +
    `Endi BecuGram saytiga o'tib, ushbu kodni kiriting!`;

  try {
    await bot.sendMessage(chatId, otpMessage, {
      parse_mode: 'Markdown',
      reply_markup: { remove_keyboard: true },
    });
    console.log(`[BOT] OTP kod yuborildi (${normalizedPhone}) -> ${otpCode}`);
  } catch (err) {
    console.error('[BOT Xatolik OTP]:', err.message);
  }
});

bot.on('polling_error', (error) => {
  if (error.code !== 'EFATAL') {
    // suppress minor polling reconnects
  }
});

console.log('🚀 @becugrambot muvaffaqiyatli ishga tushdi va xabarlarni kutmoqda!');
console.log('Telegramda @becugrambot ni oching va /start bosing.');
