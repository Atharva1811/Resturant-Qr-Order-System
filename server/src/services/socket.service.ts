import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { JwtUserPayload, CustomerSessionPayload } from '../types/index.js';

export class SocketService {
  private io: SocketIOServer | null = null;

  public initialize(httpServer: HttpServer): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.io.use((socket: Socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;

      if (!token || typeof token !== 'string') {
        // Allow unauthenticated connection for customer live tracking room joins (they provide order token on join)
        return next();
      }

      try {
        const decoded = jwt.verify(token, config.jwtSecret) as any;
        (socket as any).user = decoded;
        next();
      } catch (err) {
        // Continue unauthenticated, but socket.user will be undefined
        next();
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const user = (socket as any).user as JwtUserPayload | CustomerSessionPayload | undefined;

      // Auto-join tenant room if staff
      if (user && 'role' in user && user.restaurantId) {
        const restaurantRoom = `restaurant_${user.restaurantId}`;
        socket.join(restaurantRoom);

        if (user.role === 'KITCHEN_STAFF') {
          socket.join(`restaurant_${user.restaurantId}_kitchen`);
        }
      }

      // Customer joining specific order tracking room
      socket.on('join_order_room', (data: { orderId: string; customerEmail?: string }) => {
        if (data?.orderId) {
          socket.join(`order_${data.orderId}`);
        }
      });

      // Explicit room join with tenant validation
      socket.on('join_restaurant_room', (restaurantId: string) => {
        if (!restaurantId) return;

        // If authenticated user, verify they belong to this restaurant or are superadmin
        if (user && 'role' in user) {
          if (user.role === 'SUPERADMIN' || user.restaurantId === restaurantId) {
            socket.join(`restaurant_${restaurantId}`);
          }
        } else {
          // Public read-only menu channel for availability events
          socket.join(`restaurant_${restaurantId}_public`);
        }
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
