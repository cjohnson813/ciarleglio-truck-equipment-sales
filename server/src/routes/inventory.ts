import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { z } from 'zod';
import multer from 'multer';
import crypto from 'crypto';
import { supabase, INVENTORY_BUCKET } from '../lib/supabase.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const conditionEnum = z.enum(['NEW', 'LIKE_NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'NEEDS_WORK']);

const baseSchema = z.object({
  category: z.string().min(1),
  subcategory: z.string().min(1).optional(),
  make: z.string().min(1),
  model: z.string().min(1),
  mileage: z.number().int().nonnegative().optional(),
  hours: z.number().int().nonnegative().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  condition: conditionEnum
});

const createSchema = baseSchema.refine(data => data.mileage != null || data.hours != null, {
  message: 'Either mileage (for trucks) or hours (for equipment) is required.'
});

const updateSchema = baseSchema.partial();

router.get('/', async (req, res) => {
  try {
    const { category, make, minYear, maxYear } = req.query;
    const items = await prisma.inventoryItem.findMany({
      where: {
        category: category ? String(category) : undefined,
        make: make ? String(make) : undefined,
        year: minYear || maxYear ? {
          gte: minYear ? Number(minYear) : undefined,
          lte: maxYear ? Number(maxYear) : undefined
        } : undefined
      },
      include: { images: { orderBy: { orderIndex: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await prisma.inventoryItem.findUnique({ where: { id: req.params.id }, include: { images: { orderBy: { orderIndex: 'asc' } } } });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

router.post('/', async (req, res) => {
  try {
    const parsed = createSchema.parse(req.body);
    const created = await prisma.inventoryItem.create({ data: parsed });
    res.status(201).json(created);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', issues: err.issues });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const parsed = updateSchema.parse(req.body);
    const updated = await prisma.inventoryItem.update({ where: { id: req.params.id }, data: parsed });
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', issues: err.issues });
    }
    if ((err as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'Not found' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.inventoryItem.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if ((err as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'Not found' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Upload images for an item
router.post('/:id/images', upload.array('images'), async (req, res) => {
  try {
    const itemId = req.params.id;
    const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    // ensure bucket exists (no-op if already exists)
    await supabase.storage.createBucket(INVENTORY_BUCKET, { public: true }).catch(() => {});

    const existingCount = await prisma.image.count({ where: { itemId } });

    const saved: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = (file.originalname.split('.').pop() || 'bin').toLowerCase();
      const key = `${itemId}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from(INVENTORY_BUCKET).upload(key, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });
      if (uploadErr) {
        console.error(uploadErr);
        return res.status(500).json({ error: 'Failed to upload image' });
      }

      const { data: publicUrlData } = supabase.storage.from(INVENTORY_BUCKET).getPublicUrl(key);
      const publicUrl = publicUrlData.publicUrl;

      const created = await prisma.image.create({
        data: {
          itemId,
          storagePath: key,
          publicUrl,
          orderIndex: existingCount + i
        }
      });
      saved.push(created);
    }

    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// Reorder images
router.post('/:id/images/reorder', async (req, res) => {
  try {
    const itemId = req.params.id;
    const order: string[] = req.body?.order;
    if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array of image IDs' });
    await prisma.$transaction(order.map((imageId, idx) => prisma.image.update({ where: { id: imageId }, data: { orderIndex: idx } })));
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reorder images' });
  }
});

// Delete image
router.delete('/:id/images/:imageId', async (req, res) => {
  try {
    const image = await prisma.image.findUnique({ where: { id: req.params.imageId } });
    if (!image) return res.status(404).json({ error: 'Image not found' });
    await supabase.storage.from(INVENTORY_BUCKET).remove([image.storagePath]);
    await prisma.image.delete({ where: { id: req.params.imageId } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

export default router;

