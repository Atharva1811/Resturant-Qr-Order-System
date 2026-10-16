import { Router } from 'express';
import { requestOtp, verifyOtp } from '../controllers/otp.controller.js';
import { otpRequestLimiter, otpVerifyLimiter } from '../middleware/rate-limiter.js';

const router = Router();

router.post('/request', otpRequestLimiter, requestOtp);
router.post('/verify', otpVerifyLimiter, verifyOtp);

export default router;
