import { Router } from 'express';
import argon2 from 'argon2';
import { prisma } from '../lib/prisma.js';
import { signToken } from '../lib/jwt.js';
import { asyncHandler, HttpError } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';
import { changePasswordSchema, loginSchema, updateProfileSchema } from '../validation.js';
import { isProd } from '../lib/env.js';
import { loginLimiter } from '../middleware/rateLimit.js';

export const authRouter = Router();

authRouter.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new HttpError(401, 'Неверный e-mail или пароль');
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new HttpError(401, 'Неверный e-mail или пароль');

    const token = signToken({ sub: user.id, email: user.email });
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  }),
);

authRouter.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) throw new HttpError(401, 'Пользователь не найден');
    res.json({ id: user.id, email: user.email, name: user.name });
  }),
);

// Update display name / e-mail.
authRouter.put(
  '/profile',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name, email } = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.sub },
      data: { name, email },
    });
    res.json({ id: user.id, email: user.email, name: user.name });
  }),
);

// Change password — requires the current one.
authRouter.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) throw new HttpError(401, 'Пользователь не найден');

    const ok = await argon2.verify(user.passwordHash, currentPassword);
    if (!ok) throw new HttpError(400, 'Текущий пароль неверен');

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await argon2.hash(newPassword) },
    });
    res.json({ ok: true });
  }),
);
