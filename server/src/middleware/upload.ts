import multer from 'multer';
import path from 'path';
import { Request } from 'express';

const storage = multer.memoryStorage();

const FORBIDDEN_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.msi', '.dll', '.com', '.vbs', '.ps1', '.scr', '.pif'
]);

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (FORBIDDEN_EXTENSIONS.has(ext)) {
    return cb(new Error('Forbidden file type: Executable files are not allowed.'));
  }
  cb(null, true);
}

export const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB
  },
  fileFilter,
});

