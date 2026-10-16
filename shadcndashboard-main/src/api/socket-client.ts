import { io, Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = (import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000').replace(/\/+$/, '');

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const token = localStorage.getItem('sudarshan_auth_token');
    socket = io(SOCKET_SERVER_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to Sudarshan Real-time Socket Server');
    });

    socket.on('disconnect', (reason) => {
      console.log('⚡ Disconnected from Socket Server:', reason);
    });
  }

  return socket;
};

export const joinOrderRoom = (orderId: string): void => {
  const s = getSocket();
  s.emit('join_order_room', { orderId });
};

export const joinRestaurantRoom = (restaurantId: string): void => {
  const s = getSocket();
  s.emit('join_restaurant_room', restaurantId);
};

export const onOrderCreated = (callback: (order: any) => void): (() => void) => {
  const s = getSocket();
  s.on('order:created', callback);
  return () => {
    s.off('order:created', callback);
  };
};

export const onOrderStatusUpdated = (
  callback: (data: { orderId: string; status: string; order: any }) => void
): (() => void) => {
  const s = getSocket();
  s.on('order:status_updated', callback);
  return () => {
    s.off('order:status_updated', callback);
  };
};

export const onItemAvailabilityChanged = (
  callback: (data: { itemId: string; isAvailable: boolean }) => void
): (() => void) => {
  const s = getSocket();
  s.on('order:item_availability_changed', callback);
  return () => {
    s.off('order:item_availability_changed', callback);
  };
};

export const onPaymentUpdated = (
  callback: (data: { orderId: string; paymentStatus: string; order?: any }) => void
): (() => void) => {
  const s = getSocket();
  s.on('order:payment_updated', callback);
  return () => {
    s.off('order:payment_updated', callback);
  };
};

export const onSocketConnect = (callback: () => void): (() => void) => {
  const s = getSocket();
  s.on('connect', callback);
  return () => {
    s.off('connect', callback);
  };
};

export const onSocketDisconnect = (callback: (reason: string) => void): (() => void) => {
  const s = getSocket();
  s.on('disconnect', callback);
  return () => {
    s.off('disconnect', callback);
  };
};

