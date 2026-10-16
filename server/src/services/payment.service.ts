import crypto from 'crypto';
import { PrismaClient, PaymentStatus, PaymentMethod } from '@prisma/client';
import { config } from '../config/index.js';
import { socketService } from './socket.service.js';

export interface PaymentInitiationResult {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  provider: string;
  status: PaymentStatus;
  checkoutUrl?: string;
  clientSecret?: string;
  transactionId?: string;
}

export interface WebhookPayload {
  event: 'payment.succeeded' | 'payment.failed';
  provider: string;
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
  idempotencyKey?: string;
  signature?: string;
}

export class PaymentService {
  /**
   * Generates HMAC-SHA256 signature for outgoing or incoming webhook verification.
   */
  public generateWebhookSignature(payload: string): string {
    return crypto
      .createHmac('sha256', config.paymentWebhookSecret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verifies incoming webhook HMAC signature safely using timingSafeEqual.
   */
  public verifyWebhookSignature(payload: string, receivedSignature: string): boolean {
    if (!receivedSignature) return false;
    const computedSignature = this.generateWebhookSignature(payload);
    try {
      return crypto.timingSafeEqual(
        Buffer.from(computedSignature, 'hex'),
        Buffer.from(receivedSignature, 'hex')
      );
    } catch {
      return false;
    }
  }

  /**
   * Initiates payment for an order.
   */
  public async initiatePayment(
    prisma: PrismaClient,
    orderId: string,
    method: PaymentMethod,
    customerEmail?: string
  ): Promise<PaymentInitiationResult> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (order.paymentStatus === 'PAID') {
      throw new Error(`Order ${order.orderNumber} is already paid.`);
    }

    const providerName = method === 'COUNTER' ? 'COUNTER' : 'MOCK_ONLINE_GATEWAY';
    const transactionId = `${providerName.toLowerCase()}_tx_${crypto.randomBytes(8).toString('hex')}`;
    const idempotencyKey = `pay_${order.id}_${Date.now()}`;

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        restaurantId: order.restaurantId,
        provider: providerName,
        transactionId,
        amount: order.total,
        currency: order.restaurant.currency,
        status: 'PENDING',
        idempotencyKey,
      },
    });

    // Pay at counter keeps order as COUNTER and PENDING
    if (method === 'COUNTER') {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentMethod: 'COUNTER' },
      });

      return {
        paymentId: payment.id,
        orderId: order.id,
        amount: payment.amount,
        currency: payment.currency,
        provider: providerName,
        status: 'PENDING',
        transactionId,
      };
    }

    // Online Payment: generates checkout session simulation / intent
    const checkoutUrl = `${config.frontendUrl}/customer/track/${order.id}?pay_session=${transactionId}`;

    return {
      paymentId: payment.id,
      orderId: order.id,
      amount: payment.amount,
      currency: payment.currency,
      provider: providerName,
      status: 'PENDING',
      transactionId,
      checkoutUrl,
      clientSecret: `cs_test_${crypto.randomBytes(16).toString('hex')}`,
    };
  }

  /**
   * Confirms payment made at counter by restaurant staff.
   */
  public async confirmCounterPayment(
    prisma: PrismaClient,
    orderId: string,
    staffUserId?: string
  ): Promise<any> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.paymentStatus === 'PAID') {
      return order;
    }

    const result = await prisma.$transaction(async (tx) => {
      // Find or create payment record
      let payment = await tx.payment.findFirst({
        where: { orderId, provider: 'COUNTER', status: 'PENDING' },
      });

      if (!payment) {
        payment = await tx.payment.create({
          data: {
            orderId: order.id,
            restaurantId: order.restaurantId,
            provider: 'COUNTER',
            transactionId: `counter_tx_${crypto.randomBytes(8).toString('hex')}`,
            amount: order.total,
            status: 'PAID',
          },
        });
      } else {
        payment = await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'PAID' },
        });
      }

      // Update Order
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'PAID' },
        include: { items: { include: { customizations: true } } },
      });

      // Update restaurant revenue
      await tx.restaurant.update({
        where: { id: order.restaurantId },
        data: { totalRevenue: { increment: order.total } },
      });

      // Audit log
      await tx.auditEvent.create({
        data: {
          restaurantId: order.restaurantId,
          userId: staffUserId,
          orderId: order.id,
          action: 'PAYMENT_CONFIRMED_AT_COUNTER',
          details: JSON.stringify({ amount: order.total, paymentId: payment.id }),
        },
      });

      return updatedOrder;
    });

    // Notify real-time subscribers
    socketService.notifyPaymentUpdated(order.restaurantId, order.id, 'PAID', result);

    return result;
  }

  /**
   * Processes webhook from payment provider idempotently.
   */
  public async processWebhook(
    prisma: PrismaClient,
    payload: WebhookPayload,
    rawBody: string,
    signature?: string
  ): Promise<{ processed: boolean; message: string }> {
    // If signature provided, verify it
    if (signature) {
      const isValid = this.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        throw new Error('Invalid webhook HMAC signature');
      }
    }

    const { event, transactionId, orderId, amount } = payload;

    // Check if this transaction has already been processed (Idempotency check)
    const existingPayment = await prisma.payment.findFirst({
      where: {
        OR: [
          { transactionId: transactionId },
          { orderId: orderId, status: 'PAID' },
        ],
      },
    });

    if (existingPayment && existingPayment.status === 'PAID') {
      return { processed: true, message: 'Payment already processed and recorded (idempotent).' };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error(`Order ${orderId} referenced in webhook does not exist.`);
    }

    if (event === 'payment.succeeded') {
      await prisma.$transaction(async (tx) => {
        if (existingPayment) {
          await tx.payment.update({
            where: { id: existingPayment.id },
            data: { status: 'PAID', rawPayload: rawBody },
          });
        } else {
          await tx.payment.create({
            data: {
              orderId: order.id,
              restaurantId: order.restaurantId,
              provider: payload.provider || 'ONLINE',
              transactionId,
              amount: amount || order.total,
              status: 'PAID',
              rawPayload: rawBody,
            },
          });
        }

        await tx.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'PAID' },
        });

        await tx.restaurant.update({
          where: { id: order.restaurantId },
          data: { totalRevenue: { increment: order.total } },
        });

        await tx.auditEvent.create({
          data: {
            restaurantId: order.restaurantId,
            orderId: order.id,
            action: 'WEBHOOK_PAYMENT_SUCCEEDED',
            details: JSON.stringify({ transactionId, amount }),
          },
        });
      });

      socketService.notifyPaymentUpdated(order.restaurantId, order.id, 'PAID');
      return { processed: true, message: 'Payment confirmed successfully via webhook.' };
    } else {
      // payment.failed
      await prisma.$transaction(async (tx) => {
        if (existingPayment) {
          await tx.payment.update({
            where: { id: existingPayment.id },
            data: { status: 'FAILED', rawPayload: rawBody },
          });
        } else {
          await tx.payment.create({
            data: {
              orderId: order.id,
              restaurantId: order.restaurantId,
              provider: payload.provider || 'ONLINE',
              transactionId,
              amount: amount || order.total,
              status: 'FAILED',
              rawPayload: rawBody,
            },
          });
        }

        await tx.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'FAILED' },
        });
      });

      socketService.notifyPaymentUpdated(order.restaurantId, order.id, 'FAILED');
      return { processed: true, message: 'Payment failure recorded.' };
    }
  }
}

export const paymentService = new PaymentService();
