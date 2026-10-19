import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { config } from '../config/index.js';
import { AuthenticatedRequest, JwtUserPayload } from '../types/index.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const registerRestaurantSchema = z
  .object({
    restaurantName: z.string().min(2, 'Restaurant name must be at least 2 characters'),
    slug: z
      .string()
      .min(2, 'Slug must be at least 2 characters')
      .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
      .optional(),
    cuisine: z.string().min(2).default('Contemporary Cuisine'),
    address: z.string().min(2).default('Main Street, City'),
    phone: z.string().min(5).default('+1 (555) 000-0000'),
    adminName: z.string().min(2).optional(),
    ownerName: z.string().min(2).optional(),
    adminEmail: z.string().email().optional(),
    email: z.string().email().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    currency: z.string().default('USD'),
    taxRate: z.number().min(0).default(8.5),
  })
  .refine((data) => Boolean(data.adminName || data.ownerName), {
    message: 'Admin/Owner name is required and must be at least 2 characters',
    path: ['adminName'],
  })
  .refine((data) => Boolean(data.adminEmail || data.email), {
    message: 'A valid email is required',
    path: ['adminEmail'],
  });


export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { restaurant: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    if (user.restaurant && user.restaurant.status === 'SUSPENDED' && user.role !== 'SUPERADMIN') {
      res.status(403).json({ success: false, error: 'This restaurant account is currently suspended.' });
      return;
    }

    const payload: JwtUserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as any,
      restaurantId: user.restaurantId,
      name: user.name,
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          restaurantId: user.restaurantId,
          restaurantSlug: user.restaurant?.slug,
          restaurantName: user.restaurant?.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            currency: true,
            taxRate: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        restaurant: user.restaurant,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const registerRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = registerRestaurantSchema.parse(req.body);
    const cleanEmail = (input.adminEmail || input.email)!.toLowerCase().trim();
    const finalAdminName = (input.adminName || input.ownerName)!.trim();
    const cleanSlug = (input.slug || input.restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')).trim();

    if (!cleanSlug) {
      res.status(400).json({ success: false, error: 'A valid restaurant slug could not be determined.' });
      return;
    }

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existingUser) {
      res.status(409).json({ success: false, error: 'An account with this email address already exists.' });
      return;
    }

    // 2. Check if restaurant slug already exists
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { slug: cleanSlug },
    });
    if (existingRestaurant) {
      res.status(409).json({ success: false, error: 'A restaurant with this name or slug already exists.' });
      return;
    }

    // 3. Hash password securely
    const passwordHash = await bcrypt.hash(input.password, 10);

    // 4. Atomic transaction
    const { restaurant, user } = await prisma.$transaction(async (tx) => {
      const newRestaurant = await tx.restaurant.create({
        data: {
          name: input.restaurantName.trim(),
          slug: cleanSlug,
          cuisine: input.cuisine.trim(),
          address: input.address.trim(),
          phone: input.phone.trim(),
          email: cleanEmail,
          currency: input.currency.trim() || 'USD',
          taxRate: input.taxRate,
          status: 'ACTIVE',
        },
      });

      // Role is hardcoded to RESTAURANT_ADMIN (prevents privilege escalation to SUPERADMIN)
      const newUser = await tx.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          name: finalAdminName,
          role: 'RESTAURANT_ADMIN',
          restaurantId: newRestaurant.id,
          isActive: true,
        },
      });

      // Link staff profile
      await tx.restaurantStaff.create({
        data: {
          restaurantId: newRestaurant.id,
          userId: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: 'RESTAURANT_ADMIN',
          status: 'ACTIVE',
        },
      });

      // Create default table T-01 with secure random QR token
      const initialQrToken = crypto.randomBytes(16).toString('hex');
      await tx.table.create({
        data: {
          restaurantId: newRestaurant.id,
          tableNumber: 'T-01',
          capacity: 4,
          status: 'AVAILABLE',
          qrToken: initialQrToken,
        },
      });

      // Create default menu category
      await tx.menuCategory.create({
        data: {
          restaurantId: newRestaurant.id,
          name: 'Main Menu',
          description: 'Chef signature selections',
          sortOrder: 1,
        },
      });

      return { restaurant: newRestaurant, user: newUser };
    });

    // 5. Issue JWT token
    const payload: JwtUserPayload = {
      userId: user.id,
      email: user.email,
      role: 'RESTAURANT_ADMIN',
      restaurantId: restaurant.id,
      name: user.name,
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: (config.jwtExpiresIn as any) || '7d' });

    res.status(201).json({
      success: true,
      message: 'Restaurant registered successfully',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          restaurantId: restaurant.id,
          restaurantSlug: restaurant.slug,
          restaurantName: restaurant.name,
        },
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

