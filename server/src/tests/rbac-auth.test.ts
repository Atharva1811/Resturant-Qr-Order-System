import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { config } from '../config/index.js';
import prisma from '../lib/prisma.js';

describe('Auth & RBAC Guards Integration Tests', () => {
  const app = createApp();

  const superadminToken = jwt.sign(
    { userId: 'user-super', email: 'super@test.com', role: 'SUPERADMIN', name: 'Super Admin' },
    config.jwtSecret
  );

  const adminToken = jwt.sign(
    {
      userId: 'user-admin',
      email: 'admin@rustic.com',
      role: 'RESTAURANT_ADMIN',
      restaurantId: 'rest-rustic-1',
      name: 'Chef Marco',
    },
    config.jwtSecret
  );

  const kitchenToken = jwt.sign(
    {
      userId: 'user-kitchen',
      email: 'kitchen@rustic.com',
      role: 'KITCHEN_STAFF',
      restaurantId: 'rest-rustic-1',
      name: 'Sous Chef Sarah',
    },
    config.jwtSecret
  );

  const waiterToken = jwt.sign(
    {
      userId: 'user-waiter',
      email: 'waiter@rustic.com',
      role: 'WAITER',
      restaurantId: 'rest-rustic-1',
      name: 'Server Alex',
    },
    config.jwtSecret
  );

  it('GET /health returns 200 with service status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toContain('Sudarshan QR');
  });

  it('blocks unauthenticated requests to protected admin routes with 401', async () => {
    const res = await request(app).get('/api/admin/menu');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('blocks requests with forged/tampered JWT with 401', async () => {
    const res = await request(app)
      .get('/api/admin/menu')
      .set('Authorization', 'Bearer forged.tampered.token');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('allows SUPERADMIN to access platform metrics', async () => {
    vi.spyOn(prisma.restaurant, 'findMany').mockResolvedValueOnce([] as any);
    vi.spyOn(prisma.order, 'count').mockResolvedValueOnce(0);
    vi.spyOn(prisma.restaurant, 'aggregate').mockResolvedValueOnce({
      _sum: { totalRevenue: 0, totalOrders: 0 },
    } as any);

    const res = await request(app)
      .get('/api/superadmin/metrics')
      .set('Authorization', `Bearer ${superadminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('forbids KITCHEN_STAFF from accessing superadmin tenant management (403)', async () => {
    const res = await request(app)
      .get('/api/superadmin/tenants')
      .set('Authorization', `Bearer ${kitchenToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('forbids WAITER from modifying or viewing administrative menu routes (403)', async () => {
    const res = await request(app)
      .get('/api/admin/menu')
      .set('Authorization', `Bearer ${waiterToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
