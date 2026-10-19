import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createApp } from '../app.js';
import { config } from '../config/index.js';
import prisma from '../lib/prisma.js';
import { qrService } from '../services/qr.service.js';
import { paymentService } from '../services/payment.service.js';

describe('Servora Critical Workflow: Registration, Table QR, Customer Ordering & Security', () => {
  const app = createApp();

  const generateToken = (payload: { userId: string; email: string; role: string; restaurantId?: string }) => {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('PHASE 2: Restaurant Registration Security', () => {
    it('successfully registers a new restaurant with atomic transaction, hashes password, and creates admin user', async () => {
      // Mock unique checks: user findUnique returns null, restaurant findUnique returns null
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);
      vi.spyOn(prisma.restaurant, 'findUnique').mockResolvedValueOnce(null);

      // Mock transaction execution
      const mockRestaurant = {
        id: 'rest-new-123',
        name: 'Gourmet Bistro',
        slug: 'gourmet-bistro',
        cuisine: 'French Contemporary',
        currency: 'USD',
        taxRate: 8.5,
        status: 'ACTIVE',
      };
      const mockUser = {
        id: 'user-new-123',
        email: 'chef@gourmetbistro.com',
        name: 'Chef Pierre',
        role: 'RESTAURANT_ADMIN',
        restaurantId: 'rest-new-123',
        isActive: true,
        restaurant: mockRestaurant,
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const txMock = {
          restaurant: { create: vi.fn().mockResolvedValue(mockRestaurant) },
          user: { create: vi.fn().mockResolvedValue(mockUser) },
          restaurantStaff: { create: vi.fn().mockResolvedValue({}) },
          table: { create: vi.fn().mockResolvedValue({}) },
          menuCategory: { create: vi.fn().mockResolvedValue({}) },
        };
        return callback(txMock);
      });

      const res = await request(app)
        .post('/api/auth/register-restaurant')
        .send({
          restaurantName: 'Gourmet Bistro',
          cuisine: 'French Contemporary',
          ownerName: 'Chef Pierre',
          email: 'chef@gourmetbistro.com',
          password: 'SecurePassword123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('chef@gourmetbistro.com');
      expect(res.body.data.user.role).toBe('RESTAURANT_ADMIN');
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.restaurant.slug).toBe('gourmet-bistro');
    });

    it('rejects registration when email is already registered (409 Conflict)', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
        id: 'existing-user-1',
        email: 'chef@gourmetbistro.com',
      } as any);

      const res = await request(app)
        .post('/api/auth/register-restaurant')
        .send({
          restaurantName: 'Gourmet Bistro',
          ownerName: 'Chef Pierre',
          email: 'chef@gourmetbistro.com',
          password: 'SecurePassword123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already exists');
    });

    it('rejects registration when restaurant slug already exists (409 Conflict)', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);
      vi.spyOn(prisma.restaurant, 'findUnique').mockResolvedValueOnce({
        id: 'existing-rest-1',
        slug: 'gourmet-bistro',
      } as any);

      const res = await request(app)
        .post('/api/auth/register-restaurant')
        .send({
          restaurantName: 'Gourmet Bistro',
          ownerName: 'Chef Pierre',
          email: 'chef2@gourmetbistro.com',
          password: 'SecurePassword123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already exists');
    });

    it('strictly forbids privilege escalation: public registration never allows creating a SUPERADMIN', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);
      vi.spyOn(prisma.restaurant, 'findUnique').mockResolvedValueOnce(null);

      let createdUserRole = '';
      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const txMock = {
          restaurant: { create: vi.fn().mockResolvedValue({ id: 'rest-1', slug: 'hacker-rest' }) },
          user: {
            create: vi.fn().mockImplementation((args: any) => {
              createdUserRole = args.data.role;
              return {
                id: 'u-1',
                email: 'hacker@rest.com',
                role: args.data.role,
                restaurantId: 'rest-1',
              };
            }),
          },
          restaurantStaff: { create: vi.fn().mockResolvedValue({}) },
          table: { create: vi.fn().mockResolvedValue({}) },
          menuCategory: { create: vi.fn().mockResolvedValue({}) },
        };
        return callback(txMock);
      });

      // Attacker sends role: 'SUPERADMIN' in payload
      const res = await request(app)
        .post('/api/auth/register-restaurant')
        .send({
          restaurantName: 'Hacker Restaurant',
          ownerName: 'Attacker',
          email: 'hacker@rest.com',
          password: 'Password123!',
          role: 'SUPERADMIN',
        });

      expect(res.status).toBe(201);
      expect(createdUserRole).toBe('RESTAURANT_ADMIN');
      expect(res.body.data.user.role).toBe('RESTAURANT_ADMIN');
    });
  });

  describe('PHASE 3 & 4: Table Management, Tenant Isolation & QR Integrity', () => {
    const adminTokenRest1 = generateToken({
      userId: 'u-admin-1',
      email: 'admin1@restaurant.com',
      role: 'RESTAURANT_ADMIN',
      restaurantId: 'rest-1',
    });

    it('allows authorized restaurant admin to create table with unique secure QR token', async () => {
      vi.spyOn(prisma.table, 'findFirst').mockResolvedValueOnce(null); // No duplicate tableNumber
      vi.spyOn(prisma.table, 'create').mockResolvedValueOnce({
        id: 'tbl-101',
        restaurantId: 'rest-1',
        tableNumber: 'Table 5',
        capacity: 4,
        status: 'AVAILABLE',
        qrToken: '55555555555555555555555555555555',
      } as any);

      const res = await request(app)
        .post('/api/admin/tables')
        .set('Authorization', `Bearer ${adminTokenRest1}`)
        .send({
          tableNumber: 'Table 5',
          capacity: 4,
          status: 'AVAILABLE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.qrToken).toBeDefined();
      expect(res.body.data.qrToken.length).toBe(32);
    });

    it('rejects unauthorized table creation when token is missing (401)', async () => {
      const res = await request(app)
        .post('/api/admin/tables')
        .send({ tableNumber: 'Table 9' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('prevents cross-tenant table manipulation: admin from Restaurant 1 cannot rotate QR of Restaurant 2', async () => {
      // prisma.table.findFirst checking where: { id: 'tbl-rest2-01', restaurantId: 'rest-1' } returns null
      vi.spyOn(prisma.table, 'findFirst').mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/admin/tables/tbl-rest2-01/regenerate-qr')
        .set('Authorization', `Bearer ${adminTokenRest1}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Table not found for this restaurant');
    });

    it('preserves order history when deleting a table that has past orders (deactivates to RESERVED instead of hard deleting)', async () => {
      vi.spyOn(prisma.table, 'findFirst').mockResolvedValueOnce({
        id: 'tbl-with-orders',
        restaurantId: 'rest-1',
        tableNumber: 'Table 1',
      } as any);

      // Order count > 0
      vi.spyOn(prisma.order, 'count').mockResolvedValueOnce(3);
      vi.spyOn(prisma.table, 'update').mockResolvedValueOnce({
        id: 'tbl-with-orders',
        status: 'RESERVED',
      } as any);

      const res = await request(app)
        .delete('/api/admin/tables/tbl-with-orders')
        .set('Authorization', `Bearer ${adminTokenRest1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deactivated');
    });

    it('generates distinct QR payloads and tokens for different tables', () => {
      const tokenA = qrService.generateQrToken();
      const tokenB = qrService.generateQrToken();
      expect(tokenA).not.toBe(tokenB);

      const urlA = qrService.buildCustomerMenuUrl('https://example.com/app', 'bistro', 'T-01', tokenA);
      const urlB = qrService.buildCustomerMenuUrl('https://example.com/app', 'bistro', 'T-02', tokenB);

      expect(urlA).toContain('/m/bistro/t-01?token=' + tokenA);
      expect(urlB).toContain('/m/bistro/t-02?token=' + tokenB);
      expect(urlA).not.toBe(urlB);
    });

    it('resolves tables in different restaurants to their respective separate contexts', () => {
      const urlRest1 = qrService.buildCustomerMenuUrl('https://example.com', 'restaurant-alpha', 'T-01', 'token1');
      const urlRest2 = qrService.buildCustomerMenuUrl('https://example.com', 'restaurant-beta', 'T-01', 'token2');

      expect(urlRest1).toBe('https://example.com/m/restaurant-alpha/t-01?token=token1');
      expect(urlRest2).toBe('https://example.com/m/restaurant-beta/t-01?token=token2');
    });
  });

  describe('PHASE 5: Customer-Only Routing & Table Verification', () => {
    it('allows a customer to verify an active table with valid QR token', async () => {
      vi.spyOn(prisma.restaurant, 'findUnique').mockResolvedValueOnce({
        id: 'rest-1',
        name: 'The Rustic Hearth',
        slug: 'rustic-hearth',
        status: 'ACTIVE',
        currency: 'USD',
        taxRate: 8.5,
      } as any);

      vi.spyOn(prisma.table, 'findFirst').mockResolvedValueOnce({
        id: 'tbl-1',
        restaurantId: 'rest-1',
        tableNumber: 'T-01',
        capacity: 4,
        status: 'AVAILABLE',
        qrToken: 'valid_crypto_token_32_chars_ok',
      } as any);

      const res = await request(app)
        .get('/api/public/tables/verify?slug=rustic-hearth&table=T-01&token=valid_crypto_token_32_chars_ok');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.table.tableNumber).toBe('T-01');
      expect(res.body.data.restaurant.slug).toBe('rustic-hearth');
    });

    it('rejects verification if token has been revoked or tampered with (400)', async () => {
      vi.spyOn(prisma.restaurant, 'findUnique').mockResolvedValueOnce({
        id: 'rest-1',
        slug: 'rustic-hearth',
      } as any);

      vi.spyOn(prisma.table, 'findFirst').mockResolvedValueOnce({
        id: 'tbl-1',
        restaurantId: 'rest-1',
        tableNumber: 'T-01',
        status: 'AVAILABLE',
        qrToken: 'active_token_123',
      } as any);

      const res = await request(app)
        .get('/api/public/tables/verify?slug=rustic-hearth&table=T-01&token=stale_or_tampered_token');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid or expired QR code token');
    });

    it('strictly denies customer or unauthenticated access to admin dashboard routes (401)', async () => {
      const endpoints = [
        '/api/admin/tables',
        '/api/admin/staff',
        '/api/admin/settings',
        '/api/kitchen/orders',
        '/api/superadmin/restaurants',
      ];

      for (const endpoint of endpoints) {
        const res = await request(app).get(endpoint);
        expect(res.status).toBe(401);
      }
    });
  });

  describe('PHASE 6: Order-to-Table Persistence & Integrity', () => {
    it('creates an order with server-recalculated prices, snapshots, and prevents client price tampering', async () => {
      vi.spyOn(prisma.restaurant, 'findUnique').mockResolvedValueOnce({
        id: 'rest-1',
        slug: 'rustic-hearth',
        taxRate: 10,
        status: 'ACTIVE',
        totalOrders: 10,
      } as any);

      // Mock verifyTable
      vi.spyOn(prisma.table, 'findFirst').mockResolvedValueOnce({
        id: 'tbl-1',
        restaurantId: 'rest-1',
        tableNumber: 'T-01',
        status: 'AVAILABLE',
        qrToken: 'token_123',
      } as any);

      // Mock duplicate check (returns null)
      vi.spyOn(prisma.order, 'findFirst').mockResolvedValueOnce(null);

      // Mock menu items: Server unit price is 15.00
      vi.spyOn(prisma.menuItem, 'findMany').mockResolvedValueOnce([
        {
          id: 'b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          name: 'Truffle Burger',
          price: 15.00,
          isAvailable: true,
          restaurantId: 'rest-1',
          customizationGroups: [],
        },
      ] as any);

      vi.spyOn(paymentService, 'initiatePayment').mockResolvedValueOnce({
        orderId: 'ord-123',
        status: 'PENDING',
        method: 'COUNTER',
      } as any);

      let createdOrderData: any = null;
      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const txMock = {
          restaurant: { update: vi.fn().mockResolvedValue({ totalOrders: 11 }) },
          order: {
            create: vi.fn().mockImplementation((args: any) => {
              createdOrderData = args.data;
              return {
                id: 'ord-123',
                orderNumber: 'ORD-1011',
                ...args.data,
              };
            }),
          },
          auditEvent: { create: vi.fn().mockResolvedValue({}) },
        };
        return callback(txMock);
      });

      const res = await request(app)
        .post('/api/public/orders')
        .send({
          restaurantSlug: 'rustic-hearth',
          tableNumber: 'T-01',
          tableToken: 'token_123',
          customerName: 'Alice Smith',
          customerEmail: 'alice@example.com',
          paymentMethod: 'COUNTER',
          items: [
            {
              menuItemId: 'b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
              quantity: 2,
              notes: 'No pickles',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      // Server calculated: 2 * 15.00 = 30.00 subtotal, 10% tax = 3.00, total = 33.00
      expect(createdOrderData).toBeDefined();
      expect(createdOrderData.subtotal).toBe(30.00);
      expect(createdOrderData.tax).toBe(3.00);
      expect(createdOrderData.total).toBe(33.00);
      expect(createdOrderData.tableId).toBe('tbl-1');
      expect(createdOrderData.tableNumberSnapshot).toBe('T-01');
    });

    it('rejects order if requested menu item is sold out or unavailable (400)', async () => {
      vi.spyOn(prisma.restaurant, 'findUnique').mockResolvedValueOnce({
        id: 'rest-1',
        slug: 'rustic-hearth',
        taxRate: 10,
        status: 'ACTIVE',
      } as any);

      vi.spyOn(prisma.table, 'findFirst').mockResolvedValueOnce({
        id: 'tbl-1',
        restaurantId: 'rest-1',
        tableNumber: 'T-01',
        status: 'AVAILABLE',
      } as any);

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValueOnce(null);

      vi.spyOn(prisma.menuItem, 'findMany').mockResolvedValueOnce([
        {
          id: 'b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          name: 'Special Steak',
          price: 35.00,
          isAvailable: false, // SOLD OUT
          restaurantId: 'rest-1',
          customizationGroups: [],
        },
      ] as any);

      const res = await request(app)
        .post('/api/public/orders')
        .send({
          restaurantSlug: 'rustic-hearth',
          tableNumber: 'T-01',
          customerName: 'Bob',
          customerEmail: 'bob@example.com',
          items: [
            {
              menuItemId: 'b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
              quantity: 1,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('sold out / unavailable');
    });

    it('rejects order if menu item belongs to another restaurant tenant (400)', async () => {
      vi.spyOn(prisma.restaurant, 'findUnique').mockResolvedValueOnce({
        id: 'rest-1',
        slug: 'rustic-hearth',
        taxRate: 10,
        status: 'ACTIVE',
      } as any);

      vi.spyOn(prisma.table, 'findFirst').mockResolvedValueOnce({
        id: 'tbl-1',
        restaurantId: 'rest-1',
        tableNumber: 'T-01',
        status: 'AVAILABLE',
      } as any);

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValueOnce(null);

      // menuItem query with where: { id: in [...], restaurantId: 'rest-1' } returns empty because item is in rest-2
      vi.spyOn(prisma.menuItem, 'findMany').mockResolvedValueOnce([]);

      const res = await request(app)
        .post('/api/public/orders')
        .send({
          restaurantSlug: 'rustic-hearth',
          tableNumber: 'T-01',
          customerName: 'Eve',
          customerEmail: 'eve@example.com',
          items: [
            {
              menuItemId: 'b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
              quantity: 1,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('does not exist in this restaurant');
    });
  });
});
