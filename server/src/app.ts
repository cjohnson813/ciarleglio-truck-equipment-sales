import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import inventoryRouter from './routes/inventory.js';
import { requireAdmin } from './middleware/adminAuth.js';

dotenv.config();

const app = express();

// CORS configuration: allow all origins (for local development and file:// protocol)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/inventory', inventoryRouter);

// Protect write routes by default via prefix
app.use('/api/admin/inventory', requireAdmin, inventoryRouter);

export default app;

