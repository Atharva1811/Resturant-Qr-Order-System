import { describe, it, expect, vi } from 'vitest';
import { paymentService } from '../services/payment.service.js';
import prisma from '../lib/prisma.js';

describe('Payment & Webhook Idempotency Unit Tests', () => {
  it('generates and verifies HMAC-SHA256 signature correctly', () => {
    const rawPayload = JSON.stringify({ event: 'payment.succeeded', orderId: 'ord-123', amount: 50.0 });
    const signature = paymentService.generateWebhookSignature(rawPayload);

    expect(signature).toBeDefined();
    expect(signature).toHaveLength(64); // sha256 hex length
    expect(paymentService.verifyWebhookSignature(rawPayload, signature)).toBe(true);
    expect(paymentService.verifyWebhookSignature(rawPayload, 'forged-signature-hex-1234')).toBe(false);
    expect(paymentService.verifyWebhookSignature('different-body', signature)).toBe(false);
  });

  it('rejects webhooks with invalid signatures', async () => {
    const rawPayload = JSON.stringify({ event: 'payment.succeeded' });
    await expect(
      paymentService.processWebhook(
        prisma,
        {
          event: 'payment.succeeded',
          provider: 'STRIPE',
          transactionId: 'tx_123',
          orderId: 'ord_123',
          amount: 25.0,
          currency: 'USD',
        },
        rawPayload,
        'bad-signature'
      )
    ).rejects.toThrow('Invalid webhook HMAC signature');
  });

  it('handles duplicate webhooks idempotently without duplicate charges', async () => {
    const payload = {
      event: 'payment.succeeded' as const,
      provider: 'STRIPE',
      transactionId: 'tx_already_paid',
      orderId: 'ord_already_paid',
      amount: 45.0,
      currency: 'USD',
    };
    const rawPayload = JSON.stringify(payload);
    const signature = paymentService.generateWebhookSignature(rawPayload);

    // Mock existing payment already PAID
    vi.spyOn(prisma.payment, 'findFirst').mockResolvedValueOnce({
      id: 'pay-existing',
      transactionId: 'tx_already_paid',
      orderId: 'ord_already_paid',
      status: 'PAID',
    } as any);

    const result = await paymentService.processWebhook(
      prisma,
      payload,
      rawPayload,
      signature
    );

    expect(result.processed).toBe(true);
    expect(result.message).toContain('idempotent');
  });
});
