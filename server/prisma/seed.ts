import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const commonPassword = await bcrypt.hash('AdminPassword123!', 10);
  const kitchenPassword = await bcrypt.hash('KitchenPassword123!', 10);

  // 1. Create Superadmin User
  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@sudarshan.com' },
    update: {},
    create: {
      email: 'superadmin@sudarshan.com',
      passwordHash: commonPassword,
      name: 'Platform Superadmin',
      role: 'SUPERADMIN',
    },
  });
  console.log(`✓ Superadmin user ready: ${superadmin.email}`);

  // 2. Create Restaurant 1: The Rustic Hearth
  const rusticHearth = await prisma.restaurant.upsert({
    where: { slug: 'rustic-hearth' },
    update: {},
    create: {
      name: 'The Rustic Hearth',
      slug: 'rustic-hearth',
      cuisine: 'Artisan Woodfired & Italian',
      logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=160&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
      address: '742 Evergreen Terrace, Culinary District, Springfield',
      phone: '+1 (555) 234-5678',
      email: 'contact@rustichearth.com',
      currency: 'USD',
      taxRate: 8.5,
      status: 'ACTIVE',
      totalOrders: 142,
      totalRevenue: 5380.5,
    },
  });

  // Admin for Rustic Hearth
  const rusticAdmin = await prisma.user.upsert({
    where: { email: 'admin@rustichearth.com' },
    update: { restaurantId: rusticHearth.id },
    create: {
      email: 'admin@rustichearth.com',
      passwordHash: commonPassword,
      name: 'Chef Marco Rossi',
      role: 'RESTAURANT_ADMIN',
      restaurantId: rusticHearth.id,
    },
  });

  // Kitchen Staff for Rustic Hearth
  const rusticKitchen = await prisma.user.upsert({
    where: { email: 'kitchen@rustichearth.com' },
    update: { restaurantId: rusticHearth.id },
    create: {
      email: 'kitchen@rustichearth.com',
      passwordHash: kitchenPassword,
      name: 'Sarah Lin (Sous Chef)',
      role: 'KITCHEN_STAFF',
      restaurantId: rusticHearth.id,
    },
  });

  // Staff directory entries
  await prisma.restaurantStaff.upsert({
    where: { email: 'admin@rustichearth.com' },
    update: {},
    create: {
      restaurantId: rusticHearth.id,
      userId: rusticAdmin.id,
      name: 'Chef Marco Rossi',
      email: 'admin@rustichearth.com',
      role: 'RESTAURANT_ADMIN',
      status: 'ACTIVE',
    },
  });

  await prisma.restaurantStaff.upsert({
    where: { email: 'kitchen@rustichearth.com' },
    update: {},
    create: {
      restaurantId: rusticHearth.id,
      userId: rusticKitchen.id,
      name: 'Sarah Lin',
      email: 'kitchen@rustichearth.com',
      role: 'KITCHEN_STAFF',
      status: 'ACTIVE',
    },
  });

  // Tables for Rustic Hearth
  const tableNumbers = ['T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06', 'T-07', 'T-08'];
  const createdTables: any[] = [];
  for (const num of tableNumbers) {
    const table = await prisma.table.upsert({
      where: {
        restaurantId_tableNumber: {
          restaurantId: rusticHearth.id,
          tableNumber: num,
        },
      },
      update: {},
      create: {
        restaurantId: rusticHearth.id,
        tableNumber: num,
        capacity: num === 'T-04' || num === 'T-08' ? 6 : 4,
        status: num === 'T-03' ? 'OCCUPIED' : 'AVAILABLE',
        qrToken: `qr_token_${num.toLowerCase()}_${crypto.randomBytes(6).toString('hex')}`,
      },
    });
    createdTables.push(table);
  }
  console.log(`✓ Seeded ${createdTables.length} tables for The Rustic Hearth`);

  // Categories
  const catStarters = await prisma.menuCategory.create({
    data: {
      restaurantId: rusticHearth.id,
      name: 'Starters & Small Plates',
      description: 'Handcrafted appetizers fired in our woodstone hearth',
      sortOrder: 1,
      icon: 'Utensils',
    },
  });

  const catPizzas = await prisma.menuCategory.create({
    data: {
      restaurantId: rusticHearth.id,
      name: 'Woodfired Artisan Pizzas',
      description: 'Slow-fermented 48-hour sourdough crusts baked at 800°F',
      sortOrder: 2,
      icon: 'Pizza',
    },
  });

  const catMains = await prisma.menuCategory.create({
    data: {
      restaurantId: rusticHearth.id,
      name: 'Signature Mains',
      description: 'Seasonal hearth roasted meats and fresh pastas',
      sortOrder: 3,
      icon: 'Soup',
    },
  });

  const catDesserts = await prisma.menuCategory.create({
    data: {
      restaurantId: rusticHearth.id,
      name: 'Desserts',
      description: 'Decadent sweet endings made in-house daily',
      sortOrder: 4,
      icon: 'Cake',
    },
  });

  // Menu Items & Customizations
  const pizzaMargherita = await prisma.menuItem.create({
    data: {
      restaurantId: rusticHearth.id,
      categoryId: catPizzas.id,
      name: 'Woodfired Margherita D.O.P.',
      description: 'San Marzano tomatoes, buffalo mozzarella, fresh basil, and extra virgin olive oil.',
      price: 18.5,
      imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=80',
      isAvailable: true,
      isVeg: true,
      prepTimeMinutes: 12,
      customizationGroups: {
        create: [
          {
            name: 'Crust Preference',
            type: 'SINGLE',
            required: true,
            options: {
              create: [
                { name: 'Traditional Neapolitan', price: 0.0 },
                { name: 'Crispy Thin Crust', price: 0.0 },
                { name: 'Gluten-Free Cauliflower Crust', price: 3.5 },
              ],
            },
          },
          {
            name: 'Extra Toppings',
            type: 'MULTIPLE',
            required: false,
            options: {
              create: [
                { name: 'Double Buffalo Mozzarella', price: 3.0 },
                { name: 'Prosciutto di Parma', price: 4.5 },
                { name: 'Hot Honey Drizzle', price: 1.5 },
              ],
            },
          },
        ],
      },
    },
  });

  const garlicBread = await prisma.menuItem.create({
    data: {
      restaurantId: rusticHearth.id,
      categoryId: catStarters.id,
      name: 'Truffle Hearth Garlic Bread',
      description: 'Warm ciabatta steeped in roasted black garlic butter, aged pecorino, and black truffle oil.',
      price: 12.0,
      imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=500&auto=format&fit=crop&q=80',
      isAvailable: true,
      isVeg: true,
      prepTimeMinutes: 8,
    },
  });

  const braisedShortRib = await prisma.menuItem.create({
    data: {
      restaurantId: rusticHearth.id,
      categoryId: catMains.id,
      name: '12-Hour Braised Beef Short Rib',
      description: 'Chianti wine reduction, creamy mascarpone polenta, and roasted heirloom baby carrots.',
      price: 34.0,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
      isAvailable: true,
      isVeg: false,
      prepTimeMinutes: 20,
    },
  });

  const chocolateFondant = await prisma.menuItem.create({
    data: {
      restaurantId: rusticHearth.id,
      categoryId: catDesserts.id,
      name: 'Molten Chocolate Fondant',
      description: 'Warm 70% Valrhona dark chocolate cake with Madagascar vanilla bean gelato.',
      price: 11.5,
      imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80',
      isAvailable: true,
      isVeg: true,
      prepTimeMinutes: 10,
    },
  });
  console.log(`✓ Seeded menu items and customization groups for The Rustic Hearth`);

  // Initial Demo Order
  const demoOrder = await prisma.order.create({
    data: {
      orderNumber: 'ORD-1001',
      restaurantId: rusticHearth.id,
      tableId: createdTables[0].id,
      tableNumberSnapshot: 'T-01',
      customerName: 'Elena Rostova',
      customerEmail: 'elena@example.com',
      subtotal: 42.5,
      tax: 3.61,
      total: 46.11,
      paymentMethod: 'COUNTER',
      paymentStatus: 'PENDING',
      status: 'PREPARING',
      notes: 'Please bring sparkling water first',
      items: {
        create: [
          {
            menuItemId: pizzaMargherita.id,
            nameSnapshot: 'Woodfired Margherita D.O.P.',
            unitPriceSnapshot: 21.5,
            quantity: 1,
            itemTotal: 21.5,
            customizations: {
              create: [
                {
                  groupNameSnapshot: 'Crust Preference',
                  optionNameSnapshot: 'Traditional Neapolitan',
                  priceDeltaSnapshot: 0.0,
                },
                {
                  groupNameSnapshot: 'Extra Toppings',
                  optionNameSnapshot: 'Double Buffalo Mozzarella',
                  priceDeltaSnapshot: 3.0,
                },
              ],
            },
          },
          {
            menuItemId: garlicBread.id,
            nameSnapshot: 'Truffle Hearth Garlic Bread',
            unitPriceSnapshot: 12.0,
            quantity: 1,
            itemTotal: 12.0,
          },
          {
            menuItemId: chocolateFondant.id,
            nameSnapshot: 'Molten Chocolate Fondant',
            unitPriceSnapshot: 9.0,
            quantity: 1,
            itemTotal: 9.0,
          },
        ],
      },
    },
  });
  console.log(`✓ Seeded demo active kitchen order: ${demoOrder.orderNumber}`);

  // 3. Create Restaurant 2: Bella Italia
  const bellaItalia = await prisma.restaurant.upsert({
    where: { slug: 'bella-italia' },
    update: {},
    create: {
      name: 'Bella Italia Trattoria',
      slug: 'bella-italia',
      cuisine: 'Classic Northern Italian',
      logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=160&auto=format&fit=crop&q=80',
      address: '101 Ocean Boulevard, Coastal Bay',
      phone: '+1 (555) 987-6543',
      email: 'info@bellaitalia.com',
      currency: 'USD',
      taxRate: 9.0,
      status: 'ACTIVE',
      totalOrders: 48,
      totalRevenue: 1950.0,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@bellaitalia.com' },
    update: { restaurantId: bellaItalia.id },
    create: {
      email: 'admin@bellaitalia.com',
      passwordHash: commonPassword,
      name: 'Gianni Moretti',
      role: 'RESTAURANT_ADMIN',
      restaurantId: bellaItalia.id,
    },
  });

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
