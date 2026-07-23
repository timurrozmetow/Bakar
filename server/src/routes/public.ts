import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, HttpError } from '../middleware/error.js';
import { partnerRequestCreate } from '../validation.js';
import { formLimiter } from '../middleware/rateLimit.js';
import { notifyPartnerRequest } from '../lib/notify.js';

// Unauthenticated endpoints consumed by the public website.
export const publicRouter = Router();

// One call returns everything the site needs to render.
publicRouter.get(
  '/site',
  asyncHandler(async (_req, res) => {
    const [banners, categories, certificates, reviews, settings] = await Promise.all([
      prisma.banner.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        include: {
          products: {
            where: { isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
            include: { variants: { orderBy: { sortOrder: 'asc' } } },
          },
        },
      }),
      prisma.certificate.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }),
      prisma.review.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }),
      prisma.setting.findMany(),
    ]);

    const settingsMap: Record<string, unknown> = {};
    for (const s of settings) settingsMap[s.key] = s.value;

    res.json({ banners, categories, certificates, reviews, settings: settingsMap });
  }),
);

// Single product by slug — powers /products/:slug and its structured data.
publicRouter.get(
  '/products/:slug',
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findFirst({
      where: { slug: req.params.slug, isActive: true },
      include: { variants: { orderBy: { sortOrder: 'asc' } }, category: true },
    });
    if (!product) throw new HttpError(404, 'Товар не найден');
    res.json(product);
  }),
);

// Public form submission from "Стать партнёром".
publicRouter.post(
  '/partner-requests',
  formLimiter,
  asyncHandler(async (req, res) => {
    const data = partnerRequestCreate.parse(req.body);
    const row = await prisma.partnerRequest.create({ data });
    notifyPartnerRequest({ ...data, id: row.id });
    res.status(201).json({ ok: true, id: row.id });
  }),
);
