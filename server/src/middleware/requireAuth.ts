import { Request, Response, NextFunction } from 'express';
import { verify, getCookieName, SessionPayload } from '../lib/session.js';

export interface AuthRequest extends Request {
  session?: SessionPayload;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[getCookieName()];
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  const session = verify(token);
  if (!session) {
    res.clearCookie(getCookieName(), { path: '/' });
    return res.status(401).json({ error: 'Session expired' });
  }
  req.session = session;
  next();
}
