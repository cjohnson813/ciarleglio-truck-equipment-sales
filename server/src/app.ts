import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import inventoryRouter from './routes/inventory.js';
import { requireAdmin } from './middleware/adminAuth.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/inventory', inventoryRouter);

// Protect write routes by default via prefix
app.use('/api/admin/inventory', requireAdmin, inventoryRouter);

export default app;

