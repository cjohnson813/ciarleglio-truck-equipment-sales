import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../lib/auth.js';
import { normalizeEmail, normalizePhone } from '../lib/normalize.js';
import { requireAuth, AuthRequest } from '../middleware/requireAuth.js';
import { requireVerified } from '../middleware/requireVerified.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10,15}$/;

const updateProfileSchema = z.object({
  username: z.string().min(8, 'Username must be at least 8 characters').optional(),
  email: z.string().min(1).refine((e) => emailRegex.test(normalizeEmail(e)), 'Invalid email format').optional(),
  phone: z.string().min(1).refine((p) => phoneRegex.test(normalizePhone(p)), 'Invalid phone number').optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

export async function getAccount(req: AuthRequest, res: Response) {
  if (!req.session) return res.status(401).json({ error: 'Not logged in' });
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { id: true, username: true, email: true, phone: true, role: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load account' });
  }
}

export async function updateAccount(req: AuthRequest, res: Response) {
  if (!req.session) return res.status(401).json({ error: 'Not logged in' });
  try {
    const raw = updateProfileSchema.parse(req.body);
    const updates: { username?: string; email?: string; phone?: string } = {};
    if (raw.username !== undefined) updates.username = raw.username;
    if (raw.email !== undefined) updates.email = normalizeEmail(raw.email);
    if (raw.phone !== undefined) updates.phone = normalizePhone(raw.phone);

    if (updates.email) {
      const existing = await prisma.user.findFirst({
        where: { email: updates.email, NOT: { id: req.session.userId } }
      });
      if (existing) return res.status(400).json({ error: 'Email already in use' });
    }
    if (updates.phone) {
      const existing = await prisma.user.findFirst({
        where: { phone: updates.phone, NOT: { id: req.session.userId } }
      });
      if (existing) return res.status(400).json({ error: 'Phone number already in use' });
    }
    if (updates.username) {
      const existing = await prisma.user.findFirst({
        where: { username: updates.username, NOT: { id: req.session.userId } }
      });
      if (existing) return res.status(400).json({ error: 'Username already taken' });
    }

    const user = await prisma.user.update({
      where: { id: req.session.userId },
      data: updates,
      select: { id: true, username: true, email: true, phone: true, role: true }
    });
    res.json(user);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0]?.message || 'Validation failed' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to update account' });
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  if (!req.session) return res.status(401).json({ error: 'Not logged in' });
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
    if (!user || !(await verifyPassword(user.passwordHash, currentPassword))) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    await prisma.user.update({
      where: { id: req.session.userId },
      data: { passwordHash: await hashPassword(newPassword) }
    });
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0]?.message || 'Validation failed' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to change password' });
  }
}

const accountRouter = Router();
accountRouter.use(requireAuth);
accountRouter.use(requireVerified);
accountRouter.get('/', getAccount);
accountRouter.put('/', updateAccount);
accountRouter.post('/change-password', changePassword);

export { accountRouter };
