import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { storageProvider } from '../storage/index.js';
import { resolveConversation } from './message.controller.js';
import { validateFileContent } from '../utils/fileValidation.js';

export async function uploadMedia(req: AuthenticatedRequest, res: Response): Promise<void> {
  const file = req.file;
  const currentUserId = req.user?.userId || (req.user as any)?._id;

  if (!file) {
    res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded.' } });
    return;
  }

  // 1. Strict conversation membership check if conversationId is supplied (Auth check first)
  const conversationId = req.body?.conversationId || (req.query?.conversationId as string);
  if (conversationId && currentUserId) {
    const resolved = await resolveConversation(conversationId);
    if (!resolved || !resolved.conversation) {
      res.status(404).json({
        success: false,
        error: { code: 'CONVERSATION_NOT_FOUND', message: 'Suhbat topilmadi.' },
      });
      return;
    }
    if (!resolved.participants.includes(currentUserId.toString())) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: "Siz bu suhbatga fayl yuklash huquqiga ega emassiz." },
      });
      return;
    }
  }

  // 2. Validate file content and magic bytes (prevent disguised executables/scripts)
  const validation = validateFileContent(file.buffer, file.originalname, file.mimetype);
  if (!validation.isValid) {
    res.status(400).json({
      success: false,
      error: {
        code: 'DANGEROUS_FILE_CONTENT',
        message: validation.reason || 'Yaroqsiz yoki xavfli fayl tarkibi aniqlandi.',
      },
    });
    return;
  }

  // 3. Determine subfolder based on verified mimetype and explicit type hints
  const effectiveMime = validation.detectedMimeType || file.mimetype;
  let folder = 'documents';
  if (effectiveMime.startsWith('image/')) {
    folder = 'images';
  } else if (effectiveMime.startsWith('audio/') || req.body?.type === 'voice' || req.body?.type === 'audio') {
    folder = 'audio';
  } else if (effectiveMime.startsWith('video/')) {
    folder = 'videos';
  }

  try {
    const result = await storageProvider.saveFile(file, folder);

    // Parse optional client-provided metadata
    const duration = req.body?.duration ? parseFloat(req.body.duration) : undefined;
    const width = req.body?.width ? parseInt(req.body.width, 10) : undefined;
    const height = req.body?.height ? parseInt(req.body.height, 10) : undefined;
    let waveform: number[] | undefined;
    if (req.body?.waveform) {
      try {
        waveform = typeof req.body.waveform === 'string' ? JSON.parse(req.body.waveform) : req.body.waveform;
      } catch {}
    }

    res.status(201).json({
      success: true,
      data: {
        url: result.url,
        name: result.name,
        size: result.size,
        mimeType: effectiveMime,
        ...(duration !== undefined && !isNaN(duration) ? { duration } : {}),
        ...(width !== undefined && !isNaN(width) ? { width } : {}),
        ...(height !== undefined && !isNaN(height) ? { height } : {}),
        ...(waveform ? { waveform } : {}),
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_FAILED', message: err.message || 'File upload failed.' },
    });
  }
}

