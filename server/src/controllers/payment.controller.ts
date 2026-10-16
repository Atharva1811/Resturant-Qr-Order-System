import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { paymentService } from '../services/payment.service.js';
import { AuthenticatedRequest } from '../types/index.js';

const initiateSchema = z.object({
  orderId: z.string().uuid(),
  method: z.enum(['COUNTER', 'ONLINE']),
  email: z.string().email().optional(),
});

export const initiatePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId, method, email } = initiateSchema.parse(req.body);

    const result = await paymentService.initiatePayment(
      prisma,
      orderId,
      method,
      email
    );

    res.json({
      success: true,
      message: 'Payment session initiated',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const provider = req.params.provider || req.body?.provider || 'MOCK_ONLINE_GATEWAY';
    const signature = (req.headers['x-payment-signature'] ||
      req.headers['x-webhook-signature'] ||
      req.headers['x-razorpay-signature']) as string;
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const result = await paymentService.processWebhook(
      prisma,
      { ...payload, provider },
      rawBody,
      signature
    );

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Webhook processing failed',
    });
  }
};

export const confirmCounterPayment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const staffUserId = req.user?.userId;

    const updatedOrder = await paymentService.confirmCounterPayment(
      prisma,
      id,
      staffUserId
    );

    res.json({
      success: true,
      message: 'Counter payment confirmed successfully',
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};
