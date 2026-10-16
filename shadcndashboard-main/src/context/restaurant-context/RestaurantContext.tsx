import React, { createContext, useContext, useState, useEffect } from 'react';
import api from 'src/api/api-client';
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
import {
  INITIAL_RESTAURANTS,
  INITIAL_CATEGORIES,
  INITIAL_MENU_ITEMS,
  INITIAL_TABLES,
  INITIAL_STAFF,
  INITIAL_ORDERS,
} from './initial-data';

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
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<boolean> | void;
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
  }) => Order;

  // Admin Menu & Categories
  addMenuItem: (item: Omit<MenuItem, 'id'>) => MenuItem;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  toggleItemAvailability: (id: string) => void;
  addCategory: (category: Omit<MenuCategory, 'id'>) => MenuCategory;
  updateCategory: (id: string, updates: Partial<MenuCategory>) => void;
  deleteCategory: (id: string) => void;

  // Admin Tables & Staff
  addTable: (table: Omit<TableItem, 'id'>) => TableItem;
  updateTable: (id: string, updates: Partial<TableItem>) => void;
  deleteTable: (id: string) => void;
  addStaff: (member: Omit<StaffMember, 'id' | 'joinedDate'>) => StaffMember;
  updateStaff: (id: string, updates: Partial<StaffMember>) => void;
  deleteStaff: (id: string) => void;

  // Settings
  updateRestaurantSettings: (updates: Partial<Restaurant>) => void;

  // Superadmin
  updateRestaurantStatus: (id: string, status: 'ACTIVE' | 'SUSPENDED') => void;
  addRestaurant: (restaurant: Omit<Restaurant, 'id' | 'createdAt' | 'totalOrders' | 'totalRevenue'>) => Restaurant;

  // Backend Sync Status
  isBackendConnected: boolean;
  refreshData: () => Promise<void>;

  // Reset
  resetToInitialData: () => void;
}

