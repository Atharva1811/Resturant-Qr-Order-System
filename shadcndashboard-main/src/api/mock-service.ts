/**
 * Isolated Frontend Test-Mode Mock Service
 *
 * Used exclusively when Frontend Test Mode is active (disabled by default in production).
 * Contains ZERO fake production claims: all records are strictly marked as preview data.
 * All mutations are ephemeral/localStorage-backed and clearly labeled as not persisted to PostgreSQL.
 */

export interface TestTable {
  id: string;
  restaurantSlug: string;
  tableNumber: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  qrToken: string;
}

const STORAGE_TEST_TABLES = 'servora_test_tables';
const STORAGE_TEST_ORDERS = 'servora_test_orders';

export const INITIAL_TEST_RESTAURANT = {
  id: 'rest-preview-001',
  name: 'The Rustic Hearth [Preview Mode]',
  slug: 'rustic-hearth',
  cuisine: 'Artisan Wood-Fired & Grill',
  logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80',
  bannerUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  address: '104 Pine Street, Testville',
  phone: '+1 (555) 019-2831',
  email: 'preview@rustichearth.test',
  currency: '$',
  taxRate: 8.5,
  status: 'ACTIVE',
  totalOrders: 18,
  totalRevenue: 840.5,
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const INITIAL_TEST_CATEGORIES = [
  { id: 'cat-1', restaurantSlug: 'rustic-hearth', name: 'Starters', sortOrder: 1, icon: 'Soup' },
  { id: 'cat-2', restaurantSlug: 'rustic-hearth', name: 'Artisan Mains', sortOrder: 2, icon: 'Utensils' },
  { id: 'cat-3', restaurantSlug: 'rustic-hearth', name: 'Wood-Fired Pizza', sortOrder: 3, icon: 'Pizza' },
  { id: 'cat-4', restaurantSlug: 'rustic-hearth', name: 'Desserts & Drinks', sortOrder: 4, icon: 'Coffee' },
];

export const INITIAL_TEST_MENU_ITEMS = [
  {
    id: '11111111-0000-0000-0000-000000000001',
    restaurantSlug: 'rustic-hearth',
    categoryId: 'cat-2',
    name: 'Truffle Brioche Burger',
    description: 'Dry-aged beef patty, black truffle aioli, aged cheddar, caramelized shallots on toasted brioche.',
    price: 16.5,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    isVeg: false,
    prepTimeMinutes: 15,
    customizationGroups: [
      {
        id: 'cg-patty',
        name: 'Patty Doneness',
        type: 'SINGLE',
        required: true,
        options: [
          { id: 'opt-med', name: 'Medium', price: 0, isAvailable: true },
          { id: 'opt-wel', name: 'Medium Well', price: 0, isAvailable: true },
        ],
      },
      {
        id: 'cg-cheese',
        name: 'Add Extra Topping',
        type: 'MULTIPLE',
        required: false,
        options: [
          { id: 'opt-bacon', name: 'Smoked Bacon', price: 2.5, isAvailable: true },
          { id: 'opt-egg', name: 'Fried Farm Egg', price: 1.5, isAvailable: true },
        ],
      },
    ],
  },
  {
    id: '11111111-0000-0000-0000-000000000002',
    restaurantSlug: 'rustic-hearth',
    categoryId: 'cat-3',
    name: 'Margherita Burrata Pizza',
    description: 'San Marzano tomato base, artisanal burrata, fresh basil, cold-pressed olive oil.',
    price: 14.0,
    imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    isVeg: true,
    prepTimeMinutes: 12,
  },
  {
    id: '11111111-0000-0000-0000-000000000003',
    restaurantSlug: 'rustic-hearth',
    categoryId: 'cat-1',
    name: 'Rosemary Garlic Fries',
    description: 'Hand-cut russet potatoes tossed with fresh rosemary, roasted garlic oil, and sea salt flakes.',
    price: 6.5,
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    isVeg: true,
    prepTimeMinutes: 8,
  },
  {
    id: '11111111-0000-0000-0000-000000000004',
    restaurantSlug: 'rustic-hearth',
    categoryId: 'cat-4',
    name: 'Espresso Tonic',
    description: 'Double shot of single-origin espresso poured over premium tonic water and fresh orange peel.',
    price: 5.5,
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    isVeg: true,
    prepTimeMinutes: 4,
  },
];

export const INITIAL_TEST_TABLES: TestTable[] = [
  {
    id: 'tbl-preview-01',
    restaurantSlug: 'rustic-hearth',
    tableNumber: 'Table 1',
    capacity: 4,
    status: 'AVAILABLE',
    qrToken: 'test_token_t01_abcdef1234567890',
  },
  {
    id: 'tbl-preview-02',
    restaurantSlug: 'rustic-hearth',
    tableNumber: 'Table 2',
    capacity: 2,
    status: 'OCCUPIED',
    qrToken: 'test_token_t02_1234567890abcdef',
  },
  {
    id: 'tbl-preview-03',
    restaurantSlug: 'rustic-hearth',
    tableNumber: 'Table 3',
    capacity: 6,
    status: 'AVAILABLE',
    qrToken: 'test_token_t03_fedcba0987654321',
  },
];

export class MockApiService {
  private getStoredTables(): TestTable[] {
    try {
      const stored = localStorage.getItem(STORAGE_TEST_TABLES);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return INITIAL_TEST_TABLES;
  }

  private saveStoredTables(tables: TestTable[]): void {
    try {
      localStorage.setItem(STORAGE_TEST_TABLES, JSON.stringify(tables));
    } catch {
      // ignore
    }
  }

  public getRestaurantProfile(slug: string) {
    return {
      ...INITIAL_TEST_RESTAURANT,
      categories: INITIAL_TEST_CATEGORIES,
      menuItems: INITIAL_TEST_MENU_ITEMS,
    };
  }

  public getTables(): TestTable[] {
    return this.getStoredTables();
  }

  public createTable(input: { tableNumber: string; capacity?: number; status?: string }): TestTable {
    const tables = this.getStoredTables();
    const hex = Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2);
    const newTable: TestTable = {
      id: `tbl-preview-${Date.now()}`,
      restaurantSlug: 'rustic-hearth',
      tableNumber: input.tableNumber.trim(),
      capacity: input.capacity || 4,
      status: (input.status as any) || 'AVAILABLE',
      qrToken: `test_token_${hex.padEnd(20, '0')}`,
    };
    const next = [...tables, newTable];
    this.saveStoredTables(next);
    return newTable;
  }

  public regenerateTableQr(tableId: string): TestTable {
    const tables = this.getStoredTables();
    const hex = Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2);
    const newToken = `test_token_rot_${hex.padEnd(16, '0')}`;
    const next = tables.map((t) => (t.id === tableId ? { ...t, qrToken: newToken } : t));
    this.saveStoredTables(next);
    const updated = next.find((t) => t.id === tableId);
    if (!updated) throw new Error('Table not found in test mode state');
    return updated;
  }

  public deleteTable(tableId: string): boolean {
    const tables = this.getStoredTables();
    const next = tables.filter((t) => t.id !== tableId);
    this.saveStoredTables(next);
    return true;
  }

  public verifyTable(slug: string, tableNumber: string, qrToken?: string) {
    const tables = this.getStoredTables();
    const cleanTable = tableNumber.trim().toLowerCase().replace(/-/g, ' ');
    const found = tables.find(
      (t) => t.tableNumber.trim().toLowerCase().replace(/-/g, ' ') === cleanTable
    );

    if (!found) {
      return {
        isValid: false,
        error: `Test Mode: Table "${tableNumber}" was not found in preview data.`,
      };
    }

    if (qrToken && found.qrToken !== qrToken.trim()) {
      return {
        isValid: false,
        error: `Test Mode: QR token mismatch or expired.`,
      };
    }

    return {
      isValid: true,
      table: found,
      restaurant: INITIAL_TEST_RESTAURANT,
    };
  }

  public createOrder(payload: any) {
    let subtotal = 0;
    const items = (payload.items || []).map((itemInput: any) => {
      const dbItem = INITIAL_TEST_MENU_ITEMS.find((m) => m.id === itemInput.menuItemId) || {
        name: 'Custom Dish',
        price: 12.0,
      };
      const itemTotal = Number((dbItem.price * itemInput.quantity).toFixed(2));
      subtotal += itemTotal;
      return {
        ...itemInput,
        name: dbItem.name,
        price: dbItem.price,
        itemTotal,
      };
    });

    const tax = Number(((subtotal * INITIAL_TEST_RESTAURANT.taxRate) / 100).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));
    const orderNumber = `TEST-ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const order = {
      id: `ord-test-${Date.now()}`,
      orderNumber,
      restaurantSlug: payload.restaurantSlug || 'rustic-hearth',
      tableNumber: payload.tableNumber || 'Table 1',
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      items,
      subtotal,
      tax,
      total,
      status: 'NEW',
      paymentMethod: payload.paymentMethod || 'COUNTER',
      paymentStatus: payload.paymentMethod === 'ONLINE' ? 'PAID' : 'PENDING',
      createdAt: new Date().toISOString(),
      isTestMode: true,
      notice: 'TEST PREVIEW ONLY — NOT STORED IN POSTGRESQL',
    };

    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_TEST_ORDERS) || '[]');
      localStorage.setItem(STORAGE_TEST_ORDERS, JSON.stringify([order, ...existing]));
    } catch {
      // ignore
    }

    return { order, isDuplicate: false };
  }
}

export const mockService = new MockApiService();
