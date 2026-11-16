import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Unhandled API Error:', err);

  // Multer File Upload Errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({
      success: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'File size exceeds maximum allowed limit.',
      },
    });
    return;
  }

  if (err.message && err.message.includes('Forbidden file type')) {
    res.status(400).json({
      success: false,
      error: {
        code: 'FORBIDDEN_FILE_TYPE',
        message: err.message,
      },
    });
    return;
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: statusCode === 500 && process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred. Please try again later.' 
        : message,
    },
  });
}

