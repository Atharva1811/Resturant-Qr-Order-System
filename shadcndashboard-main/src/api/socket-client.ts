import { io, Socket } from 'socket.io-client';
import { BRAND_CONFIG } from 'src/config/brand.config';
import { isTestMode } from 'src/config/api.config';

function resolveSocketUrl(): string {
  const envSocket = (import.meta.env.VITE_SOCKET_URL || '').trim();
  if (envSocket) return envSocket.replace(/\/+$/, '');

  const envApi = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim();
  if (envApi) return envApi.replace(/\/api\/?$/, '');

  if (import.meta.env.DEV) {
    return 'http://localhost:5000';
  }

  return '';
}

const SOCKET_SERVER_URL = resolveSocketUrl();

let socket: Socket | null = null;

// Safe no-op dummy socket for Test Mode or when backend is unconfigured
const dummySocket = {
  on: () => dummySocket,
  off: () => dummySocket,
  emit: () => dummySocket,
  connect: () => dummySocket,
  disconnect: () => dummySocket,
  connected: false,
} as unknown as Socket;

export const getSocket = (): Socket => {
  // If in Test Mode or no socket server is configured, return dummy stub
  if (isTestMode() || !SOCKET_SERVER_URL) {
    return dummySocket;
  }

  if (!socket) {
    const token = localStorage.getItem(BRAND_CONFIG.authTokenKey);
    try {
      socket = io(SOCKET_SERVER_URL, {
        auth: { token },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
      });

      socket.on('connect', () => {
        console.log('⚡ Connected to Servora Real-time Socket Server');
      });

      socket.on('disconnect', (reason) => {
        console.log('⚡ Disconnected from Socket Server:', reason);
      });

      socket.on('connect_error', (err) => {
        // Suppress unhandled noisy errors in standalone frontend mode
        console.warn('⚡ Socket connection notice:', err.message);
      });
    } catch (err) {
      console.warn('⚡ Socket initialization skipped:', err);
      return dummySocket;
    }
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
