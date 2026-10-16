import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { qrService } from '../services/qr.service.js';
import { socketService } from '../services/socket.service.js';
import { paymentService } from '../services/payment.service.js';

const orderItemSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().positive(),
  selectedCustomizations: z
    .array(
      z.object({
        groupId: z.string().uuid(),
        optionIds: z.array(z.string().uuid()),
      })
    )
    .optional(),
  notes: z.string().optional(),
});

const createOrderSchema = z.object({
  restaurantSlug: z.string().min(1),
  tableNumber: z.string().min(1),
  tableToken: z.string().optional(),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  sessionToken: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
  paymentMethod: z.enum(['COUNTER', 'ONLINE']).default('COUNTER'),
  notes: z.string().optional(),
});

export const getRestaurantBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      include: {
        categories: {
          orderBy: { sortOrder: 'asc' },
        },
        menuItems: {
          include: {
            customizationGroups: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!restaurant) {
      res.status(404).json({ success: false, error: 'Restaurant not found' });
      return;
    }

    if (restaurant.status === 'SUSPENDED') {
      res.status(403).json({ success: false, error: 'This restaurant is currently closed or suspended.' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        cuisine: restaurant.cuisine,
        logoUrl: restaurant.logoUrl,
        bannerUrl: restaurant.bannerUrl,
        address: restaurant.address,
        phone: restaurant.phone,
        email: restaurant.email,
        currency: restaurant.currency,
        taxRate: restaurant.taxRate,
        categories: restaurant.categories,
        menuItems: restaurant.menuItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyTable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug, table: tableNumber, token } = req.query;

    if (!slug || !tableNumber) {
      res.status(400).json({ success: false, error: 'slug and table parameters are required' });
      return;
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: String(slug) },
    });

    if (!restaurant) {
      res.status(404).json({ success: false, error: 'Restaurant not found' });
      return;
    }

    const verification = await qrService.verifyTable(
      prisma,
      restaurant.id,
      String(tableNumber),
      token ? String(token) : undefined
    );

    if (!verification.isValid) {
      res.status(400).json({ success: false, error: verification.error });
      return;
    }

    res.json({
      success: true,
      data: {
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          currency: restaurant.currency,
          taxRate: restaurant.taxRate,
          logoUrl: restaurant.logoUrl,
        },
        table: {
          id: verification.table.id,
          tableNumber: verification.table.tableNumber,
          capacity: verification.table.capacity,
          status: verification.table.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = createOrderSchema.parse(req.body);

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: input.restaurantSlug },
    });

    if (!restaurant) {
      res.status(404).json({ success: false, error: 'Restaurant not found' });
      return;
    }

    if (restaurant.status === 'SUSPENDED') {
      res.status(403).json({ success: false, error: 'This restaurant is currently closed or suspended.' });
      return;
    }

    // Verify table
    const tableVerification = await qrService.verifyTable(
      prisma,
      restaurant.id,
      input.tableNumber,
      input.tableToken
    );

    if (!tableVerification.isValid || !tableVerification.table) {
      res.status(400).json({ success: false, error: tableVerification.error || 'Invalid table' });
      return;
    }

    const table = tableVerification.table;

    // Duplicate submission guard: prevent duplicate orders if an identical submission occurs within 5 seconds
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const existingRecentOrder = await prisma.order.findFirst({
      where: {
        restaurantId: restaurant.id,
        tableId: table.id,
        customerEmail: input.customerEmail.toLowerCase().trim(),
        createdAt: { gte: fiveSecondsAgo },
      },
      include: {
        items: { include: { customizations: true } },
        table: true,
        restaurant: { select: { id: true, name: true, slug: true, currency: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingRecentOrder) {
      res.status(200).json({
        success: true,
        message: 'Order already received',
        data: {
          order: existingRecentOrder,
          isDuplicate: true,
        },
      });
      return;
    }

    // Fetch and validate all menu items server-side (NEVER trust client price)
    const itemIds = input.items.map((i) => i.menuItemId);
    const dbMenuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: itemIds },
        restaurantId: restaurant.id,
      },
      include: {
        customizationGroups: {
          include: {
            options: true,
          },
        },
      },
    });

    const dbItemMap = new Map(dbMenuItems.map((item) => [item.id, item]));

    // Check that all requested items exist and are available
    for (const itemInput of input.items) {
      const dbItem = dbItemMap.get(itemInput.menuItemId);
      if (!dbItem) {
        res.status(400).json({
          success: false,
          error: `Item with id ${itemInput.menuItemId} does not exist in this restaurant.`,
        });
        return;
      }
      if (!dbItem.isAvailable) {
        res.status(400).json({
          success: false,
          error: `Item "${dbItem.name}" is currently sold out / unavailable.`,
        });
        return;
      }
    }

    // Recalculate price snapshots server-side
    let calculatedSubtotal = 0;
    const preparedItems: {
      menuItemId: string;
      nameSnapshot: string;
      unitPriceSnapshot: number;
      quantity: number;
      itemTotal: number;
      notes?: string;
      customizations: {
        groupNameSnapshot: string;
        optionNameSnapshot: string;
        priceDeltaSnapshot: number;
      }[];
    }[] = [];

    for (const itemInput of input.items) {
      const dbItem = dbItemMap.get(itemInput.menuItemId)!;
      let unitPrice = dbItem.price;
      const snapshotCustomizations: {
        groupNameSnapshot: string;
        optionNameSnapshot: string;
        priceDeltaSnapshot: number;
      }[] = [];

      if (itemInput.selectedCustomizations && itemInput.selectedCustomizations.length > 0) {
        for (const custInput of itemInput.selectedCustomizations) {
          const group = dbItem.customizationGroups.find((g) => g.id === custInput.groupId);
          if (group) {
            for (const optId of custInput.optionIds) {
              const option = group.options.find((o) => o.id === optId);
              if (option && option.isAvailable) {
                unitPrice += option.price;
                snapshotCustomizations.push({
                  groupNameSnapshot: group.name,
                  optionNameSnapshot: option.name,
                  priceDeltaSnapshot: option.price,
                });
              }
            }
          }
        }
      }

      const itemTotal = Number((unitPrice * itemInput.quantity).toFixed(2));
      calculatedSubtotal += itemTotal;

      preparedItems.push({
        menuItemId: dbItem.id,
        nameSnapshot: dbItem.name,
        unitPriceSnapshot: Number(unitPrice.toFixed(2)),
        quantity: itemInput.quantity,
        itemTotal,
        notes: itemInput.notes,
        customizations: snapshotCustomizations,
      });
    }

    calculatedSubtotal = Number(calculatedSubtotal.toFixed(2));
    const calculatedTax = Number(((calculatedSubtotal * restaurant.taxRate) / 100).toFixed(2));
    const calculatedTotal = Number((calculatedSubtotal + calculatedTax).toFixed(2));

    // Execute atomic transaction for order creation and snapshots
    const createdOrder = await prisma.$transaction(async (tx) => {
      // Increment restaurant order counter
      const updatedRestaurant = await tx.restaurant.update({
        where: { id: restaurant.id },
        data: { totalOrders: { increment: 1 } },
      });

      const orderNumber = `ORD-${1000 + updatedRestaurant.totalOrders}`;

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          restaurantId: restaurant.id,
          tableId: table.id,
          tableNumberSnapshot: table.tableNumber,
          customerName: input.customerName.trim(),
          customerEmail: input.customerEmail.toLowerCase().trim(),
          subtotal: calculatedSubtotal,
          tax: calculatedTax,
          total: calculatedTotal,
          paymentMethod: input.paymentMethod,
          paymentStatus: 'PENDING',
          status: 'NEW',
          notes: input.notes,
          items: {
            create: preparedItems.map((item) => ({
              menuItemId: item.menuItemId,
              nameSnapshot: item.nameSnapshot,
              unitPriceSnapshot: item.unitPriceSnapshot,
              quantity: item.quantity,
              itemTotal: item.itemTotal,
              notes: item.notes,
              customizations: {
                create: item.customizations,
              },
            })),
          },
        },
        include: {
          items: {
            include: {
              customizations: true,
            },
          },
          table: true,
          restaurant: {
            select: {
              id: true,
              name: true,
              slug: true,
              currency: true,
            },
          },
        },
      });

      // Audit Event
      await tx.auditEvent.create({
        data: {
          restaurantId: restaurant.id,
          orderId: newOrder.id,
          action: 'ORDER_CREATED',
          details: JSON.stringify({
            orderNumber: newOrder.orderNumber,
            customerEmail: newOrder.customerEmail,
            total: newOrder.total,
            tableNumber: table.tableNumber,
          }),
        },
      });

      return newOrder;
    });

    // If online payment selected, initiate payment record
    let paymentDetails;
    if (input.paymentMethod === 'ONLINE') {
      paymentDetails = await paymentService.initiatePayment(
        prisma,
        createdOrder.id,
        'ONLINE',
        input.customerEmail
      );
    } else {
      await paymentService.initiatePayment(
        prisma,
        createdOrder.id,
        'COUNTER',
        input.customerEmail
      );
    }

    // Broadcast real-time event to kitchen & admin
    socketService.notifyOrderCreated(restaurant.id, createdOrder);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        order: createdOrder,
        payment: paymentDetails,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const trackOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            currency: true,
            phone: true,
          },
        },
        table: {
          select: {
            tableNumber: true,
          },
        },
        items: {
          include: {
            customizations: true,
          },
        },
        payments: {
          select: {
            id: true,
            provider: true,
            status: true,
            amount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    // Calculate progress step index:
    // NEW (0) -> ACCEPTED (1) -> PREPARING (2) -> READY (3) -> COMPLETED (4)
    const statusSteps: Record<string, number> = {
      NEW: 0,
      ACCEPTED: 1,
      PREPARING: 2,
      READY: 3,
      COMPLETED: 4,
      CANCELLED: -1,
    };

    res.json({
      success: true,
      data: {
        ...order,
        currentStep: statusSteps[order.status] ?? 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
