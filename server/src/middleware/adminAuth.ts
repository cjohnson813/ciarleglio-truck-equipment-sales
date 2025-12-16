import { Request, Response, NextFunction } from 'express';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.header('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    console.warn('ADMIN_TOKEN not set; denying admin requests by default');
    return res.status(403).json({ error: 'Admin not configured' });
  }
  if (!token || token !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}


