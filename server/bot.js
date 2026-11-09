/**
 * BECUGRAM — Standalone Telegram Verification Bot
 * Bot Username: @becugrambot
 * Run: node bot.js
 */

const TelegramBot = require('node-telegram-bot-api');

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

bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'Foydalanuvchi';
  const pairingToken = match ? match[1] : null;

  console.log(`[BOT /start] Chat ID: ${chatId}, Foydalanuvchi: ${firstName}, Token: ${pairingToken || 'yo\'q'}`);

  const welcomeText = 
    `👋 *Assalomu alaykum, ${firstName}!*\n\n` +
    `✨ *BecuGram* xavfsizlik va autentifikatsiya botiga xush kelibsiz.\n\n` +
    `BecuGram profilingizga kirish kodini olish uchun, iltimos, pastdagi *"📱 Share My Phone Number"* tugmasini bosing va telefon raqamingizni tasdiqlang.\n\n` +
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
    console.log(`[BOT] /start javobi yuborildi: ${chatId}`);
  } catch (err) {
    console.error('[BOT Xatolik /start]:', err.message);
  }
});

bot.on('contact', async (msg) => {
  const chatId = msg.chat.id;
  const contact = msg.contact;
  const fromUser = msg.from;

  if (!contact) return;

  console.log(`[BOT Kontakt] Qabul qilindi: ${contact.phone_number} (User ID: ${fromUser.id})`);

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

  console.log('====================================================');
  console.log(`✅ TASDIQLANDI: ${normalizedPhone}`);
  console.log(`🔢 YARATILGAN OTP KOD: ${otpCode}`);
  console.log('====================================================');

  const otpMessage = 
    `🔐 *BecuGram verification code:*\n\n` +
    `\`${formattedOtp}\`\n\n` +
    `⏱️ _This code expires in 5 minutes. Never share it with anyone._\n\n` +
    `Ushbu kodni BecuGram ilovasidagi oyna maydoniga kiriting.`;

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
    console.log('[BOT Polling info]:', error.message);
  }
});

console.log('🚀 @becugrambot muvaffaqiyatli ishga tushdi va xabarlarni kutmoqda!');
console.log('Telegramda @becugrambot ni oching va /start bosing.');