const STORAGE_KEY = 'qr_restaurant_saas_state_v1';

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Try loading from localStorage
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_restaurants`);
      return saved ? JSON.parse(saved) : INITIAL_RESTAURANTS;
    } catch {
      return INITIAL_RESTAURANTS;
    }
  });

  const [currentRestaurantSlug, setCurrentRestaurantSlug] = useState<string>('rustic-hearth');

  const [categories, setCategories] = useState<MenuCategory[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_categories`);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_menuItems`);
      return saved ? JSON.parse(saved) : INITIAL_MENU_ITEMS;
    } catch {
      return INITIAL_MENU_ITEMS;
    }
  });

  const [tables, setTables] = useState<TableItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_tables`);
      return saved ? JSON.parse(saved) : INITIAL_TABLES;
    } catch {
      return INITIAL_TABLES;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_orders`);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_staff`);
      return saved ? JSON.parse(saved) : INITIAL_STAFF;
    } catch {
      return INITIAL_STAFF;
    }
  });

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
      return (saved as Role) || 'RESTAURANT_ADMIN';
    } catch {
      return 'RESTAURANT_ADMIN';
    }
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_restaurants`, JSON.stringify(restaurants));
  }, [restaurants]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_categories`, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_menuItems`, JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_tables`, JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_orders`, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_staff`, JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_cart`, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_role`, activeRole);
  }, [activeRole]);

  const currentRestaurant =
    restaurants.find((r) => r.slug === currentRestaurantSlug) || restaurants[0];

  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  // Synchronize restaurant catalog, tables, staff, and orders from backend
  const refreshData = async () => {
    try {
      const res = await api.public.getRestaurant(currentRestaurantSlug);
      if (res) {
        setIsBackendConnected(true);
        setRestaurants((prev) =>
          prev.map((r) =>
            r.slug === currentRestaurantSlug
              ? {
                  ...r,
                  id: res.id,
                  name: res.name,
                  cuisine: res.cuisine,
                  address: res.address,
                  phone: res.phone,
                  email: res.email,
                  currency: res.currency,
                  taxRate: res.taxRate,
                }
              : r
          )
        );

        if (Array.isArray(res.categories) && res.categories.length > 0) {
          setCategories(
            res.categories.map((c: any) => ({
              id: c.id,
              restaurantSlug: currentRestaurantSlug,
              name: c.name,
              description: c.description,
              sortOrder: c.sortOrder,
              icon: c.icon,
            }))
          );
        }

        if (Array.isArray(res.menuItems) && res.menuItems.length > 0) {
          setMenuItems(
            res.menuItems.map((m: any) => ({
              id: m.id,
              restaurantSlug: currentRestaurantSlug,
              categoryId: m.categoryId,
              name: m.name,
              description: m.description,
              price: m.price,
              imageUrl: m.imageUrl,
              isAvailable: m.isAvailable,
              isVeg: m.isVeg,
              prepTimeMinutes: m.prepTimeMinutes,
              customizationGroups: m.customizationGroups?.map((g: any) => ({
                id: g.id,
                name: g.name,
                type: g.type,
                required: g.required,
                options: g.options?.map((o: any) => ({
                  id: o.id,
                  name: o.name,
                  price: o.price,
                  isAvailable: o.isAvailable,
                })) || [],
              })) || [],
            }))
          );
        }
      }

      // Background sync for admin tables
      api.admin
        .getTables()
        .then((tableRes) => {
          if (Array.isArray(tableRes) && tableRes.length > 0) {
            setTables(
              tableRes.map((t: any) => ({
                id: t.id,
                restaurantSlug: currentRestaurantSlug,
                tableNumber: t.tableNumber,
                capacity: t.capacity,
                status: t.status,
                qrCodeUrl: t.qrCodeUrl,
              }))
            );
          }
        })
        .catch(() => {});

      // Background sync for staff
      api.admin
        .getStaff()
        .then((staffRes) => {
          if (Array.isArray(staffRes) && staffRes.length > 0) {
            setStaff(
              staffRes.map((s: any) => ({
                id: s.id,
                restaurantSlug: currentRestaurantSlug,
                name: s.name,
                email: s.email,
                role: s.role,
                status: s.status,
                avatarUrl: s.avatarUrl,
                joinedDate: s.joinedDate ? new Date(s.joinedDate).toISOString().split('T')[0] : '2026-01-01',
              }))
            );
          }
        })
        .catch(() => {});

      // Background sync for kitchen active orders
      api.kitchen
        .getActiveOrders()
        .then((kitchenOrders) => {
          if (Array.isArray(kitchenOrders) && kitchenOrders.length > 0) {
            setOrders((prev) => {
              const updated = [...prev];
              for (const ko of kitchenOrders) {
                const idx = updated.findIndex((o) => o.id === ko.id || o.orderNumber === ko.orderNumber);
                const mapped: Order = {
                  id: ko.id,
                  orderNumber: ko.orderNumber,
                  restaurantSlug: currentRestaurantSlug,
                  tableNumber: ko.table?.tableNumber || ko.tableNumberSnapshot || 'Table',
                  customerName: ko.customerName,
                  customerEmail: ko.customerEmail,
                  items: ko.items?.map((item: any) => ({
                    id: item.id,
                    menuItemId: item.menuItemId,
                    name: item.nameSnapshot || item.name,
                    quantity: item.quantity,
                    price: item.priceSnapshot || item.price,
                    itemTotal: item.itemTotal,
                    selectedCustomizations: item.customizations?.map((c: any) => ({
                      groupId: c.id,
                      groupName: c.groupNameSnapshot || 'Customization',
                      selectedOptionNames: [c.optionNameSnapshot || c.name || ''],
                    })) || [],
                    notes: item.notes,
                  })) || [],
                  subtotal: ko.subtotal,
                  tax: ko.tax,
                  total: ko.total,
                  paymentMethod: ko.paymentMethod || 'COUNTER',
                  paymentStatus: ko.paymentStatus || 'PENDING',
                  status: ko.status,
                  createdAt: ko.createdAt,
                  notes: ko.notes,
                };
                if (idx >= 0) {
                  updated[idx] = mapped;
                } else {
                  updated.unshift(mapped);
                }
              }
              return updated;
            });
          }
        })
        .catch(() => {});
    } catch {
      setIsBackendConnected(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentRestaurantSlug]);

  // Socket.IO real-time event listener for live order sync
  useEffect(() => {
    try {
      if (currentRestaurant?.id) {
        joinRestaurantRoom(currentRestaurant.id);
      }
    } catch {
      // Ignored if socket unavailable
    }

    const unsubCreated = onOrderCreated((newOrder) => {
      if (!newOrder) return;
      const orderSlug = newOrder.restaurantSlug || newOrder.restaurant?.slug;
      if (orderSlug === currentRestaurantSlug || !orderSlug) {
        setOrders((prev) => {
          if (prev.some((o) => o.id === newOrder.id || o.orderNumber === newOrder.orderNumber)) {
            return prev;
          }
          const mappedOrder: Order = {
            id: newOrder.id,
            orderNumber: newOrder.orderNumber,
            restaurantSlug: orderSlug || currentRestaurantSlug,
            tableNumber: newOrder.tableNumberSnapshot || newOrder.table?.tableNumber || 'Counter',
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
      // Check if item with exact same customizations exists
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
    // Optimistic local update
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

    // Sync with backend API
    try {
      await api.kitchen.updateOrderStatus(orderId, status);
      return true;
    } catch {
      // Backend may be offline or in mock mode
      return false;
    }
  };

  const createCustomerOrder = (payload: {
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
  }): Order => {
    const nextNum = 1040 + orders.length + 1;
    const newOrder: Order = {
      id: `ord-${nextNum}`,
      orderNumber: `#${nextNum}`,
      restaurantSlug: payload.restaurantSlug,
      tableNumber: payload.tableNumber,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      items: payload.items,
      subtotal: payload.subtotal,
      tax: payload.tax,
      total: payload.total,
      paymentMethod: payload.paymentMethod,
      paymentStatus: payload.paymentMethod === 'ONLINE' ? 'PAID' : 'PENDING',
      status: 'NEW',
      createdAt: new Date().toISOString(),
      notes: payload.notes,
    };

    setOrders((prev) => [newOrder, ...prev]);
    // Also update restaurant totals
    setRestaurants((prev) =>
      prev.map((r) =>
        r.slug === payload.restaurantSlug
          ? {
              ...r,
              totalOrders: r.totalOrders + 1,
              totalRevenue: Number((r.totalRevenue + payload.total).toFixed(2)),
            }
          : r
      )
    );

    clearCart();

    // Fire backend order creation with server-side price validation
    api.public
      .createOrder({
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
      })
      .then((res) => {
        if (res?.order?.id) {
          // If server returned a database order ID and number, reconcile local order
          setOrders((prev) =>
            prev.map((o) =>
              o.id === newOrder.id
                ? {
                    ...o,
                    id: res.order.id,
                    orderNumber: res.order.orderNumber,
                  }
                : o
            )
          );
        }
      })
      .catch(() => {
        // Fallback to local optimistic order
      });

    return newOrder;
  };

  // Menu items
  const addMenuItem = (item: Omit<MenuItem, 'id'>): MenuItem => {
    const tempId = `item-${Date.now()}`;
    const newItem: MenuItem = {
      ...item,
      id: tempId,
    };
    setMenuItems((prev) => [newItem, ...prev]);

    api.admin
      .createMenuItem({
        name: item.name,
        description: item.description,
        price: item.price,
        categoryId: item.categoryId,
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
        isVeg: item.isVeg,
        prepTimeMinutes: item.prepTimeMinutes,
        customizationGroups: item.customizationGroups,
      })
      .then((res) => {
        if (res?.data?.id || res?.id) {
          const realId = res?.data?.id || res?.id;
          setMenuItems((prev) => prev.map((m) => (m.id === tempId ? { ...m, id: realId } : m)));
        }
      })
      .catch(() => {});

    return newItem;
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    api.admin.updateMenuItem(id, updates).catch(() => {});
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
    api.admin.deleteMenuItem(id).catch(() => {});
  };

  const toggleItemAvailability = (id: string) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isAvailable: !item.isAvailable } : item))
    );
    api.admin.toggleItemAvailability(id).catch(() => {});
  };

  // Categories
  const addCategory = (category: Omit<MenuCategory, 'id'>): MenuCategory => {
    const tempId = `cat-${Date.now()}`;
    const newCat: MenuCategory = {
      ...category,
      id: tempId,
    };
    setCategories((prev) => [...prev, newCat]);

    api.admin
      .createCategory({
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
      })
      .then((res) => {
        if (res?.data?.id || res?.id) {
          const realId = res?.data?.id || res?.id;
          setCategories((prev) => prev.map((c) => (c.id === tempId ? { ...c, id: realId } : c)));
        }
      })
      .catch(() => {});

    return newCat;
  };

  const updateCategory = (id: string, updates: Partial<MenuCategory>) => {
    setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat)));
    api.admin.updateCategory(id, updates).catch(() => {});
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
    api.admin.deleteCategory(id).catch(() => {});
  };

  // Tables
  const addTable = (table: Omit<TableItem, 'id'>): TableItem => {
    const tempId = `tbl-${Date.now()}`;
    const newTable: TableItem = {
      ...table,
      id: tempId,
    };
    setTables((prev) => [...prev, newTable]);

    api.admin
      .createTable({
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        status: table.status,
      })
      .then((res) => {
        if (res?.data?.id || res?.id) {
          const realId = res?.data?.id || res?.id;
          setTables((prev) => prev.map((t) => (t.id === tempId ? { ...t, id: realId } : t)));
        }
      })
      .catch(() => {});

    return newTable;
  };

  const updateTable = (id: string, updates: Partial<TableItem>) => {
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    api.admin.updateTable(id, updates).catch(() => {});
  };

  const deleteTable = (id: string) => {
    setTables((prev) => prev.filter((t) => t.id !== id));
    api.admin.deleteTable(id).catch(() => {});
  };

  // Staff
  const addStaff = (member: Omit<StaffMember, 'id' | 'joinedDate'>): StaffMember => {
    const tempId = `staff-${Date.now()}`;
    const newStaff: StaffMember = {
      ...member,
      id: tempId,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    setStaff((prev) => [...prev, newStaff]);

    api.admin
      .createStaff({
        email: member.email,
        name: member.name,
        role: member.role,
      })
      .then((res) => {
        if (res?.data?.id || res?.id) {
          const realId = res?.data?.id || res?.id;
          setStaff((prev) => prev.map((s) => (s.id === tempId ? { ...s, id: realId } : s)));
        }
      })
      .catch(() => {});

    return newStaff;
  };

  const updateStaff = (id: string, updates: Partial<StaffMember>) => {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    api.admin.updateStaff(id, updates).catch(() => {});
  };

  const deleteStaff = (id: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== id));
    api.admin.deleteStaff(id).catch(() => {});
  };

  // Settings
  const updateRestaurantSettings = (updates: Partial<Restaurant>) => {
    setRestaurants((prev) =>
      prev.map((r) => (r.slug === currentRestaurantSlug ? { ...r, ...updates } : r))
    );
    api.admin.updateSettings(updates).catch(() => {});
  };

  // Superadmin
  const updateRestaurantStatus = (id: string, status: 'ACTIVE' | 'SUSPENDED') => {
    setRestaurants((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    api.superadmin.updateTenantStatus(id, status).catch(() => {});
  };

  const addRestaurant = (
    restaurant: Omit<Restaurant, 'id' | 'createdAt' | 'totalOrders' | 'totalRevenue'>
  ): Restaurant => {
    const tempId = `rest-${Date.now()}`;
    const newRest: Restaurant = {
      ...restaurant,
      id: tempId,
      createdAt: new Date().toISOString(),
      totalOrders: 0,
      totalRevenue: 0,
    };
    setRestaurants((prev) => [newRest, ...prev]);

    api.superadmin
      .createTenant({
        name: restaurant.name,
        slug: restaurant.slug,
        cuisine: restaurant.cuisine,
        address: restaurant.address,
        phone: restaurant.phone,
        email: restaurant.email,
        currency: restaurant.currency,
        taxRate: restaurant.taxRate,
      })
      .then((res) => {
        if (res?.data?.id || res?.id) {
          const realId = res?.data?.id || res?.id;
          setRestaurants((prev) => prev.map((r) => (r.id === tempId ? { ...r, id: realId } : r)));
        }
      })
      .catch(() => {});

    return newRest;
  };

  const resetToInitialData = () => {
    setRestaurants(INITIAL_RESTAURANTS);
    setCategories(INITIAL_CATEGORIES);
    setMenuItems(INITIAL_MENU_ITEMS);
    setTables(INITIAL_TABLES);
    setOrders(INITIAL_ORDERS);
    setStaff(INITIAL_STAFF);
    setCart([]);
    localStorage.removeItem(`${STORAGE_KEY}_restaurants`);
    localStorage.removeItem(`${STORAGE_KEY}_categories`);
    localStorage.removeItem(`${STORAGE_KEY}_menuItems`);
    localStorage.removeItem(`${STORAGE_KEY}_tables`);
    localStorage.removeItem(`${STORAGE_KEY}_orders`);
    localStorage.removeItem(`${STORAGE_KEY}_staff`);
    localStorage.removeItem(`${STORAGE_KEY}_cart`);
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
