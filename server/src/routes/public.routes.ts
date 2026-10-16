import { Router } from 'express';
import {
  getRestaurantBySlug,
  verifyTable,
  createOrder,
  trackOrder,
} from '../controllers/public.controller.js';

const router = Router();

router.get('/restaurants/:slug', getRestaurantBySlug);
router.get('/tables/verify', verifyTable);
router.post('/orders', createOrder);
router.get('/orders/:id/track', trackOrder);

export default router;
