import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import { partnerRequestStatus } from '../validation.js';

// Admin-only management of inbound partner requests.
// (Public submission lives in routes/public.ts.)
export const partnerRequestsRouter = Router();
partnerRequestsRouter.use(requireAuth);

partnerRequestsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const rows = await prisma.partnerRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    res.json(rows);
  }),
);

partnerRequestsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { status } = partnerRequestStatus.parse(req.body);
    const row = await prisma.partnerRequest.update({ where: { id: Number(req.params.id) }, data: { status } });
    res.json(row);
  }),
);

partnerRequestsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.partnerRequest.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  }),
);
