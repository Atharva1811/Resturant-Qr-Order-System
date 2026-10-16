import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';

const restaurantCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  cuisine: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  currency: z.string().default('USD'),
  taxRate: z.number().default(8.5),
  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
});

export const getTenants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            tables: true,
            menuItems: true,
            orders: true,
            staff: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: restaurants,
    });
  } catch (error) {
    next(error);
  }
};

export const createTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = restaurantCreateSchema.parse(req.body);

    const existing = await prisma.restaurant.findUnique({
      where: { slug: input.slug },
    });

    if (existing) {
      res.status(409).json({ success: false, error: 'A restaurant with this slug already exists.' });
      return;
    }

    const restaurant = await prisma.restaurant.create({
      data: input,
    });

    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTenantStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED']) }).parse(req.body);

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: { status },
    });

    res.json({
      success: true,
      message: `Restaurant status updated to ${status}`,
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

export const getPlatformMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [restaurants, ordersCount, totalRevenueAggregate] = await Promise.all([
      prisma.restaurant.findMany({
        select: { id: true, status: true, totalRevenue: true, totalOrders: true },
      }),
      prisma.order.count(),
      prisma.restaurant.aggregate({
        _sum: { totalRevenue: true, totalOrders: true },
      }),
    ]);

    const activeTenants = restaurants.filter((r) => r.status === 'ACTIVE').length;
    const suspendedTenants = restaurants.filter((r) => r.status === 'SUSPENDED').length;
    const platformRevenue = totalRevenueAggregate._sum.totalRevenue || 0;
    const platformOrders = totalRevenueAggregate._sum.totalOrders || ordersCount;

    res.json({
      success: true,
      data: {
        totalTenants: restaurants.length,
        activeTenants,
        suspendedTenants,
        platformRevenue,
        platformOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};
