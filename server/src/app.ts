import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import inventoryRouter from './routes/inventory.js';
import authRouter from './routes/auth.js';
import { accountRouter } from './routes/account.js';
import { requireAdmin } from './middleware/adminAuth.js';
import { optionalSession } from './middleware/optionalSession.js';

dotenv.config();

const app = express();

// CORS: allow frontend origin with credentials (cookies)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/account', accountRouter);
app.use('/api/inventory', inventoryRouter);

// Admin inventory: require Bearer token or session with role ADMIN
app.use('/api/admin/inventory', optionalSession, requireAdmin, inventoryRouter);

export default app;

