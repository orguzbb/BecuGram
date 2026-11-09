import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { getStoredUser } from '../utils/dataStore.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    phoneNumber?: string;
    username?: string;
  };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.becugram_at) {
      token = req.cookies.becugram_at;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required. No token provided.' },
      });
      return;
    }

    const decoded = verifyAccessToken(token);
    
    // Check if user still exists when MongoDB is active
    if (mongoose.connection.readyState === 1) {
      const userExists = await User.findById(decoded.userId).select('_id isOnline');
      if (!userExists) {
        res.status(401).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User account no longer exists.' },
        });
        return;
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired authentication token.' },
    });
  }
}

export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: { message: 'Avtorizatsiyadan o\'ting' } });
    return;
  }

  let user: any = getStoredUser(userId);
  if (!user && mongoose.connection.readyState === 1) {
    try {
      user = await User.findById(userId);
    } catch {}
  }

  const isSuperAdmin = user?.phoneNumber === '+998889008081' || user?.role === 'admin';
  if (!isSuperAdmin) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN_NOT_ADMIN', message: 'Ruxsat berilmadi. Faqat administrator kirishi mumkin!' },
    });
    return;
  }

  next();
}

