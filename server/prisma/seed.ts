import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await argon2.hash('admin1234', { type: argon2.argon2id });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@local.dev' },
    update: {},
    create: {
      username: 'adminuser',
      email: 'admin@local.dev',
      phone: '8608767740',
      passwordHash: adminPassword,
      role: 'ADMIN',
      emailVerifiedAt: new Date(), // so login works without verifying email in dev
    },
  });
  console.log('Seeded admin user:', admin.email);

  const count = await prisma.inventoryItem.count();
  if (count === 0) {
    await prisma.inventoryItem.createMany({
      data: [
        { category: 'Trucks', subcategory: 'Dump Trucks', make: 'Peterbilt', model: '367', year: 2020, mileage: 85000, hours: null, condition: 'EXCELLENT' },
        { category: 'Construction Equipment', subcategory: 'Excavators', make: 'Caterpillar', model: '320', year: 2021, mileage: null, hours: 2500, condition: 'GOOD' },
      ],
    });
    console.log('Seeded 2 inventory items.');
  } else {
    console.log('Inventory already has items, skipping.');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
