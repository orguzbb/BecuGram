import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env.js';

export interface StoredFileResult {
  url: string;
  name: string;
  size: number;
  mimeType: string;
  storageKey: string;
}

export interface IStorageProvider {
  saveFile(file: Express.Multer.File, folder?: string): Promise<StoredFileResult>;
  deleteFile(storageKey: string): Promise<boolean>;
  getPublicUrl(storageKey: string): string;
}

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), env.STORAGE_LOCAL_PATH);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File, folder: string = 'media'): Promise<StoredFileResult> {
    const targetFolder = path.join(this.baseDir, folder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const ext = path.extname(file.originalname);
    const randomHex = crypto.randomBytes(16).toString('hex');
    const safeFilename = `${Date.now()}_${randomHex}${ext}`;
    const targetPath = path.join(targetFolder, safeFilename);

    await fs.promises.writeFile(targetPath, file.buffer);

    const relativeUrl = `/uploads/${folder}/${safeFilename}`;
    const storageKey = `${folder}/${safeFilename}`;

    return {
      url: relativeUrl,
      name: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      storageKey,
    };
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    const fullPath = path.join(this.baseDir, storageKey);
    try {
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  getPublicUrl(storageKey: string): string {
    return `/uploads/${storageKey}`;
  }
}

export const storageProvider: IStorageProvider = new LocalStorageProvider();

