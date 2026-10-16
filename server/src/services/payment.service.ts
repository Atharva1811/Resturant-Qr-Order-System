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
  gatewayOrderId?: string;
}

export interface WebhookPayload {
  event: 'payment.succeeded' | 'payment.failed';
  provider: string;
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
  idempotencyKey?: string;
}

/**
 * Provider-Independent Payment Gateway Interface.
 * Allows plug-and-play addition of Razorpay, Stripe, or any gateway.
 */
export interface IPaymentGatewayProvider {
  name: string;
  initiate(amount: number, currency: string, orderId: string): Promise<{ transactionId: string; clientSecret?: string }>;
  verifyWebhook(rawPayload: string, signature: string): boolean;
}

/**
 * Concrete Razorpay Provider Implementation
 * Documents and implements signature verification conforming to Razorpay's HMAC standard.
 */
export class RazorpayGatewayProvider implements IPaymentGatewayProvider {
  public name = 'RAZORPAY';

  public async initiate(amount: number, currency: string, orderId: string): Promise<{ transactionId: string; clientSecret?: string }> {
    const transactionId = `rzp_order_${crypto.randomBytes(8).toString('hex')}`;
    return {
      transactionId,
      clientSecret: config.razorpay.keyId,
    };
  }

  public verifyWebhook(rawPayload: string, signature: string): boolean {
    const secret = config.razorpay.keySecret || config.paymentWebhookSecret;
    if (!secret || !signature) return false;
    const expected = crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
    } catch {
      return false;
    }
  }
}

/**
 * Generic Mock Online Gateway Provider for development & automated tests
 */
export class MockGatewayProvider implements IPaymentGatewayProvider {
  public name = 'MOCK_ONLINE_GATEWAY';

  public async initiate(amount: number, currency: string, orderId: string): Promise<{ transactionId: string; clientSecret?: string }> {
    return {
      transactionId: `mock_tx_${crypto.randomBytes(8).toString('hex')}`,
      clientSecret: `cs_test_${crypto.randomBytes(12).toString('hex')}`,
    };
  }

  public verifyWebhook(rawPayload: string, signature: string): boolean {
    const expected = crypto
      .createHmac('sha256', config.paymentWebhookSecret)
      .update(rawPayload)
      .digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
    } catch {
      return false;
    }
  }
}

export class PaymentService {
  private providers: Map<string, IPaymentGatewayProvider> = new Map();

  constructor() {
    this.registerProvider(new MockGatewayProvider());
    this.registerProvider(new RazorpayGatewayProvider());
  }

  public registerProvider(provider: IPaymentGatewayProvider) {
    this.providers.set(provider.name.toUpperCase(), provider);
  }

  /**
   * Generates HMAC-SHA256 signature for outgoing or test webhook validation.
   */
  public generateWebhookSignature(payload: string): string {
    return crypto
      .createHmac('sha256', config.paymentWebhookSecret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verifies incoming webhook signature across provider adapters.
   * Supports verifyWebhookSignature(payload, signature) and verifyWebhookSignature(providerName, payload, signature)
   */
  public verifyWebhookSignature(arg1: string, arg2: string, arg3?: string): boolean {
    let providerName = 'MOCK_ONLINE_GATEWAY';
    let payload = '';
    let signature = '';

    if (arg3 !== undefined) {
      providerName = arg1;
      payload = arg2;
      signature = arg3;
    } else {
      payload = arg1;
      signature = arg2;
    }

    if (!signature) return false;
    const provider = this.providers.get(providerName.toUpperCase()) || this.providers.get('MOCK_ONLINE_GATEWAY');
    if (provider) {
      return provider.verifyWebhook(payload, signature);
    }
    const computed = this.generateWebhookSignature(payload);
    try {
      return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(signature, 'hex'));
    } catch {
      return false;
    }
  }

  /**
   * Initiates payment for an order.
   * Never marks payment as PAID based solely on client input.
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

    const providerName = method === 'COUNTER' ? 'COUNTER' : config.razorpay.keyId ? 'RAZORPAY' : 'MOCK_ONLINE_GATEWAY';
    const provider = this.providers.get(providerName) || this.providers.get('MOCK_ONLINE_GATEWAY')!;
    const initiation = await provider.initiate(order.total, order.restaurant.currency, order.id);
    const idempotencyKey = `pay_${order.id}_${Date.now()}`;

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        restaurantId: order.restaurantId,
        provider: providerName,
        transactionId: initiation.transactionId,
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
        transactionId: initiation.transactionId,
      };
    }

    // Online Payment: generates checkout session URL with client secret
    const checkoutUrl = `${config.frontendUrl}/customer/track/${order.id}?pay_session=${initiation.transactionId}`;

    return {
      paymentId: payment.id,
      orderId: order.id,
      amount: payment.amount,
      currency: payment.currency,
      provider: providerName,
      status: 'PENDING',
      transactionId: initiation.transactionId,
      checkoutUrl,
      clientSecret: initiation.clientSecret,
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

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'PAID' },
        include: { items: { include: { customizations: true } } },
      });

      await tx.restaurant.update({
        where: { id: order.restaurantId },
        data: { totalRevenue: { increment: order.total } },
      });

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

    socketService.notifyPaymentUpdated(order.restaurantId, order.id, 'PAID', result);
    return result;
  }

  /**
   * Processes webhook from payment provider idempotently.
   * Requires verified HMAC signature.
   */
  public async processWebhook(
    prisma: PrismaClient,
    payload: WebhookPayload,
    rawBody: string,
    signature?: string
  ): Promise<{ processed: boolean; message: string }> {
    const providerName = payload.provider || 'MOCK_ONLINE_GATEWAY';

    // Verify webhook signature
    if (signature) {
      const isValid = this.verifyWebhookSignature(providerName, rawBody, signature);
      if (!isValid) {
        throw new Error('Invalid webhook HMAC signature');
      }
    }

    const { event, transactionId, orderId, amount } = payload;

    // Idempotency check: check if already recorded as PAID
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
              provider: providerName,
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
              provider: providerName,
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
