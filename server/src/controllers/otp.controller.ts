import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { brevoService } from '../services/brevo.service.js';

const requestOtpSchema = z.object({
  email: z.string().email(),
  restaurantSlug: z.string().min(1),
  tableNumber: z.string().optional(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
  restaurantSlug: z.string().min(1),
  tableNumber: z.string().optional(),
});

export const requestOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, restaurantSlug, tableNumber } = requestOtpSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug },
    });

    if (!restaurant) {
      res.status(404).json({ success: false, error: 'Restaurant not found' });
      return;
    }

    let tableId: string | undefined;
    if (tableNumber) {
      const table = await prisma.table.findFirst({
        where: { restaurantId: restaurant.id, tableNumber: String(tableNumber).trim() },
      });
      if (table) {
        tableId = table.id;
      }
    }

    const otp = brevoService.generateOtp();
    const otpHash = brevoService.hashOtp(otp, normalizedEmail);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save verification record
    await prisma.customerVerification.create({
      data: {
        email: normalizedEmail,
        otpHash,
        restaurantId: restaurant.id,
        tableId,
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        expiresAt,
        attempts: 0,
        maxAttempts: 5,
      },
    });

    // Send email via Brevo
    const emailResult = await brevoService.sendOtpEmail(normalizedEmail, otp, restaurant.name);

    res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}`,
      data: {
        expiresAt: expiresAt.toISOString(),
        // Return code in dev/test mock mode for seamless automated testing and frontend demo
        ...(emailResult.isMock ? { mockCode: otp } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, code, restaurantSlug, tableNumber } = verifyOtpSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug },
    });

    if (!restaurant) {
      res.status(404).json({ success: false, error: 'Restaurant not found' });
      return;
    }

    // Find the latest active verification record for this email and restaurant
    const verification = await prisma.customerVerification.findFirst({
      where: {
        email: normalizedEmail,
        restaurantId: restaurant.id,
        verifiedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: { table: true },
    });

    if (!verification) {
      res.status(400).json({
        success: false,
        error: 'No pending verification request found. Please request a new code.',
      });
      return;
    }

    if (new Date() > verification.expiresAt) {
      res.status(400).json({
        success: false,
        error: 'Verification code has expired. Please request a new one.',
      });
      return;
    }

    if (verification.attempts >= verification.maxAttempts) {
      res.status(429).json({
        success: false,
        error: 'Maximum verification attempts exceeded. Please request a new code.',
      });
      return;
    }

    const isValid = brevoService.verifyOtpHash(code, normalizedEmail, verification.otpHash);

    if (!isValid) {
      const remainingAttempts = verification.maxAttempts - (verification.attempts + 1);
      await prisma.customerVerification.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });

      res.status(400).json({
        success: false,
        error: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
      });
      return;
    }

    // Resolve table
    let resolvedTableId = verification.tableId;
    let resolvedTableNumber = verification.table?.tableNumber || tableNumber || 'Counter';

    if (!resolvedTableId && tableNumber) {
      const table = await prisma.table.findFirst({
        where: { restaurantId: restaurant.id, tableNumber: String(tableNumber).trim() },
      });
      if (table) {
        resolvedTableId = table.id;
        resolvedTableNumber = table.tableNumber;
      }
    }

    // Issue signed session token
    const sessionToken = brevoService.generateCustomerSessionToken({
      email: normalizedEmail,
      restaurantId: restaurant.id,
      tableId: resolvedTableId || 'unassigned',
      tableNumber: resolvedTableNumber,
    });

    // Mark verified
    await prisma.customerVerification.update({
      where: { id: verification.id },
      data: {
        verifiedAt: new Date(),
        sessionToken,
      },
    });

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        sessionToken,
        email: normalizedEmail,
        restaurantSlug: restaurant.slug,
        restaurantName: restaurant.name,
        tableNumber: resolvedTableNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};
