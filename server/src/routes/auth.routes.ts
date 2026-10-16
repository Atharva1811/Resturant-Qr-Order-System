import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { loginLimiter } from '../middleware/rate-limiter.js';

const router = Router();

router.post('/login', loginLimiter, login);
router.get('/me', authenticateJwt, getMe);

export default router;

