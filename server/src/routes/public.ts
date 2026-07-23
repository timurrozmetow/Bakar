import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, HttpError } from '../middleware/error.js';
import { partnerRequestCreate } from '../validation.js';
import { formLimiter } from '../middleware/rateLimit.js';
import { notifyPartnerRequest } from '../lib/notify.js';
import { loadSiteData } from '../lib/siteData.js';

// Unauthenticated endpoints consumed by the public website.
export const publicRouter = Router();

// One call returns everything the site needs to render.
publicRouter.get(
  '/site',
  asyncHandler(async (_req, res) => {
    res.json(await loadSiteData());
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
