import { Router } from 'express';
import { getKitchenActiveOrders, updateOrderStatus } from '../controllers/kitchen.controller.js';
import { authenticateJwt, requireRole, requireTenant } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateJwt);
router.use(requireRole('KITCHEN_STAFF', 'RESTAURANT_ADMIN'));
router.use(requireTenant);

router.get('/orders', getKitchenActiveOrders);
router.patch('/orders/:id/status', updateOrderStatus);

export default router;
