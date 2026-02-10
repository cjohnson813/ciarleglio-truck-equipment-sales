import crypto from 'crypto';

const COOKIE_NAME = 'session';
const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production';
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  userId: string;
  username: string;
  role: 'USER' | 'ADMIN';
  iat: number;
}

function sign(payload: Omit<SessionPayload, 'iat'>): string {
  const iat = Math.floor(Date.now() / 1000);
  const data = JSON.stringify({ ...payload, iat });
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(data);
  const sig = hmac.digest('hex');
  const encoded = Buffer.from(data, 'utf8').toString('base64url');
  return `${encoded}.${sig}`;
}

export function verify(token: string): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  let data: string;
  try {
    data = Buffer.from(encoded, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(data);
  const expected = hmac.digest('hex');
  const sigBuf = Buffer.from(sig, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  const payload = JSON.parse(data) as SessionPayload;
  if (!payload.userId || !payload.role || !payload.iat) return null;
  if (payload.iat + MAX_AGE_SEC < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export function createSessionCookie(payload: Omit<SessionPayload, 'iat'>): { name: string; value: string; options: Record<string, unknown> } {
  return {
    name: COOKIE_NAME,
    value: sign(payload),
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: MAX_AGE_SEC * 1000,
      path: '/'
    }
  };
}

export function getCookieName(): string {
  return COOKIE_NAME;
}
