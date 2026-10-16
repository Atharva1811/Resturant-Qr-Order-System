import { describe, it, expect } from 'vitest';

interface MenuItemMock {
  id: string;
  price: number;
  options: Record<string, number>;
}

// Pure calculation engine mirroring public.controller.ts logic
export function calculateOrderTotals(
  items: {
    menuItemId: string;
    quantity: number;
    optionIds?: string[];
  }[],
  dbItems: Map<string, MenuItemMock>,
  taxRatePercent: number
) {
  let subtotal = 0;
  const itemSnapshots = [];

  for (const item of items) {
    const dbItem = dbItems.get(item.menuItemId);
    if (!dbItem) throw new Error(`Item ${item.menuItemId} not found`);

    let unitPrice = dbItem.price;
    if (item.optionIds) {
      for (const optId of item.optionIds) {
        const optPrice = dbItem.options[optId] || 0;
        unitPrice += optPrice;
      }
    }

    const itemTotal = Number((unitPrice * item.quantity).toFixed(2));
    subtotal += itemTotal;
    itemSnapshots.push({
      menuItemId: item.menuItemId,
      unitPrice: Number(unitPrice.toFixed(2)),
      quantity: item.quantity,
      itemTotal,
    });
  }

  subtotal = Number(subtotal.toFixed(2));
  const tax = Number(((subtotal * taxRatePercent) / 100).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  return { subtotal, tax, total, itemSnapshots };
}

describe('Order Total Calculation & Pricing Integrity Unit Tests', () => {
  const dbCatalog = new Map<string, MenuItemMock>([
    [
      'item-pizza',
      {
        id: 'item-pizza',
        price: 18.5,
        options: {
          'opt-gf-crust': 3.5,
          'opt-extra-cheese': 3.0,
          'opt-hot-honey': 1.5,
        },
      },
    ],
    [
      'item-garlic-bread',
      {
        id: 'item-garlic-bread',
        price: 12.0,
        options: {},
      },
    ],
  ]);

  it('calculates simple item order with no modifiers accurately', () => {
    const result = calculateOrderTotals(
      [{ menuItemId: 'item-garlic-bread', quantity: 2 }],
      dbCatalog,
      8.5
    );

    // subtotal = 12 * 2 = 24.00
    // tax = 24 * 0.085 = 2.04
    // total = 26.04
    expect(result.subtotal).toBe(24.0);
    expect(result.tax).toBe(2.04);
    expect(result.total).toBe(26.04);
  });

  it('calculates complex multi-modifier item accurately', () => {
    const result = calculateOrderTotals(
      [
        {
          menuItemId: 'item-pizza',
          quantity: 2,
          optionIds: ['opt-gf-crust', 'opt-extra-cheese'], // 18.5 + 3.5 + 3.0 = 25.0 each
        },
        {
          menuItemId: 'item-garlic-bread',
          quantity: 1, // 12.0
        },
      ],
      dbCatalog,
      8.5
    );

    // Pizza: 25.0 * 2 = 50.0
    // Bread: 12.0 * 1 = 12.0
    // Subtotal = 62.00
    // Tax = 62.00 * 0.085 = 5.27
    // Total = 67.27
    expect(result.subtotal).toBe(62.0);
    expect(result.tax).toBe(5.27);
    expect(result.total).toBe(67.27);
  });

  it('rounds floating point fractional cents correctly according to financial standards', () => {
    const customCatalog = new Map<string, MenuItemMock>([
      ['item-fraction', { id: 'item-fraction', price: 9.99, options: {} }],
    ]);

    const result = calculateOrderTotals(
      [{ menuItemId: 'item-fraction', quantity: 3 }],
      customCatalog,
      8.875
    );

    // 9.99 * 3 = 29.97
    // tax = 29.97 * 0.08875 = 2.6598375 -> rounded to 2.66
    // total = 29.97 + 2.66 = 32.63
    expect(result.subtotal).toBe(29.97);
    expect(result.tax).toBe(2.66);
    expect(result.total).toBe(32.63);
  });
});
