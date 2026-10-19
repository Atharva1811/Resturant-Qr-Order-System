export type Role = 'SUPERADMIN' | 'RESTAURANT_ADMIN' | 'KITCHEN_STAFF' | 'CUSTOMER';

export type OrderStatus = 'NEW' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export type PaymentMethod = 'COUNTER' | 'ONLINE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

export interface CustomizationOption {
  id: string;
  name: string;
  price: number;
}

export interface CustomizationGroup {
  id: string;
  name: string;
  type: 'SINGLE' | 'MULTIPLE';
  required: boolean;
  options: CustomizationOption[];
}

export interface MenuItem {
  id: string;
  restaurantSlug: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  isVeg: boolean;
  prepTimeMinutes: number;
  customizationGroups?: CustomizationGroup[];
}

export interface MenuCategory {
  id: string;
  restaurantSlug: string;
  name: string;
  description?: string;
  sortOrder: number;
  icon?: string;
}

export interface TableItem {
  id: string;
  restaurantSlug: string;
  tableNumber: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  qrCodeUrl?: string;
  qrToken?: string;
}

export interface SelectedCustomization {
  groupId: string;
  groupName: string;
  selectedOptionIds: string[];
  selectedOptionNames: string[];
  additionalPrice: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  selectedCustomizations: SelectedCustomization[];
  itemTotal: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  restaurantSlug: string;
  tableNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string; // ISO string
  notes?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  cuisine: string;
  logoUrl: string;
  bannerUrl: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  taxRate: number; // percentage, e.g. 8.5
  status: 'ACTIVE' | 'SUSPENDED';
  totalOrders: number;
  totalRevenue: number;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  restaurantSlug: string;
  name: string;
  email: string;
  role: 'RESTAURANT_ADMIN' | 'KITCHEN_STAFF' | 'WAITER';
  status: 'ACTIVE' | 'INACTIVE';
  avatarUrl?: string;
  joinedDate: string;
}
export type CartItem = OrderItem;
