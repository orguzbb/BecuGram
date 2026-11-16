import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import {
  getAllStickerPacks,
  addStoredStickerPack,
  addStickerToPack,
  deleteStoredSticker,
} from '../utils/dataStore.js';

export async function getStickers(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const packs = getAllStickerPacks();
    res.status(200).json({ success: true, data: packs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}

export async function createStickerPack(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { title, author, isPremium } = req.body;
    if (!title) {
      res.status(400).json({ success: false, error: { message: 'To‘plam nomi kiritilishi shart' } });
      return;
    }

    const pack = addStoredStickerPack(title, author, Boolean(isPremium));
    res.status(201).json({ success: true, data: pack });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}

export async function createSticker(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { packId, name, emoji, lottieJson } = req.body;
    if (!packId || !name || !lottieJson) {
      res.status(400).json({
        success: false,
        error: { message: 'packId, name va lottieJson ma‘lumotlari kiritilishi shart' },
      });
      return;
    }

    // Parse JSON if sent as string
    let parsedLottie = lottieJson;
    if (typeof lottieJson === 'string') {
      try {
        parsedLottie = JSON.parse(lottieJson);
      } catch {
        // If not valid JSON string, leave as string (e.g. path)
        parsedLottie = lottieJson;
      }
    }

    const sticker = addStickerToPack(packId, name, emoji || '⭐️', parsedLottie);
    if (!sticker) {
      res.status(404).json({ success: false, error: { message: 'Stiker to‘plami topilmadi' } });
      return;
    }

    res.status(201).json({ success: true, data: sticker });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}

export async function removeSticker(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const ok = deleteStoredSticker(id);
    if (!ok) {
      res.status(404).json({ success: false, error: { message: 'Stiker topilmadi' } });
      return;
    }
    res.status(200).json({ success: true, message: 'Stiker muvaffaqiyatli o‘chirildi' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}
