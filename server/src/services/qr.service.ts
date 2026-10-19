import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

export class QrService {
  /**
   * Generates a cryptographically strong, collision-resistant token for table QR codes.
   */
  public generateQrToken(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Constructs the customer-facing scanning URL.
   */
  public buildCustomerMenuUrl(
    baseUrl: string,
    restaurantSlug: string,
    tableNumber: string,
    qrToken?: string
  ): string {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const cleanSlug = encodeURIComponent(restaurantSlug.trim().toLowerCase());
    const tableSlug = encodeURIComponent(tableNumber.trim().toLowerCase().replace(/\s+/g, '-'));
    const tokenQuery = qrToken ? `?token=${encodeURIComponent(qrToken.trim())}` : '';
    return `${cleanBase}/m/${cleanSlug}/${tableSlug}${tokenQuery}`;
  }

  /**
   * Validates that the provided table number and token correspond to an active table belonging to the restaurant.
   */
  public async verifyTable(
    prisma: PrismaClient,
    restaurantId: string,
    tableNumber: string,
    qrToken?: string
  ): Promise<{
    isValid: boolean;
    table?: any;
    error?: string;
  }> {
    const table = await prisma.table.findFirst({
      where: {
        restaurantId,
        tableNumber: String(tableNumber).trim(),
      },
    });

    if (!table) {
      return {
        isValid: false,
        error: `Table ${tableNumber} does not exist in this restaurant.`,
      };
    }

    if (qrToken && table.qrToken !== qrToken.trim()) {
      return {
        isValid: false,
        error: 'Invalid or expired QR code token for this table.',
      };
    }

    if (table.status === 'RESERVED') {
      return {
        isValid: false,
        error: `Table ${tableNumber} is currently reserved. Please speak to the restaurant host.`,
      };
    }

    return {
      isValid: true,
      table,
    };
  }
}

export const qrService = new QrService();
