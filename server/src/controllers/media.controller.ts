import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { storageProvider } from '../storage/index.js';

export async function uploadMedia(req: AuthenticatedRequest, res: Response): Promise<void> {
  const file = req.file;

  if (!file) {
    res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded.' } });
    return;
  }

  // Determine subfolder based on mimetype
  let folder = 'documents';
  if (file.mimetype.startsWith('image/')) folder = 'images';
  else if (file.mimetype.startsWith('video/')) folder = 'videos';
  else if (file.mimetype.startsWith('audio/')) folder = 'audio';

  try {
    const result = await storageProvider.saveFile(file, folder);

    res.status(201).json({
      success: true,
      data: {
        url: result.url,
        name: result.name,
        size: result.size,
        mimeType: result.mimeType,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_FAILED', message: err.message || 'File upload failed.' },
    });
  }
}

