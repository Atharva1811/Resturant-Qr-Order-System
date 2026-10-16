import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { socketService } from '../services/socket.service.js';
import { config } from '../config/index.js';

describe('Real-Time Socket.IO Authorization Tests', () => {
  let server: http.Server;
  let serverPort: number;

  beforeAll(async () => {
    const app = createApp();
    server = http.createServer(app);
    socketService.initialize(server);

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address() as any;
        serverPort = address.port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('allows authenticated staff to connect with valid JWT', async () => {
    const token = jwt.sign(
      { userId: 'u-1', email: 'staff@rustic.com', role: 'KITCHEN_STAFF', restaurantId: 'rest-rustic' },
      config.jwtSecret
    );

    const client: ClientSocket = Client(`http://localhost:${serverPort}`, {
      auth: { token },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve, reject) => {
      client.on('connect', () => {
        expect(client.connected).toBe(true);
        client.disconnect();
        resolve();
      });
      client.on('connect_error', reject);
    });
  });

  it('rejects socket connection with forged or invalid JWT token', async () => {
    const client: ClientSocket = Client(`http://localhost:${serverPort}`, {
      auth: { token: 'invalid.forged.jwt' },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => {
      client.on('connect_error', (err) => {
        expect(err.message).toContain('Authentication failed');
        client.disconnect();
        resolve();
      });
    });
  });

  it('enforces tenant scoping: rejects staff attempting to join another restaurant room', async () => {
    const token = jwt.sign(
      { userId: 'u-staff-a', email: 'staff@a.com', role: 'RESTAURANT_ADMIN', restaurantId: 'rest-tenant-a' },
      config.jwtSecret
    );

    const client: ClientSocket = Client(`http://localhost:${serverPort}`, {
      auth: { token },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => {
      client.on('connect', () => {
        // Attempt to join Tenant B's room
        client.emit('join_restaurant_room', 'rest-tenant-b', (response: any) => {
          expect(response.success).toBe(false);
          expect(response.error).toBe('Forbidden');
          client.disconnect();
          resolve();
        });
      });
    });
  });

  it('allows staff to join their own restaurant room successfully', async () => {
    const token = jwt.sign(
      { userId: 'u-staff-a', email: 'staff@a.com', role: 'RESTAURANT_ADMIN', restaurantId: 'rest-tenant-a' },
      config.jwtSecret
    );

    const client: ClientSocket = Client(`http://localhost:${serverPort}`, {
      auth: { token },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => {
      client.on('connect', () => {
        client.emit('join_restaurant_room', 'rest-tenant-a', (response: any) => {
          expect(response.success).toBe(true);
          client.disconnect();
          resolve();
        });
      });
    });
  });
});
