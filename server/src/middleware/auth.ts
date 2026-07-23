import type { NextFunction, Request, Response } from 'express';
import { verifyToken, type TokenPayload } from '../lib/jwt.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/// Reads the JWT from the `token` cookie or the Authorization header.
function extractToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies?.token;
  return cookieToken ?? null;
}

/// Rejects the request unless a valid admin token is present.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Требуется авторизация' });
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Недействительный или просроченный токен' });
  }
}
