import { Request } from 'express';

export type UserRole = 'SUPERADMIN' | 'RESTAURANT_ADMIN' | 'KITCHEN_STAFF' | 'WAITER';

export interface JwtUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  restaurantId?: string | null;
  name: string;
}

export interface CustomerSessionPayload {
  email: string;
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  type: 'CUSTOMER_SESSION';
}

export interface AuthenticatedRequest extends Request {
  user?: JwtUserPayload;
  restaurantId?: string; // resolved tenant id
}

export interface CustomerAuthenticatedRequest extends Request {
  customerSession?: CustomerSessionPayload;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: Record<string, any>;
}

export interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  selectedCustomizations?: {
    groupId: string;
    optionIds: string[];
  }[];
  notes?: string;
}

export interface CreateOrderInput {
  restaurantSlug: string;
  tableNumber: string;
  tableToken?: string;
  customerName: string;
  customerEmail: string;
  sessionToken?: string;
  items: OrderItemInput[];
  paymentMethod: 'COUNTER' | 'ONLINE';
  notes?: string;
}
