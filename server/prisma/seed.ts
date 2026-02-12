import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Placeholder image base: same display pattern as app (publicUrl used in img src).
// Seed uses external placeholder URLs; production uploads use Supabase storage.
const PLACEHOLDER = (w: number, h: number, text: string) =>
  `https://placehold.co/${w}x${h}/2a60a7/ffffff?text=${encodeURIComponent(text)}`;

async function main() {
  const adminPasswordPlain = process.env.SEED_ADMIN_PASSWORD ?? 'admin1234';
  const adminPassword = await argon2.hash(adminPasswordPlain, { type: argon2.argon2id });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@local.dev' },
    update: {},
    create: {
      username: 'adminuser',
      email: 'admin@local.dev',
      phone: '8608767740',
      passwordHash: adminPassword,
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
    },
  });
  console.log('Seeded admin user:', admin.email);

  const count = await prisma.inventoryItem.count();
  if (count > 0) {
    console.log('Inventory already has items. Run with reset if you want to re-seed.');
    return;
  }

  type SeedItem = {
    category: string;
    subcategory: string | null;
    make: string;
    model: string;
    mileage: number | null;
    hours: number | null;
    year: number;
    condition: 'NEW' | 'LIKE_NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_WORK';
    imageText?: string;
  };

  const items: SeedItem[] = [
    { category: 'Trucks', subcategory: 'Dump Trucks', make: 'Peterbilt', model: '367', year: 2020, mileage: 85000, hours: null, condition: 'EXCELLENT', imageText: 'Peterbilt 367' },
    { category: 'Trucks', subcategory: 'Tractors', make: 'Kenworth', model: 'T680', year: 2022, mileage: 62000, hours: null, condition: 'LIKE_NEW', imageText: 'Kenworth T680' },
    { category: 'Trucks', subcategory: 'Dump Trucks', make: 'Mack', model: 'Granite', year: 2019, mileage: 112000, hours: null, condition: 'GOOD', imageText: 'Mack Granite' },
    { category: 'Trucks', subcategory: 'Box Trucks', make: 'Freightliner', model: 'M2 106', year: 2021, mileage: 78000, hours: null, condition: 'EXCELLENT', imageText: 'Freightliner M2' },
    { category: 'Trucks', subcategory: 'Utility', make: 'Ford', model: 'F-550', year: 2023, mileage: 24000, hours: null, condition: 'LIKE_NEW', imageText: 'Ford F-550' },
    { category: 'Trucks', subcategory: 'Triaxle', make: 'Peterbilt', model: '567', year: 2021, mileage: 88000, hours: null, condition: 'GOOD', imageText: 'Peterbilt 567' },
    { category: 'Trucks', subcategory: 'Hooklifts', make: 'International', model: 'HV607', year: 2020, mileage: 95000, hours: null, condition: 'GOOD', imageText: 'International HV607' },
    { category: 'Construction Equipment', subcategory: 'Excavators', make: 'Caterpillar', model: '320', year: 2021, mileage: null, hours: 2500, condition: 'GOOD', imageText: 'CAT 320' },
    { category: 'Construction Equipment', subcategory: 'Excavators', make: 'Komatsu', model: 'PC200', year: 2022, mileage: null, hours: 1800, condition: 'EXCELLENT', imageText: 'Komatsu PC200' },
    { category: 'Construction Equipment', subcategory: 'Backhoes', make: 'John Deere', model: '310SL', year: 2023, mileage: null, hours: 1200, condition: 'LIKE_NEW', imageText: 'John Deere 310SL' },
    { category: 'Construction Equipment', subcategory: 'Backhoes', make: 'Case', model: '580N', year: 2020, mileage: null, hours: 2800, condition: 'GOOD', imageText: 'Case 580N' },
    { category: 'Construction Equipment', subcategory: 'Wheel Loaders', make: 'Volvo', model: 'L90H', year: 2022, mileage: null, hours: 2100, condition: 'EXCELLENT', imageText: 'Volvo L90H' },
    { category: 'Construction Equipment', subcategory: 'Skid Steers', make: 'Bobcat', model: 'S770', year: 2021, mileage: null, hours: 3200, condition: 'GOOD', imageText: 'Bobcat S770' },
    { category: 'Construction Equipment', subcategory: 'Skid Steers', make: 'Caterpillar', model: '259D3', year: 2023, mileage: null, hours: 450, condition: 'LIKE_NEW', imageText: 'CAT 259D3' },
    { category: 'Construction Equipment', subcategory: 'Dozers', make: 'Caterpillar', model: 'D6', year: 2019, mileage: null, hours: 4200, condition: 'FAIR', imageText: 'CAT D6' },
  ];

  for (const it of items) {
    const created = await prisma.inventoryItem.create({
      data: {
        category: it.category,
        subcategory: it.subcategory ?? undefined,
        make: it.make,
        model: it.model,
        mileage: it.mileage,
        hours: it.hours,
        year: it.year,
        condition: it.condition,
      },
    });
    const label = it.imageText || `${it.year} ${it.make} ${it.model}`;
    await prisma.image.create({
      data: {
        itemId: created.id,
        storagePath: `seed/placeholder/${created.id}`,
        publicUrl: PLACEHOLDER(800, 600, label),
        orderIndex: 0,
      },
    });
  }

  console.log('Seeded', items.length, 'inventory items with placeholder images.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
