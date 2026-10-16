import { describe, it, expect } from 'vitest';
import { brevoService } from '../services/brevo.service.js';

describe('Brevo Service & OTP Verification Unit Tests', () => {
  it('should generate a 6-digit numeric OTP string', () => {
    const otp = brevoService.generateOtp();
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
    const num = parseInt(otp, 10);
    expect(num).toBeGreaterThanOrEqual(100000);
    expect(num).toBeLessThan(1000000);
  });

  it('should generate different random OTPs on subsequent invocations', () => {
    const otps = new Set<string>();
    for (let i = 0; i < 20; i++) {
      otps.add(brevoService.generateOtp());
    }
    expect(otps.size).toBeGreaterThan(15);
  });

  it('should compute consistent deterministic salted HMAC hash for the same email and OTP', () => {
    const email = 'Customer@Example.Com';
    const otp = '482910';
    const hash1 = brevoService.hashOtp(otp, email);
    const hash2 = brevoService.hashOtp(otp, 'customer@example.com');
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex length
  });

  it('should verify correct OTP successfully and reject incorrect OTP', () => {
    const email = 'tester@domain.com';
    const otp = '839201';
    const hash = brevoService.hashOtp(otp, email);

    expect(brevoService.verifyOtpHash(otp, email, hash)).toBe(true);
    expect(brevoService.verifyOtpHash('000000', email, hash)).toBe(false);
    expect(brevoService.verifyOtpHash('839202', email, hash)).toBe(false);
    expect(brevoService.verifyOtpHash(otp, 'other@domain.com', hash)).toBe(false);
  });

  it('should handle mock delivery mode gracefully in test environment', async () => {
    const result = await brevoService.sendOtpEmail('test@example.com', '123456', 'Rustic Hearth');
    expect(result.delivered).toBe(true);
    expect(result.isMock).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it('should generate signed customer session token containing email and table info', () => {
    const token = brevoService.generateCustomerSessionToken({
      email: 'customer@example.com',
      restaurantId: 'rest-123',
      tableId: 'tbl-456',
      tableNumber: 'T-05',
    });

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });
});
