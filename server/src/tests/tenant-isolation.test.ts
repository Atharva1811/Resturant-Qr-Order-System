import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { config } from '../config/index.js';
import prisma from '../lib/prisma.js';

describe('Multi-Tenant Data Isolation Tests', () => {
  const app = createApp();

  const tenantAdminTokenA = jwt.sign(
    {
      userId: 'user-admin-a',
      email: 'admin@tenant-a.com',
      role: 'RESTAURANT_ADMIN',
      restaurantId: 'tenant-a-id',
      name: 'Manager A',
    },
    config.jwtSecret
  );

  it('strictly scopes admin menu queries to the authenticated tenantId', async () => {
    const findManySpy = vi.spyOn(prisma.menuItem, 'findMany').mockResolvedValueOnce([] as any);

    await request(app)
      .get('/api/admin/menu')
      .set('Authorization', `Bearer ${tenantAdminTokenA}`);

    expect(findManySpy).toHaveBeenCalled();
    const callArgs = findManySpy.mock.calls[0][0];
    expect(callArgs?.where?.restaurantId).toBe('tenant-a-id');
  });

  it('prevents kitchen staff of Tenant A from modifying order belonging to Tenant B', async () => {
    const kitchenTokenA = jwt.sign(
      {
        userId: 'kitchen-a',
        email: 'kitchen@tenant-a.com',
        role: 'KITCHEN_STAFF',
        restaurantId: 'tenant-a-id',
        name: 'Cook A',
      },
      config.jwtSecret
    );

    // Mock order in DB belonging to tenant-b-id
    vi.spyOn(prisma.order, 'findUnique').mockResolvedValueOnce({
      id: 'order-tenant-b',
      restaurantId: 'tenant-b-id',
      status: 'NEW',
      items: [],
    } as any);

    const res = await request(app)
      .patch('/api/kitchen/orders/order-tenant-b/status')
      .set('Authorization', `Bearer ${kitchenTokenA}`)
      .send({ status: 'ACCEPTED' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('belongs to another restaurant');
  });

  it('prevents table URL tampering: rejects table verification if table does not belong to restaurant', async () => {
    vi.spyOn(prisma.restaurant, 'findUnique').mockResolvedValueOnce({
      id: 'restaurant-x',
      slug: 'restaurant-x',
    } as any);

    vi.spyOn(prisma.table, 'findFirst').mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/public/tables/verify?slug=restaurant-x&table=T-99&token=fake-token');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('does not exist in this restaurant');
  });
});
