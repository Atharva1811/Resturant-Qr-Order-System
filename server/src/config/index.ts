import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-for-servora-development-only',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  brevo: {
    apiKey: process.env.BREVO_API_KEY || '',
    senderEmail: process.env.BREVO_SENDER_EMAIL || 'orders@servora.app',
    senderName: process.env.BREVO_SENDER_NAME || 'Servora QR Ordering',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || 'whsec_servora_test_secret_2026',
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },
  // Development-only guards (strictly unreachable in production)
  enableDevOtpBypass: process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEV_OTP_BYPASS === 'true',
  devStaticOtp: process.env.DEV_STATIC_OTP || '123456',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || 'DevAdminPass123!',
};
