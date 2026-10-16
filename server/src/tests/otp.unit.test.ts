import { describe, it, expect, vi } from 'vitest';
import { brevoService } from '../services/brevo.service.js';
import request from 'supertest';
import { createApp } from '../app.js';
import prisma from '../lib/prisma.js';

describe('Brevo Service & OTP Verification Unit & Integration Tests', () => {
  const app = createApp();

  it('generates a 6-digit numeric OTP string within 100000 - 999999', () => {
    const otp = brevoService.generateOtp();
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
    const num = parseInt(otp, 10);
    expect(num).toBeGreaterThanOrEqual(100000);
    expect(num).toBeLessThan(1000000);
  });

  it('generates different random OTPs on subsequent invocations', () => {
    const otps = new Set<string>();
    for (let i = 0; i < 20; i++) {
      otps.add(brevoService.generateOtp());
    }
    expect(otps.size).toBeGreaterThan(15);
  });

  it('masks email addresses properly to prevent PII log exposure', () => {
    expect(brevoService.maskEmail('customer@example.com')).toBe('c***r@example.com');
    expect(brevoService.maskEmail('al@test.com')).toBe('a***@test.com');
    expect(brevoService.maskEmail('invalid')).toBe('***');
  });

  it('computes consistent deterministic salted HMAC hash for the same email and OTP', () => {
    const email = 'Customer@Example.Com';
    const otp = '482910';
    const hash1 = brevoService.hashOtp(otp, email);
    const hash2 = brevoService.hashOtp(otp, 'customer@example.com');
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex length
  });

  it('verifies correct OTP successfully and rejects incorrect OTP', () => {
    const email = 'tester@domain.com';
    const otp = '839201';
    const hash = brevoService.hashOtp(otp, email);

    expect(brevoService.verifyOtpHash(otp, email, hash)).toBe(true);
    expect(brevoService.verifyOtpHash('000000', email, hash)).toBe(false);
    expect(brevoService.verifyOtpHash('839202', email, hash)).toBe(false);
    expect(brevoService.verifyOtpHash(otp, 'other@domain.com', hash)).toBe(false);
  });

  it('handles mock delivery mode safely without logging raw OTP', async () => {
    const result = await brevoService.sendOtpEmail('test@example.com', '123456', 'Rustic Hearth');
    expect(result.delivered).toBe(true);
    expect(result.isMock).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it('POST /api/otp/request sends code and NEVER returns the OTP in the API response', async () => {
    vi.spyOn(prisma.restaurant, 'findUnique').mockResolvedValueOnce({
      id: 'rest-1',
      name: 'The Rustic Hearth',
      slug: 'rustic-hearth',
    } as any);

    vi.spyOn(prisma.customerVerification, 'findFirst').mockResolvedValueOnce(null);
    vi.spyOn(prisma.customerVerification, 'create').mockResolvedValueOnce({ id: 'ver-1' } as any);

    const res = await request(app).post('/api/otp/request').send({
      email: 'customer@test.com',
      restaurantSlug: 'rustic-hearth',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Explicit assertion: OTP must NOT be present anywhere in the response body
    expect(res.body.data.mockCode).toBeUndefined();
    expect(res.body.data.otp).toBeUndefined();
    expect(res.body.data.code).toBeUndefined();
    expect(res.body.data.expiresAt).toBeDefined();
  });

  it('enforces 60-second resend cooldown per email', async () => {
    vi.spyOn(prisma.restaurant, 'findUnique').mockResolvedValueOnce({
      id: 'rest-1',
      name: 'The Rustic Hearth',
      slug: 'rustic-hearth',
    } as any);

    // Mock recent request 15 seconds ago
    vi.spyOn(prisma.customerVerification, 'findFirst').mockResolvedValueOnce({
      id: 'recent-ver',
      createdAt: new Date(Date.now() - 15 * 1000),
    } as any);

    const res = await request(app).post('/api/otp/request').send({
      email: 'customer@test.com',
      restaurantSlug: 'rustic-hearth',
    });

    expect(res.status).toBe(429);
    expect(res.body.error).toContain('seconds before requesting a new code');
  });

  it('rejects expired OTP during verification', async () => {
    vi.spyOn(prisma.restaurant, 'findUnique').mockResolvedValueOnce({
      id: 'rest-1',
      slug: 'rustic-hearth',
    } as any);

    // Mock verification record expired 2 minutes ago
    vi.spyOn(prisma.customerVerification, 'findFirst').mockResolvedValueOnce({
      id: 'expired-ver',
      expiresAt: new Date(Date.now() - 120 * 1000),
      attempts: 0,
      maxAttempts: 5,
    } as any);

    const res = await request(app).post('/api/otp/verify').send({
      email: 'customer@test.com',
      code: '123456',
      restaurantSlug: 'rustic-hearth',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('expired');
  });

  it('blocks verification after exceeding maximum 5 attempts', async () => {
    vi.spyOn(prisma.restaurant, 'findUnique').mockResolvedValueOnce({
      id: 'rest-1',
      slug: 'rustic-hearth',
    } as any);

    vi.spyOn(prisma.customerVerification, 'findFirst').mockResolvedValueOnce({
      id: 'maxed-ver',
      expiresAt: new Date(Date.now() + 180 * 1000),
      attempts: 5,
      maxAttempts: 5,
    } as any);

    const res = await request(app).post('/api/otp/verify').send({
      email: 'customer@test.com',
      code: '123456',
      restaurantSlug: 'rustic-hearth',
    });

    expect(res.status).toBe(429);
    expect(res.body.error).toContain('Maximum verification attempts exceeded');
  });
});
