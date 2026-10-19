import { Router } from 'express';
import { login, getMe, registerRestaurant } from '../controllers/auth.controller.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { loginLimiter, registerLimiter } from '../middleware/rate-limiter.js';

const router = Router();

router.post('/login', loginLimiter, login);
router.post('/register', registerLimiter, registerRestaurant);
router.post('/register-restaurant', registerLimiter, registerRestaurant);
router.get('/me', authenticateJwt, getMe);

export default router;

