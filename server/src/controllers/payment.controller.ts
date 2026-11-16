import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import {
  createStoredPayment,
  getAllPayments,
  cancelAutoRenewal,
  getStoredUser,
} from '../utils/dataStore.js';

// Click checkout / auto-pay endpoint
export async function createClickPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      return;
    }

    const { planId, amount, autoRenew, cardNumberMasked } = req.body;

    if (!planId || !amount) {
      res.status(400).json({
        success: false,
        error: { message: 'Reja (planId) va to‘lov summasi kiritilishi shart' },
      });
      return;
    }

    const payment = createStoredPayment({
      userId,
      planId: planId || '1_month',
      amount: Number(amount),
      autoRenew: Boolean(autoRenew),
      cardNumberMasked: cardNumberMasked || '8600 **** **** 8888',
    });

    const user = getStoredUser(userId);

    res.status(200).json({
      success: true,
      message: 'Click orqali to‘lov muvaffaqiyatli amalga oshirildi! Premium faollashtirildi. ⭐️',
      data: {
        payment,
        user,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message || 'Server error' } });
  }
}

// Get user payment & subscription status
export async function getPaymentStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      return;
    }

    const user = getStoredUser(userId);
    const payments = getAllPayments().filter((p) => p.userId === userId);

    res.status(200).json({
      success: true,
      data: {
        isPremium: Boolean((user as any)?.isPremium),
        autoRenew: Boolean((user as any)?.autoRenewPremium),
        premiumUntil: (user as any)?.premiumUntil || null,
        payments,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message || 'Server error' } });
  }
}

// Cancel auto renewal
export async function cancelSubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      return;
    }

    const success = cancelAutoRenewal(userId);
    res.status(200).json({
      success,
      message: 'Click avto-to‘lov muvaffaqiyatli bekor qilindi.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message || 'Server error' } });
  }
}
