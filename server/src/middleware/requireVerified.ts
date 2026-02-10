import { Response, NextFunction } from 'express';
import { AuthRequest } from './requireAuth.js';

export function requireVerified(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.session?.emailVerified) {
    return res.status(403).json({
      error: 'Verify your email to access this page.',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }
  next();
}
