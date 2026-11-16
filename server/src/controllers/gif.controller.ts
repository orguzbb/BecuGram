import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { getAllGifs, addStoredGif, deleteStoredGif } from '../utils/dataStore.js';

export async function getGifs(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const gifs = getAllGifs();
    res.status(200).json({ success: true, data: gifs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}

export async function createGif(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { title, category, url } = req.body;
    if (!title || !url) {
      res.status(400).json({ success: false, error: { message: 'Sarlavha va GIF URL kiritilishi shart' } });
      return;
    }

    const gif = addStoredGif({
      title,
      category: category || 'Trending',
      url,
    });

    res.status(201).json({ success: true, data: gif });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}

export async function removeGif(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const ok = deleteStoredGif(id);
    if (!ok) {
      res.status(404).json({ success: false, error: { message: 'GIF topilmadi' } });
      return;
    }
    res.status(200).json({ success: true, message: 'GIF muvaffaqiyatli o‘chirildi' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}
