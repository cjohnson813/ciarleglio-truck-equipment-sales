import { Router } from 'express';
import { z } from 'zod';
import { sendContactEmail } from '../lib/email.js';

const router = Router();

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  phone: z.string().min(1, 'Phone is required').max(30),
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  business: z.string().max(200).optional(),
  message: z.string().min(1, 'Message is required').max(10000)
});

router.post('/', async (req, res) => {
  try {
    const parsed = contactSchema.parse(req.body);
    await sendContactEmail(parsed);
    res.json({ ok: true, message: 'Message sent successfully.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const first = err.issues[0];
      return res.status(400).json({ error: first?.message || 'Validation failed' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
});

export default router;
