import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/index.js';
import { errorHandler } from './middleware/error-handler.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import otpRoutes from './routes/otp.routes.js';
import publicRoutes from './routes/public.routes.js';
import kitchenRoutes from './routes/kitchen.routes.js';
import adminRoutes from './routes/admin.routes.js';
import superadminRoutes from './routes/superadmin.routes.js';
import paymentRoutes from './routes/payment.routes.js';

export const createApp = (): Application => {
  const app: Application = express();

  // Basic security and utility middleware
  app.use(helmet());
  app.use(
    cors({
      origin: [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'Sudarshan QR Backend',
    });
  });

  // Mount domain routes
  app.use('/api/auth', authRoutes);
  app.use('/api/otp', otpRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/kitchen', kitchenRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/superadmin', superadminRoutes);
  app.use('/api/payments', paymentRoutes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
  });

  // Central error handler
  app.use(errorHandler);

  return app;
};

export default createApp;
