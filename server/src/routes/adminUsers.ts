import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { optionalSession } from '../middleware/optionalSession.js';

const router = Router();
const updateRoleSchema = z.object({ role: z.enum(['USER', 'ADMIN']) });

router.get('/', optionalSession, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        emailVerifiedAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

router.patch('/:id', optionalSession, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = updateRoleSchema.parse(req.body);
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role === 'ADMIN' && body.role === 'USER' && adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot remove the last admin.' });
    }
    const user = await prisma.user.update({
      where: { id },
      data: { role: body.role as 'USER' | 'ADMIN' },
      select: { id: true, username: true, email: true, role: true }
    });
    res.json(user);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0]?.message || 'Invalid role' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;
