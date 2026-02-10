import { Response, NextFunction } from 'express';
import { RequestWithSession } from './optionalSession.js';

export function requireAdmin(req: RequestWithSession, res: Response, next: NextFunction) {
  const header = req.header('Authorization') || '';
  const bearerToken = header.startsWith('Bearer ') ? header.slice(7) : undefined;
  const expectedToken = process.env.ADMIN_TOKEN;
  const isBearerAdmin = expectedToken && bearerToken && bearerToken === expectedToken;
  const isSessionAdmin = req.session?.role === 'ADMIN';

  if (isBearerAdmin || isSessionAdmin) {
    return next();
  }
  if (!expectedToken && !req.session) {
    console.warn('ADMIN_TOKEN not set and no session; denying admin requests');
  }
  return res.status(401).json({ error: 'Unauthorized' });
}


