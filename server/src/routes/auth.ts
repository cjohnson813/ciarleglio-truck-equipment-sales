import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../lib/auth.js';
import { normalizeEmail, normalizePhone } from '../lib/normalize.js';
import { createSessionCookie, verify, getCookieName } from '../lib/session.js';
import { UserRole } from '@prisma/client';

const router = Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10,15}$/; // 10–15 digits after normalization

const signupSchema = z.object({
  username: z.string().min(8, 'Username must be at least 8 characters'),
  email: z.string().min(1).refine((e) => emailRegex.test(normalizeEmail(e)), 'Invalid email format'),
  phone: z.string().min(1).refine((p) => phoneRegex.test(normalizePhone(p)), 'Invalid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const loginSchema = z.object({
  login: z.string().min(1), // username or email
  password: z.string().min(1)
});

router.post('/signup', async (req: Request, res: Response) => {
  try {
    const raw = signupSchema.parse(req.body);
    const email = normalizeEmail(raw.email);
    const phone = normalizePhone(raw.phone);

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) return res.status(400).json({ error: 'Email already in use' });
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) return res.status(400).json({ error: 'Phone number already in use' });
    const existingUsername = await prisma.user.findUnique({ where: { username: raw.username } });
    if (existingUsername) return res.status(400).json({ error: 'Username already taken' });

    const isFirstUser = (await prisma.user.count()) === 0;
    const role = isFirstUser ? UserRole.ADMIN : UserRole.USER;
    const passwordHash = await hashPassword(raw.password);

    const user = await prisma.user.create({
      data: {
        username: raw.username,
        email,
        phone,
        passwordHash,
        role
      }
    });

    const cookie = createSessionCookie({
      userId: user.id,
      username: user.username,
      role: user.role as 'USER' | 'ADMIN'
    });
    res.cookie(cookie.name, cookie.value, cookie.options as Record<string, string | number | boolean>);
    res.status(201).json({
      user: { id: user.id, username: user.username, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const msg = err.issues[0]?.message || 'Validation failed';
      return res.status(400).json({ error: msg });
    }
    console.error(err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { login, password } = loginSchema.parse(req.body);
    const emailNorm = normalizeEmail(login);
    const isEmail = emailRegex.test(emailNorm);

    const user = await prisma.user.findFirst({
      where: isEmail ? { email: emailNorm } : { username: login }
    });
    if (!user || !(await verifyPassword(user.passwordHash, password))) {
      return res.status(401).json({ error: 'Invalid login or password' });
    }

    const cookie = createSessionCookie({
      userId: user.id,
      username: user.username,
      role: user.role as 'USER' | 'ADMIN'
    });
    res.cookie(cookie.name, cookie.value, cookie.options as Record<string, string | number | boolean>);
    res.json({
      user: { id: user.id, username: user.username, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie(getCookieName(), { path: '/' });
  res.json({ ok: true });
});

router.get('/me', (req: Request, res: Response) => {
  const token = req.cookies?.[getCookieName()];
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  const session = verify(token);
  if (!session) {
    res.clearCookie(getCookieName(), { path: '/' });
    return res.status(401).json({ error: 'Session expired' });
  }
  res.json({ user: { id: session.userId, username: session.username, role: session.role } });
});

export default router;
