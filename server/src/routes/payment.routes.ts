import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createClickPayment,
  getPaymentStatus,
  cancelSubscription,
} from '../controllers/payment.controller.js';

export const paymentRouter = Router();

paymentRouter.use(requireAuth);

paymentRouter.post('/click/checkout', createClickPayment);
paymentRouter.get('/status', getPaymentStatus);
paymentRouter.post('/cancel-auto', cancelSubscription);
