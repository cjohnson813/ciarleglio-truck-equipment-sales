import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import inventoryRouter from './routes/inventory.js';
import authRouter from './routes/auth.js';
import { accountRouter } from './routes/account.js';
import adminUsersRouter from './routes/adminUsers.js';
import contactRouter from './routes/contact.js';
import { requireAdmin } from './middleware/adminAuth.js';
import { optionalSession } from './middleware/optionalSession.js';
import prisma from './lib/prisma.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', '..', 'public_html');

const app = express();

// CORS: allow frontend origin(s) with credentials (cookies)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
// Dev fallback: allow common localhost ports when no ALLOWED_ORIGINS set
if (allowedOrigins.length === 0 && process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000', 'http://localhost:4000', 'http://localhost:8000', 'http://127.0.0.1:3000', 'http://127.0.0.1:4000', 'http://127.0.0.1:8000');
}
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // same-origin or tools like Postman
    if (allowedOrigins.length === 0) return cb(null, true); // allow all when unset (dev)
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    console.error(err);
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/account', accountRouter);
app.use('/api/inventory', inventoryRouter);

app.use('/api/admin/inventory', optionalSession, requireAdmin, inventoryRouter);
app.use('/api/admin/users', adminUsersRouter);
app.use('/api/contact', contactRouter);

// Serve frontend (HTML/CSS/JS) so the site can be viewed on the same port
app.use(express.static(publicDir, { index: 'index.html' }));

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err && typeof err === 'object' && 'code' in err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Max 10MB per file.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;

