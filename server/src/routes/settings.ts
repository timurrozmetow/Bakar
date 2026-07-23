import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import { settingUpdate } from '../validation.js';

// Key/value content blocks: home_stats, about, contacts, marquee, footer, hero_meta.
export const settingsRouter = Router();
settingsRouter.use(requireAuth);

settingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.setting.findMany();
    res.json(rows);
  }),
);

settingsRouter.get(
  '/:key',
  asyncHandler(async (req, res) => {
    const row = await prisma.setting.findUnique({ where: { key: req.params.key } });
    res.json(row ?? { key: req.params.key, value: null });
  }),
);

// Upsert a content block.
settingsRouter.put(
  '/:key',
  asyncHandler(async (req, res) => {
    const { value } = settingUpdate.parse(req.body);
    const row = await prisma.setting.upsert({
      where: { key: req.params.key },
      create: { key: req.params.key, value: value as object },
      update: { value: value as object },
    });
    res.json(row);
  }),
);
