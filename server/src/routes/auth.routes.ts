import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateJwt, getMe);

export default router;
