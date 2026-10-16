import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-for-sudarshan-development-only',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  brevo: {
    apiKey: process.env.BREVO_API_KEY || '',
    senderEmail: process.env.BREVO_SENDER_EMAIL || 'orders@sudarshanqr.com',
    senderName: process.env.BREVO_SENDER_NAME || 'Sudarshan QR Ordering',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || 'whsec_sudarshan_test_secret_2026',
};
