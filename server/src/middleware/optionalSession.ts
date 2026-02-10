import { Request, Response, NextFunction } from 'express';
import { verify, getCookieName, SessionPayload } from '../lib/session.js';

export interface RequestWithSession extends Request {
  session?: SessionPayload | null;
}

export function optionalSession(req: RequestWithSession, _res: Response, next: NextFunction) {
  const token = req.cookies?.[getCookieName()];
  if (!token) {
    req.session = undefined;
    return next();
  }
  req.session = verify(token) ?? undefined;
  next();
}
