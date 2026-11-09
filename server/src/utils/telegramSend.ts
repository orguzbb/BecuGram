import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9290958097:AAFgRfx4G-BEO_SGrknM2WecoutZzQv8ilQ';

export function getSavedTelegramChatId(phoneNumber: string): string | null {
  try {
    const paths = [
      path.resolve(process.cwd(), 'telegram_users.json'),
      path.resolve(process.cwd(), '..', 'telegram_users.json'),
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) {
        const data = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (data[phoneNumber]?.chatId) {
          return data[phoneNumber].chatId;
        }
      }
    }
  } catch {}
  return null;
}

export function saveTelegramBinding(phoneNumber: string, chatId: string, userId?: string, firstName?: string): void {
  try {
    const p = path.resolve(process.cwd(), 'telegram_users.json');
    let data: any = { byChatId: {} };
    if (fs.existsSync(p)) {
      data = JSON.parse(fs.readFileSync(p, 'utf8'));
    }
    if (!data.byChatId) data.byChatId = {};
    data[phoneNumber] = {
      chatId,
      userId: userId || chatId,
      firstName: firstName || 'User',
      updatedAt: new Date().toISOString(),
    };
    data.byChatId[chatId] = phoneNumber;
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
  } catch (err) {
    logger.error('Failed to save telegram user binding:', err);
  }
}

export async function sendTelegramOtp(chatId: string, otpCode: string): Promise<boolean> {
  const formattedOtp = `${otpCode.slice(0, 3)} ${otpCode.slice(3)}`;
  const text =
    `🔐 *BecuGram tasdiqlash kodi:*\n\n` +
    `\`${formattedOtp}\`\n\n` +
    `⏱️ _Bu kod 5 daqiqa davomida amal qiladi. Hech kimga bermang._\n\n` +
    `Kodni BecuGram ilovasidagi oyna maydoniga kiriting.`;

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });

    const json: any = await res.json();
    if (json.ok) {
      logger.info(`Telegram OTP dispatched to chat ${chatId}: ${otpCode}`);
      return true;
    } else {
      logger.warn(`Telegram API error: ${JSON.stringify(json)}`);
      return false;
    }
  } catch (err) {
    logger.error('Failed to dispatch Telegram message:', err);
    return false;
  }
}
