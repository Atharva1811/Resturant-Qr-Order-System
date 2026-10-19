import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { JwtUserPayload, CustomerSessionPayload } from '../types/index.js';
import prisma from '../lib/prisma.js';

export class SocketService {
  private io: SocketIOServer | null = null;

  public initialize(httpServer: HttpServer): SocketIOServer {
    const allowedOrigins = [
      config.frontendUrl,
      'https://atharva1811.github.io',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ].filter(Boolean);

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          if (
            allowedOrigins.includes(origin) ||
            origin.endsWith('.github.io') ||
            origin.startsWith('http://localhost:')
          ) {
            return callback(null, true);
          }
          return callback(null, true);
        },
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Authenticate socket handshake connection
    this.io.use((socket: Socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;

      if (!token || typeof token !== 'string') {
        // Allow unauthenticated connection for public customer browsing (public menu channel only)
        return next();
      }

      try {
        const decoded = jwt.verify(token, config.jwtSecret) as any;
        (socket as any).user = decoded;
        next();
      } catch (err) {
        // Invalid token attached: reject connection with unauthorized error
        next(new Error('Authentication failed: invalid token'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const user = (socket as any).user as JwtUserPayload | CustomerSessionPayload | undefined;

      // Auto-join authorized tenant room for staff based on authenticated JWT
      if (user && 'role' in user && user.restaurantId) {
        const restaurantRoom = `restaurant_${user.restaurantId}`;
        socket.join(restaurantRoom);

        if (user.role === 'KITCHEN_STAFF') {
          socket.join(`restaurant_${user.restaurantId}_kitchen`);
        }
      }

      // Server-side authorized room subscription: Customer order tracking room
      socket.on(
        'join_order_room',
        async (data: { orderId: string; sessionToken?: string }, ack?: (res: any) => void) => {
          if (!data?.orderId) {
            if (ack) ack({ success: false, error: 'orderId is required' });
            return;
          }

          // Case 1: Authenticated Staff user whose restaurant owns the order
          if (user && 'role' in user) {
            if (user.role === 'SUPERADMIN') {
              socket.join(`order_${data.orderId}`);
              if (ack) ack({ success: true, room: `order_${data.orderId}` });
              return;
            }

            const order = await prisma.order.findUnique({
              where: { id: data.orderId },
              select: { restaurantId: true },
            });

            if (order && order.restaurantId === user.restaurantId) {
              socket.join(`order_${data.orderId}`);
              if (ack) ack({ success: true, room: `order_${data.orderId}` });
              return;
            } else {
              socket.emit('socket_error', { message: 'Unauthorized: order belongs to another restaurant' });
              if (ack) ack({ success: false, error: 'Unauthorized' });
              return;
            }
          }

          // Case 2: Customer with customer session token
          const customerToken = data.sessionToken || (user && 'type' in user ? (socket.handshake.auth?.token as string) : null);
          if (customerToken) {
            try {
              const decoded = jwt.verify(customerToken, config.jwtSecret) as CustomerSessionPayload;
              if (decoded.type === 'CUSTOMER_SESSION') {
                const order = await prisma.order.findUnique({
                  where: { id: data.orderId },
                  select: { customerEmail: true, restaurantId: true },
                });

                if (order && (order.customerEmail === decoded.email || order.restaurantId === decoded.restaurantId)) {
                  socket.join(`order_${data.orderId}`);
                  if (ack) ack({ success: true, room: `order_${data.orderId}` });
                  return;
                }
              }
            } catch {
              // Token invalid
            }
          }

          // Case 3: Public tracking verification - verify order exists before joining
          const order = await prisma.order.findUnique({
            where: { id: data.orderId },
            select: { id: true },
          });

          if (order) {
            socket.join(`order_${data.orderId}`);
            if (ack) ack({ success: true, room: `order_${data.orderId}` });
          } else {
            socket.emit('socket_error', { message: 'Order not found' });
            if (ack) ack({ success: false, error: 'Order not found' });
          }
        }
      );

      // Server-side authorized room subscription: Restaurant Room
      // Prevents client from joining arbitrary restaurant rooms
      socket.on('join_restaurant_room', (targetRestaurantId: string, ack?: (res: any) => void) => {
        if (!targetRestaurantId) {
          if (ack) ack({ success: false, error: 'targetRestaurantId required' });
          return;
        }

        if (user && 'role' in user) {
          // Superadmin can inspect any restaurant room
          if (user.role === 'SUPERADMIN') {
            socket.join(`restaurant_${targetRestaurantId}`);
            if (ack) ack({ success: true });
            return;
          }

          // Tenant staff can ONLY join their own restaurant room
          if (user.restaurantId === targetRestaurantId) {
            socket.join(`restaurant_${targetRestaurantId}`);
            if (ack) ack({ success: true });
            return;
          }

          // Attempt to join another restaurant's room is blocked
          socket.emit('socket_error', {
            message: 'Forbidden: you cannot join real-time room of another restaurant tenant',
          });
          if (ack) ack({ success: false, error: 'Forbidden' });
          return;
        }

        // Unauthenticated users are strictly limited to the public channel (menu item 86 updates)
        socket.join(`restaurant_${targetRestaurantId}_public`);
        if (ack) ack({ success: true, channel: 'public' });
      });

      socket.on('disconnect', () => {
        // Clean disconnect
      });
    });

    return this.io;
  }

  public getIO(): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.IO is not initialized yet. Call initialize() first.');
    }
    return this.io;
  }

  public notifyOrderCreated(restaurantId: string, order: any): void {
    if (!this.io) return;
    this.io.to(`restaurant_${restaurantId}`).emit('order:created', order);
    this.io.to(`restaurant_${restaurantId}_kitchen`).emit('order:created', order);
  }

  public notifyOrderStatusUpdated(restaurantId: string, orderId: string, status: string, order: any): void {
    if (!this.io) return;
    // Broadcast to restaurant staff
    this.io.to(`restaurant_${restaurantId}`).emit('order:status_updated', { orderId, status, order });
    this.io.to(`restaurant_${restaurantId}_kitchen`).emit('order:status_updated', { orderId, status, order });
    // Broadcast to customer tracking this specific order
    this.io.to(`order_${orderId}`).emit('order:status_updated', { orderId, status, order });
  }

  public notifyItemAvailabilityChanged(restaurantId: string, itemId: string, isAvailable: boolean): void {
    if (!this.io) return;
    this.io.to(`restaurant_${restaurantId}`).emit('order:item_availability_changed', { itemId, isAvailable });
    this.io.to(`restaurant_${restaurantId}_public`).emit('order:item_availability_changed', { itemId, isAvailable });
  }

  public notifyPaymentUpdated(restaurantId: string, orderId: string, paymentStatus: string, order?: any): void {
    if (!this.io) return;
    this.io.to(`restaurant_${restaurantId}`).emit('order:payment_updated', { orderId, paymentStatus, order });
    this.io.to(`order_${orderId}`).emit('order:payment_updated', { orderId, paymentStatus, order });
  }
}

export const socketService = new SocketService();
