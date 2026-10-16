import { describe, it, expect, vi } from 'vitest';
import { qrService } from '../services/qr.service.js';
import prisma from '../lib/prisma.js';

describe('QR Code & Table Validation Tests', () => {
  it('generates cryptographic 32-hex character table tokens', () => {
    const token1 = qrService.generateQrToken();
    const token2 = qrService.generateQrToken();

    expect(token1).toHaveLength(32);
    expect(token2).toHaveLength(32);
    expect(token1).not.toBe(token2);
    expect(/^[a-f0-9]{32}$/.test(token1)).toBe(true);
  });

  it('builds canonical customer-facing scan URL with slug, table, and token', () => {
    const url = qrService.buildCustomerMenuUrl(
      'http://localhost:5173',
      'rustic-hearth',
      'T-04',
      'tok_abc123'
    );

    expect(url).toBe('http://localhost:5173/customer/menu?slug=rustic-hearth&table=T-04&token=tok_abc123');
  });

  it('validates active table successfully when table and token match', async () => {
    vi.spyOn(prisma.table, 'findFirst').mockResolvedValueOnce({
      id: 'tbl-1',
      restaurantId: 'rest-1',
      tableNumber: 'T-01',
      status: 'AVAILABLE',
      qrToken: 'valid_token_123',
    } as any);

    const result = await qrService.verifyTable(prisma, 'rest-1', 'T-01', 'valid_token_123');
    expect(result.isValid).toBe(true);
    expect(result.table?.tableNumber).toBe('T-01');
  });

  it('detects URL tampering: rejects if table token does not match recorded token', async () => {
    vi.spyOn(prisma.table, 'findFirst').mockResolvedValueOnce({
      id: 'tbl-1',
      restaurantId: 'rest-1',
      tableNumber: 'T-01',
      status: 'AVAILABLE',
      qrToken: 'actual_secret_token',
    } as any);

    const result = await qrService.verifyTable(prisma, 'rest-1', 'T-01', 'tampered_token');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Invalid or expired QR code token');
  });

  it('rejects access if table is currently marked as RESERVED', async () => {
    vi.spyOn(prisma.table, 'findFirst').mockResolvedValueOnce({
      id: 'tbl-2',
      restaurantId: 'rest-1',
      tableNumber: 'T-02',
      status: 'RESERVED',
      qrToken: 'valid_token',
    } as any);

    const result = await qrService.verifyTable(prisma, 'rest-1', 'T-02', 'valid_token');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('currently reserved');
  });
});
