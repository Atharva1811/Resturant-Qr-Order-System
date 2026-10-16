import { Router } from 'express';
import {
  initiatePayment,
  handleWebhook,
  confirmCounterPayment,
} from '../controllers/payment.controller.js';
import { authenticateJwt, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/initiate', initiatePayment);
router.post('/webhook', handleWebhook);
router.post('/webhook/:provider', handleWebhook);
router.post(
  '/orders/:id/counter-pay',
  authenticateJwt,
  requireRole('RESTAURANT_ADMIN', 'KITCHEN_STAFF', 'WAITER'),
  confirmCounterPayment
);

export default router;
