import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../lib/auth.js';
import { normalizeEmail, normalizePhone } from '../lib/normalize.js';
import { createSessionCookie, verify, getCookieName } from '../lib/session.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/email.js';
import { UserRole } from '@prisma/client';

const router = Router();
const VERIFY_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_EXPIRY_MS = 60 * 60 * 1000; // 1h

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10,15}$/;

const signupSchema = z.object({
  username: z.string().min(8, 'Username must be at least 8 characters'),
  email: z.string().min(1).refine((e) => emailRegex.test(normalizeEmail(e)), 'Invalid email format'),
  phone: z.string().min(1).refine((p) => phoneRegex.test(normalizePhone(p)), 'Invalid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const loginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1)
});

function setSessionCookie(res: Response, user: { id: string; username: string; role: string; emailVerifiedAt: Date | null }) {
  const cookie = createSessionCookie({
    userId: user.id,
    username: user.username,
    role: user.role as 'USER' | 'ADMIN',
    emailVerified: !!user.emailVerifiedAt
  });
  res.cookie(cookie.name, cookie.value, cookie.options as Record<string, string | number | boolean>);
}

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
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpires = new Date(Date.now() + VERIFY_EXPIRY_MS);

    const user = await prisma.user.create({
      data: {
        username: raw.username,
        email,
        phone,
        passwordHash,
        role,
        emailVerifyToken,
        emailVerifyExpires
      }
    });

    await sendVerificationEmail(user.email, emailVerifyToken);
    setSessionCookie(res, user);
    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: false
      },
      message: 'Check your email to verify your account.'
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

    setSessionCookie(res, user);
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: !!user.emailVerifiedAt
      }
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
  res.json({
    user: {
      id: session.userId,
      username: session.username,
      role: session.role,
      emailVerified: session.emailVerified
    }
  });
});

router.post('/resend-verification', async (req: Request, res: Response) => {
  const token = req.cookies?.[getCookieName()];
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  const session = verify(token);
  if (!session) return res.status(401).json({ error: 'Session expired' });
  try {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.emailVerifiedAt) {
      return res.json({ message: 'Already verified or user not found.' });
    }
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpires = new Date(Date.now() + VERIFY_EXPIRY_MS);
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken, emailVerifyExpires }
    });
    await sendVerificationEmail(user.email, emailVerifyToken);
    res.json({ message: 'Verification email sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send' });
  }
});

const verifyEmailSchema = z.object({ token: z.string().min(1) });
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = verifyEmailSchema.parse(req.body);
    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpires: { gt: new Date() }
      }
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired verification link' });
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerifyToken: null,
        emailVerifyExpires: null
      }
    });
    setSessionCookie(res, { ...user, emailVerifiedAt: new Date() });
    res.json({ ok: true, message: 'Email verified.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    console.error(err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

const forgotPasswordSchema = z.object({ email: z.string().email() });
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const emailNorm = normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: emailNorm } });
    if (!user) {
      return res.json({ message: 'If that email is registered, you will receive a reset link.' });
    }
    const passwordResetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetExpires = new Date(Date.now() + RESET_EXPIRY_MS);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken, passwordResetExpires }
    });
    await sendPasswordResetEmail(user.email, passwordResetToken);
    res.json({ message: 'If that email is registered, you will receive a reset link.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    console.error(err);
    res.status(500).json({ error: 'Request failed' });
  }
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
});
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() }
      }
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset link' });
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });
    res.json({ ok: true, message: 'Password updated. You can log in now.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0]?.message || 'Validation failed' });
    }
    console.error(err);
    res.status(500).json({ error: 'Reset failed' });
  }
});

export default router;
