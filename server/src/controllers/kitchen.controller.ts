import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { socketService } from '../services/socket.service.js';
import { OrderStatus } from '@prisma/client';

const updateStatusSchema = z.object({
  status: z.enum(['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']),
  notes: z.string().optional(),
});

// State machine validation
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const isValidTransition = (current: OrderStatus, target: OrderStatus): boolean => {
  return VALID_TRANSITIONS[current]?.includes(target) ?? false;
};

export const getKitchenActiveOrders = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.restaurantId;
    if (!restaurantId) {
      res.status(400).json({ success: false, error: 'Restaurant context required' });
      return;
    }

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: { in: ['NEW', 'ACCEPTED', 'PREPARING', 'READY'] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        table: true,
        items: {
          include: {
            customizations: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status: targetStatus, notes } = updateStatusSchema.parse(req.body);
    const restaurantId = req.restaurantId;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { customizations: true } } },
    });

    if (!existingOrder) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    // Tenant Isolation Guard: ensure order belongs to caller's restaurant
    if (req.user?.role !== 'SUPERADMIN' && existingOrder.restaurantId !== restaurantId) {
      res.status(403).json({ success: false, error: 'Access denied: order belongs to another restaurant' });
      return;
    }

    if (!isValidTransition(existingOrder.status, targetStatus)) {
      res.status(400).json({
        success: false,
        error: `Invalid status transition from ${existingOrder.status} to ${targetStatus}`,
        allowedTransitions: VALID_TRANSITIONS[existingOrder.status],
      });
      return;
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: {
          status: targetStatus,
          ...(notes ? { notes: `${existingOrder.notes || ''} | ${notes}`.trim() } : {}),
        },
        include: {
          table: true,
          restaurant: { select: { id: true, name: true, slug: true } },
          items: { include: { customizations: true } },
        },
      });

      await tx.auditEvent.create({
        data: {
          restaurantId: existingOrder.restaurantId,
          userId: req.user?.userId,
          orderId: existingOrder.id,
          action: 'ORDER_STATUS_CHANGED',
          details: JSON.stringify({
            previousStatus: existingOrder.status,
            newStatus: targetStatus,
            updatedBy: req.user?.name || 'Staff',
            notes,
          }),
        },
      });

      return order;
    });

    // Broadcast real-time status update to KDS, Admin, and Customer live tracking
    socketService.notifyOrderStatusUpdated(
      existingOrder.restaurantId,
      existingOrder.id,
      targetStatus,
      updatedOrder
    );

    res.json({
      success: true,
      message: `Order status updated to ${targetStatus}`,
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};
