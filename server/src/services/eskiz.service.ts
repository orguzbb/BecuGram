import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

interface EskizAuthResponse {
  message: string;
  data: {
    token: string;
  };
  token_type: string;
}

interface EskizSendResponse {
  id: string | number;
  status: string;
  message: string;
}

class EskizService {
  private token: string | null = null;
  private tokenExpiresAt: number = 0;
  private baseUrl = 'https://notify.eskiz.uz/api';

  /**
   * Check if Eskiz credentials are configured in .env
   */
  isConfigured(): boolean {
    return Boolean(env.ESKIZ_EMAIL && env.ESKIZ_PASSWORD);
  }

  /**
   * Get valid authorization token from Eskiz.uz
   */
  async getToken(): Promise<string | null> {
    if (!this.isConfigured()) {
      return null;
    }

    // Return cached token if valid (cache for 25 days)
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }

    try {
      const formData = new URLSearchParams();
      formData.append('email', env.ESKIZ_EMAIL);
      formData.append('password', env.ESKIZ_PASSWORD);

      const res = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!res.ok) {
        const errText = await res.text();
        logger.error(`Eskiz auth failed (${res.status}): ${errText}`);
        return null;
      }

      const data = (await res.json()) as EskizAuthResponse;
      if (data?.data?.token) {
        this.token = data.data.token;
        // Cache token for 25 days (Eskiz tokens last ~30 days)
        this.tokenExpiresAt = Date.now() + 25 * 24 * 60 * 60 * 1000;
        logger.info('Eskiz.uz SMS provayderiga muvaffaqiyatli ulandi.');
        return this.token;
      }
    } catch (err: any) {
      logger.error('Eskiz auth request error:', err.message);
    }

    return null;
  }

  /**
   * Send SMS OTP message to Uzbekistan phone number
   * @param phoneNumber E.164 formatted (+998901234567) or raw digits (998901234567)
   * @param code 6-digit OTP code
   */
  async sendOtpSms(phoneNumber: string, code: string): Promise<{ success: boolean; simulated?: boolean; messageId?: string | number }> {
    // Format to 12 digits: 998901234567
    let cleanPhone = phoneNumber.replace(/[^\d]/g, '');
    if (cleanPhone.length === 9) cleanPhone = '998' + cleanPhone;

    const message = `BecuGram tasdiqlash kodi: ${code}. Xavfsizlik uchun kodni hech kimga bermang.`;

    if (!this.isConfigured()) {
      logger.info('----------------------------------------------------');
      logger.info(`📱 [SMS SIMULATOR / ESKIZ DEV]`);
      logger.info(`📞 Raqam: +${cleanPhone}`);
      logger.info(`🔑 Tasdiqlash kodi: ${code}`);
      logger.info(`💬 Xabar: "${message}"`);
      logger.info(`💡 Eskiz.uz SMS real yuborilishi uchun .env fayliga ESKIZ_EMAIL va ESKIZ_PASSWORD qo'shing.`);
      logger.info('----------------------------------------------------');
      return { success: true, simulated: true };
    }

    try {
      const token = await this.getToken();
      if (!token) {
        logger.warn('Eskiz token olinmadi. SMS simulyatsiya qilindi.');
        return { success: true, simulated: true };
      }

      const formData = new URLSearchParams();
      formData.append('mobile_phone', cleanPhone);
      formData.append('message', message);
      formData.append('from', env.ESKIZ_FROM || '4546');

      const res = await fetch(`${this.baseUrl}/message/sms/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = (await res.json()) as EskizSendResponse;

      if (res.ok) {
        logger.info(`✅ Eskiz.uz orqali SMS muvaffaqiyatli yuborildi: +${cleanPhone} (ID: ${data.id})`);
        return { success: true, simulated: false, messageId: data.id };
      } else {
        logger.error(`Eskiz SMS yuborishda xatolik:`, data);
        return { success: false, simulated: false };
      }
    } catch (err: any) {
      logger.error('Eskiz send error:', err.message);
      return { success: false, simulated: true };
    }
  }

  /**
   * Check Eskiz user balance & status
   */
  async getStatus(): Promise<{ configured: boolean; balance?: any; error?: string }> {
    if (!this.isConfigured()) {
      return { configured: false };
    }

    const token = await this.getToken();
    if (!token) {
      return { configured: true, error: 'Login yoki parol noto\'g\'ri' };
    }

    try {
      const res = await fetch(`${this.baseUrl}/auth/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        return { configured: true, balance: data };
      }
    } catch (e: any) {
      return { configured: true, error: e.message };
    }

    return { configured: true };
  }
}

export const eskizService = new EskizService();

