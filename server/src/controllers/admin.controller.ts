import { Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { qrService } from '../services/qr.service.js';
import { socketService } from '../services/socket.service.js';

// Schemas
const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
  icon: z.string().optional(),
});

const menuItemSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean().default(true),
  isVeg: z.boolean().default(false),
  prepTimeMinutes: z.number().int().default(15),
  customizationGroups: z
    .array(
      z.object({
        name: z.string().min(1),
        type: z.enum(['SINGLE', 'MULTIPLE']).default('SINGLE'),
        required: z.boolean().default(false),
        options: z.array(
          z.object({
            name: z.string().min(1),
            price: z.number().min(0).default(0),
            isAvailable: z.boolean().default(true),
          })
        ),
      })
    )
    .optional(),
});

const tableSchema = z.object({
  tableNumber: z.string().min(1),
  capacity: z.number().int().positive().default(4),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED']).default('AVAILABLE'),
});

const staffSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['RESTAURANT_ADMIN', 'KITCHEN_STAFF', 'WAITER']),
  password: z.string().min(6).optional(),
});

const settingsSchema = z.object({
  name: z.string().min(1).optional(),
  cuisine: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  currency: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
});

// Categories
export const getCategories = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurantId = req.restaurantId!;
    const categories = await prisma.menuCategory.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { menuItems: true } },
      },
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurantId = req.restaurantId!;
    const data = categorySchema.parse(req.body);

    const category = await prisma.menuCategory.create({
      data: {
        ...data,
        restaurantId,
      },
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const restaurantId = req.restaurantId!;
    const data = categorySchema.partial().parse(req.body);

    const category = await prisma.menuCategory.updateMany({
      where: { id, restaurantId },
      data,
    });

    if (category.count === 0) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    res.json({ success: true, message: 'Category updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const restaurantId = req.restaurantId!;

    // Check if category has items
    const itemCount = await prisma.menuItem.count({
      where: { categoryId: id, restaurantId },
    });

    if (itemCount > 0) {
      res.status(400).json({
        success: false,
        error: `Cannot delete category containing ${itemCount} items. Move or delete the items first.`,
      });
      return;
    }

    await prisma.menuCategory.deleteMany({
      where: { id, restaurantId },
    });

    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};

// Menu Items
export const getMenuItems = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurantId = req.restaurantId!;
    const items = await prisma.menuItem.findMany({
      where: { restaurantId },
      include: {
        category: true,
        customizationGroups: {
          include: {
            options: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

export const createMenuItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurantId = req.restaurantId!;
    const input = menuItemSchema.parse(req.body);

    // Verify category belongs to tenant
    const category = await prisma.menuCategory.findFirst({
      where: { id: input.categoryId, restaurantId },
    });

    if (!category) {
      res.status(400).json({ success: false, error: 'Category not found for this restaurant' });
      return;
    }

    const item = await prisma.menuItem.create({
      data: {
        restaurantId,
        categoryId: input.categoryId,
        name: input.name,
        description: input.description,
        price: input.price,
        imageUrl: input.imageUrl,
        isAvailable: input.isAvailable,
        isVeg: input.isVeg,
        prepTimeMinutes: input.prepTimeMinutes,
        customizationGroups: input.customizationGroups
          ? {
              create: input.customizationGroups.map((group) => ({
                name: group.name,
                type: group.type,
                required: group.required,
                options: {
                  create: group.options.map((opt) => ({
                    name: opt.name,
                    price: opt.price,
                    isAvailable: opt.isAvailable,
                  })),
                },
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        customizationGroups: {
          include: {
            options: true,
          },
        },
      },
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const updateMenuItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const restaurantId = req.restaurantId!;
    const input = menuItemSchema.partial().parse(req.body);

    const existing = await prisma.menuItem.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Menu item not found' });
      return;
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        price: input.price,
        imageUrl: input.imageUrl,
        isAvailable: input.isAvailable,
        isVeg: input.isVeg,
        prepTimeMinutes: input.prepTimeMinutes,
        categoryId: input.categoryId,
      },
      include: {
        category: true,
        customizationGroups: {
          include: { options: true },
        },
      },
    });

    if (input.isAvailable !== undefined && input.isAvailable !== existing.isAvailable) {
      socketService.notifyItemAvailabilityChanged(restaurantId, id, input.isAvailable);
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const toggleItemAvailability = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const restaurantId = req.restaurantId!;

    const item = await prisma.menuItem.findFirst({
      where: { id, restaurantId },
    });

    if (!item) {
      res.status(404).json({ success: false, error: 'Menu item not found' });
      return;
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable: !item.isAvailable },
    });

    socketService.notifyItemAvailabilityChanged(restaurantId, id, updated.isAvailable);

    res.json({
      success: true,
      data: updated,
      message: `Item marked as ${updated.isAvailable ? 'Available' : 'Unavailable (86)'}`,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMenuItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const restaurantId = req.restaurantId!;

    await prisma.menuItem.deleteMany({
      where: { id, restaurantId },
    });

    res.json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    next(error);
  }
};

// Tables
export const getTables = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurantId = req.restaurantId!;
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { slug: true },
    });

    const tables = await prisma.table.findMany({
      where: { restaurantId },
      orderBy: { tableNumber: 'asc' },
    });

    const enriched = tables.map((t) => ({
      ...t,
      qrCodeUrl: qrService.buildCustomerMenuUrl(
        process.env.FRONTEND_URL || 'http://localhost:5173',
        restaurant?.slug || '',
        t.tableNumber,
        t.qrToken
      ),
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

export const createTable = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurantId = req.restaurantId!;
    const input = tableSchema.parse(req.body);
    const qrToken = qrService.generateQrToken();

    const table = await prisma.table.create({
      data: {
        restaurantId,
        tableNumber: input.tableNumber.trim(),
        capacity: input.capacity,
        status: input.status,
        qrToken,
      },
    });

    res.status(201).json({ success: true, data: table });
  } catch (error) {
    next(error);
  }
};

export const updateTable = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const restaurantId = req.restaurantId!;
    const input = tableSchema.partial().parse(req.body);

    const updated = await prisma.table.updateMany({
      where: { id, restaurantId },
      data: input,
    });

    if (updated.count === 0) {
      res.status(404).json({ success: false, error: 'Table not found' });
      return;
    }

    res.json({ success: true, message: 'Table updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const regenerateTableQrToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const restaurantId = req.restaurantId!;
    const newQrToken = qrService.generateQrToken();

    const table = await prisma.table.update({
      where: { id },
      data: { qrToken: newQrToken },
    });

    res.json({
      success: true,
      message: 'New QR code token generated successfully',
      data: table,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTable = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const restaurantId = req.restaurantId!;

    await prisma.table.deleteMany({
      where: { id, restaurantId },
    });

    res.json({ success: true, message: 'Table deleted' });
  } catch (error) {
    next(error);
  }
};

// Staff
export const getStaff = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurantId = req.restaurantId!;
    const staff = await prisma.restaurantStaff.findMany({
      where: { restaurantId },
      include: {
        user: { select: { id: true, email: true, isActive: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

export const createStaff = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurantId = req.restaurantId!;
    const input = staffSchema.parse(req.body);
    const normalizedEmail = input.email.toLowerCase().trim();

    // Check if user account already exists
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      const password = input.password || 'Staff@1234';
      const passwordHash = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          name: input.name,
          role: input.role,
          restaurantId,
        },
      });
    }

    const staff = await prisma.restaurantStaff.create({
      data: {
        restaurantId,
        userId: user.id,
        name: input.name,
        email: normalizedEmail,
        role: input.role,
        status: 'ACTIVE',
      },
    });

    res.status(201).json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

export const updateStaff = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const restaurantId = req.restaurantId!;
    const { role, status } = req.body;

    const staff = await prisma.restaurantStaff.update({
      where: { id },
      data: {
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
      },
    });

    if (staff.userId && role) {
      await prisma.user.update({
        where: { id: staff.userId },
        data: { role },
      });
    }

    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

export const deleteStaff = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const restaurantId = req.restaurantId!;

    const staff = await prisma.restaurantStaff.findFirst({
      where: { id, restaurantId },
    });

    if (staff) {
      if (staff.userId) {
        await prisma.user.delete({ where: { id: staff.userId } }).catch(() => {});
      }
      await prisma.restaurantStaff.delete({ where: { id: staff.id } });
    }

    res.json({ success: true, message: 'Staff member removed' });
  } catch (error) {
    next(error);
  }
};

// Orders
export const getAdminOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurantId = req.restaurantId!;
    const { status, limit = 50, page = 1 } = req.query;

    const where: any = { restaurantId };
    if (status) {
      where.status = status;
    }

    const take = Math.min(Number(limit), 100);
    const skip = (Math.max(Number(page), 1) - 1) * take;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          table: true,
          items: {
            include: { customizations: true },
          },
          payments: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: orders,
      meta: {
        total,
        page: Number(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Analytics
export const getAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurantId = req.restaurantId!;

    const [restaurant, orders, topItemsRaw] = await Promise.all([
      prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { totalRevenue: true, totalOrders: true, currency: true },
      }),
      prisma.order.findMany({
        where: { restaurantId },
        select: { total: true, status: true, paymentStatus: true, createdAt: true },
        take: 500,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.orderItem.groupBy({
        by: ['nameSnapshot'],
        _sum: { quantity: true, itemTotal: true },
        where: { order: { restaurantId } },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
    const totalRevenue = restaurant?.totalRevenue || 0;
    const totalOrders = restaurant?.totalOrders || orders.length;
    const avgOrderValue = totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0;

    const topItems = topItemsRaw.map((item) => ({
      name: item.nameSnapshot,
      orders: item._sum.quantity || 0,
      revenue: item._sum.itemTotal || 0,
    }));

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        averageOrderValue: avgOrderValue,
        completedCount: completedOrders.length,
        topSellingItems: topItems,
        currency: restaurant?.currency || 'USD',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Settings
export const updateSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurantId = req.restaurantId!;
    const input = settingsSchema.parse(req.body);

    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: input,
    });

    res.json({
      success: true,
      message: 'Restaurant settings updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
