import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { env } from '../config/env.js';
import { DANGEROUS_EXTENSIONS } from '../utils/fileValidation.js';

const storage = multer.memoryStorage();

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return cb(new Error(`Forbidden file type: ${ext} files are not allowed.`));
  }
  cb(null, true);
}

export const upload = multer({
  storage,
  limits: {
    fileSize: (env.MAX_FILE_SIZE_MB || 50) * 1024 * 1024,
  },
  fileFilter,
});

