import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from 'src/api/api-client';
import { BRAND_CONFIG } from 'src/config/brand.config';
import { onOrderCreated, onOrderStatusUpdated, joinRestaurantRoom } from 'src/api/socket-client';
import {
  Role,
  OrderStatus,
  Restaurant,
  MenuCategory,
  MenuItem,
  TableItem,
  Order,
  StaffMember,
  CartItem,
  OrderItem,
} from './types';
import { toast } from 'sonner';

interface RestaurantContextType {
  restaurants: Restaurant[];
  currentRestaurant: Restaurant;
  categories: MenuCategory[];
  menuItems: MenuItem[];
  tables: TableItem[];
  orders: Order[];
  staff: StaffMember[];
  cart: CartItem[];
  activeRole: Role;
  setActiveRole: (role: Role) => void;
  setCurrentRestaurantSlug: (slug: string) => void;

  // Cart
  addToCart: (item: OrderItem) => void;
  updateCartQuantity: (cartItemId: string, delta: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartSubtotal: number;
  cartTax: number;
  cartItemCount: number;

  // Orders
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<boolean>;
  createCustomerOrder: (orderPayload: {
    restaurantSlug: string;
    tableNumber: string;
    customerName: string;
    customerEmail: string;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: 'COUNTER' | 'ONLINE';
    notes?: string;
  }) => Promise<any>;

  // Admin Menu & Categories
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<MenuItem>;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  toggleItemAvailability: (id: string) => Promise<void>;
  addCategory: (category: Omit<MenuCategory, 'id'>) => Promise<MenuCategory>;
  updateCategory: (id: string, updates: Partial<MenuCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Admin Tables & Staff
  addTable: (table: Omit<TableItem, 'id'>) => Promise<TableItem>;
  updateTable: (id: string, updates: Partial<TableItem>) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  addStaff: (member: Omit<StaffMember, 'id' | 'joinedDate'>) => Promise<StaffMember>;
  updateStaff: (id: string, updates: Partial<StaffMember>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;

  // Settings
  updateRestaurantSettings: (updates: Partial<Restaurant>) => Promise<void>;

  // Superadmin
  updateRestaurantStatus: (id: string, status: 'ACTIVE' | 'SUSPENDED') => Promise<void>;
  addRestaurant: (
    restaurant: Omit<Restaurant, 'id' | 'createdAt' | 'totalOrders' | 'totalRevenue'>
  ) => Promise<Restaurant>;

  // Backend Sync Status
  isBackendConnected: boolean;
  refreshData: () => Promise<void>;

  // Reset
  resetToInitialData: () => void;
}

const STORAGE_KEY = BRAND_CONFIG.cartKey;

const DEFAULT_FALLBACK_RESTAURANT: Restaurant = {
  id: 'rustic-hearth-tenant',
  name: 'The Rustic Hearth',
  slug: 'rustic-hearth',
  cuisine: 'Artisan Wood-Fired & Italian Bistro',
  logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=80',
  bannerUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
  address: '452 Mulberry Avenue, Downtown, NY 10012',
  phone: '+1 (555) 234-5678',
  email: 'contact@rustichearth.com',
  currency: '$',
  taxRate: 8.5,
  status: 'ACTIVE',
  totalOrders: 0,
  totalRevenue: 0,
  createdAt: new Date().toISOString(),
};

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentRestaurantSlug, setCurrentRestaurantSlug] = useState<string>('rustic-hearth');
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_cart`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeRole, setActiveRole] = useState<Role>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_role`);
      return (saved as Role) || 'CUSTOMER';
    } catch {
      return 'CUSTOMER';
    }
  });

  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);

  const currentRestaurant =
    restaurants.find((r) => r.slug === currentRestaurantSlug) ||
    restaurants[0] ||
    DEFAULT_FALLBACK_RESTAURANT;

  // Persist cart and active role locally
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_cart`, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_role`, activeRole);
  }, [activeRole]);

  // Synchronize restaurant catalog, tables, staff, and orders from real backend API
  const refreshData = useCallback(async () => {
    try {
      // 1. Fetch public restaurant profile & menu
      const res = await api.public.getRestaurant(currentRestaurantSlug).catch((err) => {
        console.warn('Backend restaurant fetch notice:', err.message);
        return null;
      });

      if (res) {
        setIsBackendConnected(true);
        const mappedRest: Restaurant = {
          id: res.id,
          name: res.name,
          slug: res.slug,
          cuisine: res.cuisine || 'Restaurant & Cafe',
          logoUrl: res.logoUrl || DEFAULT_FALLBACK_RESTAURANT.logoUrl,
          bannerUrl: res.bannerUrl || DEFAULT_FALLBACK_RESTAURANT.bannerUrl,
          address: res.address || '',
          phone: res.phone || '',
          email: res.email || '',
          currency: res.currency || '$',
          taxRate: typeof res.taxRate === 'number' ? res.taxRate : 8.5,
          status: 'ACTIVE',
          totalOrders: res.totalOrders || 0,
          totalRevenue: res.totalRevenue || 0,
          createdAt: res.createdAt || new Date().toISOString(),
        };

        setRestaurants((prev) => {
          const idx = prev.findIndex((r) => r.slug === currentRestaurantSlug);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = mappedRest;
            return next;
          }
          return [mappedRest, ...prev];
        });

        if (Array.isArray(res.categories)) {
          setCategories(
            res.categories.map((c: any) => ({
              id: c.id,
              restaurantSlug: currentRestaurantSlug,
              name: c.name,
              description: c.description || '',
              sortOrder: c.sortOrder || 0,
              icon: c.icon,
            }))
          );
        }

        if (Array.isArray(res.menuItems)) {
          setMenuItems(
            res.menuItems.map((m: any) => ({
              id: m.id,
              restaurantSlug: currentRestaurantSlug,
              categoryId: m.categoryId,
              name: m.name,
              description: m.description,
              price: m.price,
              imageUrl: m.imageUrl || '',
              isAvailable: m.isAvailable !== false,
              isVeg: Boolean(m.isVeg),
              prepTimeMinutes: m.prepTimeMinutes || 15,
              customizationGroups: m.customizationGroups || [],
            }))
          );
        }
      } else {
        setIsBackendConnected(false);
      }

      // 2. If authenticated token exists, fetch authorized tenant data
      const token = localStorage.getItem(BRAND_CONFIG.authTokenKey);
      if (token) {
        const meRes = await api.auth.getMe().catch(() => null);
        const user = meRes?.data || meRes;
        if (user && user.role) {
          setActiveRole(user.role);
          if (user.restaurant?.slug) {
            setCurrentRestaurantSlug(user.restaurant.slug);
          }
        }

        // Tables
        const tableRes = await api.admin.getTables().catch(() => null);
        const tableData = tableRes?.data || tableRes;
        if (Array.isArray(tableData)) {
          setTables(
            tableData.map((t: any) => ({
              id: t.id,
              restaurantSlug: currentRestaurantSlug,
              tableNumber: t.tableNumber,
              capacity: t.capacity || 4,
              status: t.status || 'AVAILABLE',
              qrToken: t.qrToken,
            }))
          );
        }

        // Staff
        const staffRes = await api.admin.getStaff().catch(() => null);
        const staffData = staffRes?.data || staffRes;
        if (Array.isArray(staffData)) {
          setStaff(
            staffData.map((s: any) => ({
              id: s.id,
              restaurantSlug: currentRestaurantSlug,
              name: s.name,
              email: s.email,
              role: s.role,
              status: s.status || 'ACTIVE',
              avatarUrl: s.avatarUrl,
              joinedDate: s.joinedDate ? new Date(s.joinedDate).toISOString().split('T')[0] : '',
            }))
          );
        }

        // Admin Orders
        const orderRes = await api.admin.getOrders().catch(() => null);
        const orderData = orderRes?.data?.orders || orderRes?.data || orderRes?.orders || orderRes;
        if (Array.isArray(orderData)) {
          setOrders(
            orderData.map((o: any) => ({
              id: o.id,
              orderNumber: o.orderNumber,
              restaurantSlug: currentRestaurantSlug,
              tableNumber: o.table?.tableNumber || o.tableNumberSnapshot || 'Table',
              customerName: o.customerName,
              customerEmail: o.customerEmail,
              items: o.items?.map((item: any) => ({
                id: item.id,
                menuItemId: item.menuItemId,
                name: item.nameSnapshot || item.name,
                quantity: item.quantity,
                price: item.unitPriceSnapshot || item.price,
                itemTotal: item.itemTotal,
                selectedCustomizations: item.customizations || [],
                notes: item.notes,
              })) || [],
              subtotal: o.subtotal,
              tax: o.tax,
              total: o.total,
              paymentMethod: o.paymentMethod || 'COUNTER',
              paymentStatus: o.paymentStatus || 'PENDING',
              status: o.status,
              createdAt: o.createdAt,
              notes: o.notes,
            }))
          );
        }

        // Superadmin Tenants
        if (user?.role === 'SUPERADMIN') {
          const tenantsRes = await api.superadmin.getTenants().catch(() => null);
          const tenantData = tenantsRes?.data || tenantsRes;
          if (Array.isArray(tenantData)) {
            setRestaurants(
              tenantData.map((t: any) => ({
                id: t.id,
                name: t.name,
                slug: t.slug,
                cuisine: t.cuisine,
                logoUrl: t.logoUrl,
                bannerUrl: t.bannerUrl,
                address: t.address,
                phone: t.phone,
                email: t.email,
                currency: t.currency || '$',
                taxRate: t.taxRate || 8.5,
                status: t.status,
                totalOrders: t.totalOrders || 0,
                totalRevenue: t.totalRevenue || 0,
                createdAt: t.createdAt,
              }))
            );
          }
        }
      }
    } catch (err) {
      console.warn('Backend sync completed with notices:', err);
    }
  }, [currentRestaurantSlug]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Real-time WebSocket connection to restaurant room
  useEffect(() => {
    if (currentRestaurant?.id) {
      joinRestaurantRoom(currentRestaurant.id);
    }

    const unsubCreated = onOrderCreated((newOrder) => {
      if (newOrder && newOrder.id) {
        setOrders((prev) => {
          const exists = prev.some((o) => o.id === newOrder.id);
          if (exists) return prev;
          const mappedOrder: Order = {
            id: newOrder.id,
            orderNumber: newOrder.orderNumber,
            restaurantSlug: currentRestaurantSlug,
            tableNumber: newOrder.tableNumberSnapshot || newOrder.table?.tableNumber || 'Table',
            customerName: newOrder.customerName,
            customerEmail: newOrder.customerEmail,
            items: newOrder.items || [],
            subtotal: newOrder.subtotal,
            tax: newOrder.tax,
            total: newOrder.total,
            paymentMethod: newOrder.paymentMethod || 'COUNTER',
            paymentStatus: newOrder.paymentStatus || 'PENDING',
            status: newOrder.status || 'NEW',
            createdAt: newOrder.createdAt || new Date().toISOString(),
            notes: newOrder.notes,
          };
          return [mappedOrder, ...prev];
        });
      }
    });

    const unsubUpdated = onOrderStatusUpdated(({ orderId, status }) => {
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, status: status as OrderStatus } : ord))
      );
    });

    return () => {
      unsubCreated();
      unsubUpdated();
    };
  }, [currentRestaurant?.id, currentRestaurantSlug]);

  // Cart calculations
  const cartSubtotal = cart.reduce((acc, item) => acc + item.itemTotal, 0);
  const cartTax = Number((cartSubtotal * (currentRestaurant.taxRate / 100)).toFixed(2));
  const cartTotal = Number((cartSubtotal + cartTax).toFixed(2));
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const addToCart = (newItem: OrderItem) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (ci) =>
          ci.menuItemId === newItem.menuItemId &&
          JSON.stringify(ci.selectedCustomizations) === JSON.stringify(newItem.selectedCustomizations) &&
          ci.notes === newItem.notes
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        const existing = updated[existingIdx];
        const updatedQty = existing.quantity + newItem.quantity;
        const unitPrice = existing.itemTotal / existing.quantity;
        updated[existingIdx] = {
          ...existing,
          quantity: updatedQty,
          itemTotal: Number((unitPrice * updatedQty).toFixed(2)),
        };
        return updated;
      }
      return [...prev, newItem];
    });
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const unitPrice = item.itemTotal / item.quantity;
            return {
              ...item,
              quantity: newQty,
              itemTotal: Number((unitPrice * newQty).toFixed(2)),
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const clearCart = () => setCart([]);

  // Orders
  const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<boolean> => {
    try {
      await api.kitchen.updateOrderStatus(orderId, status);
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.id === orderId) {
            const updated = { ...ord, status };
            if (status === 'COMPLETED' && ord.paymentMethod === 'COUNTER') {
              updated.paymentStatus = 'PAID';
            }
            return updated;
          }
          return ord;
        })
      );
      toast.success(`Order updated to ${status}`);
      return true;
    } catch (err: any) {
      console.error('Failed to update status on server:', err);
      toast.error(err.message || 'Failed to update order status on server.');
      return false;
    }
  };

  const createCustomerOrder = async (payload: {
    restaurantSlug: string;
    tableNumber: string;
    customerName: string;
    customerEmail: string;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: 'COUNTER' | 'ONLINE';
    notes?: string;
  }): Promise<any> => {
    const res = await api.public.createOrder({
      restaurantSlug: payload.restaurantSlug,
      tableNumber: payload.tableNumber,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      paymentMethod: payload.paymentMethod,
      notes: payload.notes,
      items: payload.items.map((i) => ({
        menuItemId: i.menuItemId,
        quantity: i.quantity,
        notes: i.notes,
      })),
    });

    const order = res?.data?.order || res?.order || res;
    if (order) {
      setOrders((prev) => [order, ...prev]);
    }
    return res;
  };

  // Menu items
  const addMenuItem = async (item: Omit<MenuItem, 'id'>): Promise<MenuItem> => {
    const res = await api.admin.createMenuItem({
      name: item.name,
      description: item.description,
      price: item.price,
      categoryId: item.categoryId,
      imageUrl: item.imageUrl,
      isAvailable: item.isAvailable,
      isVeg: item.isVeg,
      prepTimeMinutes: item.prepTimeMinutes,
      customizationGroups: item.customizationGroups,
    });
    const created = res?.data || res;
    const newItem: MenuItem = {
      ...item,
      id: created.id,
      restaurantSlug: currentRestaurantSlug,
    };
    setMenuItems((prev) => [newItem, ...prev]);
    toast.success(`Item "${item.name}" added successfully`);
    return newItem;
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    await api.admin.updateMenuItem(id, updates);
    setMenuItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    toast.success('Menu item updated');
  };

  const deleteMenuItem = async (id: string) => {
    await api.admin.deleteMenuItem(id);
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
    toast.success('Menu item deleted');
  };

  const toggleItemAvailability = async (id: string) => {
    await api.admin.toggleItemAvailability(id);
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isAvailable: !item.isAvailable } : item))
    );
  };

  // Categories
  const addCategory = async (category: Omit<MenuCategory, 'id'>): Promise<MenuCategory> => {
    const res = await api.admin.createCategory({
      name: category.name,
      description: category.description,
      sortOrder: category.sortOrder,
    });
    const created = res?.data || res;
    const newCat: MenuCategory = {
      ...category,
      id: created.id,
      restaurantSlug: currentRestaurantSlug,
    };
    setCategories((prev) => [...prev, newCat]);
    toast.success(`Category "${category.name}" created`);
    return newCat;
  };

  const updateCategory = async (id: string, updates: Partial<MenuCategory>) => {
    await api.admin.updateCategory(id, updates);
    setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat)));
    toast.success('Category updated');
  };

  const deleteCategory = async (id: string) => {
    await api.admin.deleteCategory(id);
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
    toast.success('Category deleted');
  };

  // Tables
  const addTable = async (table: Omit<TableItem, 'id'>): Promise<TableItem> => {
    const res = await api.admin.createTable({
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      status: table.status,
    });
    const created = res?.data || res;
    const newTable: TableItem = {
      ...table,
      id: created.id,
      qrToken: created.qrToken,
    };
    setTables((prev) => [...prev, newTable]);
    toast.success(`Table "${table.tableNumber}" created`);
    return newTable;
  };

  const updateTable = async (id: string, updates: Partial<TableItem>) => {
    await api.admin.updateTable(id, updates);
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    toast.success('Table updated');
  };

  const deleteTable = async (id: string) => {
    await api.admin.deleteTable(id);
    setTables((prev) => prev.filter((t) => t.id !== id));
    toast.success('Table removed');
  };

  // Staff
  const addStaff = async (member: Omit<StaffMember, 'id' | 'joinedDate'>): Promise<StaffMember> => {
    const res = await api.admin.createStaff({
      email: member.email,
      name: member.name,
      role: member.role,
    });
    const created = res?.data || res;
    const newStaff: StaffMember = {
      ...member,
      id: created.id,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    setStaff((prev) => [...prev, newStaff]);
    toast.success(`Staff member "${member.name}" registered`);
    return newStaff;
  };

  const updateStaff = async (id: string, updates: Partial<StaffMember>) => {
    await api.admin.updateStaff(id, updates);
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    toast.success('Staff member updated');
  };

  const deleteStaff = async (id: string) => {
    await api.admin.deleteStaff(id);
    setStaff((prev) => prev.filter((s) => s.id !== id));
    toast.success('Staff member removed');
  };

  // Settings
  const updateRestaurantSettings = async (updates: Partial<Restaurant>) => {
    await api.admin.updateSettings(updates);
    setRestaurants((prev) =>
      prev.map((r) => (r.slug === currentRestaurantSlug ? { ...r, ...updates } : r))
    );
    toast.success('Restaurant settings saved');
  };

  // Superadmin
  const updateRestaurantStatus = async (id: string, status: 'ACTIVE' | 'SUSPENDED') => {
    await api.superadmin.updateTenantStatus(id, status);
    setRestaurants((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(`Tenant status set to ${status}`);
  };

  const addRestaurant = async (
    restaurant: Omit<Restaurant, 'id' | 'createdAt' | 'totalOrders' | 'totalRevenue'>
  ): Promise<Restaurant> => {
    const res = await api.superadmin.createTenant({
      name: restaurant.name,
      slug: restaurant.slug,
      cuisine: restaurant.cuisine,
      address: restaurant.address,
      phone: restaurant.phone,
      email: restaurant.email,
      currency: restaurant.currency,
      taxRate: restaurant.taxRate,
    });
    const created = res?.data || res;
    const newRest: Restaurant = {
      ...restaurant,
      id: created.id,
      createdAt: new Date().toISOString(),
      totalOrders: 0,
      totalRevenue: 0,
    };
    setRestaurants((prev) => [newRest, ...prev]);
    toast.success(`Restaurant "${restaurant.name}" provisioned`);
    return newRest;
  };

  const resetToInitialData = () => {
    clearCart();
    refreshData();
  };

  return (
    <RestaurantContext.Provider
      value={{
        restaurants,
        currentRestaurant,
        categories,
        menuItems,
        tables,
        orders,
        staff,
        cart,
        activeRole,
        setActiveRole,
        setCurrentRestaurantSlug,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        cartSubtotal,
        cartTax,
        cartItemCount,
        updateOrderStatus,
        createCustomerOrder,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        toggleItemAvailability,
        addCategory,
        updateCategory,
        deleteCategory,
        addTable,
        updateTable,
        deleteTable,
        addStaff,
        updateStaff,
        deleteStaff,
        updateRestaurantSettings,
        updateRestaurantStatus,
        addRestaurant,
        isBackendConnected,
        refreshData,
        resetToInitialData,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
