import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/error.js';
import { productCreate, productUpdate, reorderSchema } from '../validation.js';
import { deleteReplaced, deleteUpload, deleteUploads } from '../lib/files.js';

export const productsRouter = Router();
productsRouter.use(requireAuth);

const include = { variants: { orderBy: { sortOrder: 'asc' } as const }, category: true };

// Bulk reorder (drag-and-drop). Declared before "/:id".
productsRouter.post(
  '/reorder',
  asyncHandler(async (req, res) => {
    const { items } = reorderSchema.parse(req.body);
    for (const item of items) {
      await prisma.product.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } });
    }
    res.json({ ok: true });
  }),
);

// List — optionally filtered by ?categoryId=
productsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const rows = await prisma.product.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include,
    });
    res.json(rows);
  }),
);

productsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const row = await prisma.product.findUnique({ where: { id: Number(req.params.id) }, include });
    if (!row) throw new HttpError(404, 'Товар не найден');
    res.json(row);
  }),
);

productsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { variants, ...data } = productCreate.parse(req.body);
    const row = await prisma.product.create({
      data: {
        ...data,
        variants: {
          create: variants.map((v, i) => ({ weight: v.weight, image: v.image, sortOrder: v.sortOrder || i })),
        },
      },
      include,
    });
    res.status(201).json(row);
  }),
);

// Full update — replaces the variant list.
productsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { variants, ...data } = productUpdate.parse(req.body);
    const previous = await prisma.product.findUnique({ where: { id }, include: { variants: true } });
    const row = await prisma.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({ where: { productId: id } });
      return tx.product.update({
        where: { id },
        data: {
          ...data,
          variants: {
            create: variants.map((v, i) => ({ weight: v.weight, image: v.image, sortOrder: v.sortOrder || i })),
          },
        },
        include,
      });
    });
    await deleteReplaced(previous?.image, data.image);
    // Variants are replaced wholesale, so a packshot that no longer appears in
    // the new list would otherwise be orphaned on disk. deleteUpload re-checks
    // references first, so a file still used elsewhere survives.
    const keep = new Set(variants.map((v) => v.image).filter(Boolean));
    await deleteUploads((previous?.variants ?? []).map((v) => v.image).filter((u) => u && !keep.has(u)));
    res.json(row);
  }),
);

// Partial update — toggles/reorder only (does not touch variants).
productsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { variants: _v, ...rest } = productUpdate.partial().parse(req.body);
    const row = await prisma.product.update({ where: { id }, data: rest, include });
    res.json(row);
  }),
);

productsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const row = await prisma.product.findUnique({ where: { id }, include: { variants: true } });
    await prisma.product.delete({ where: { id } });
    await deleteUpload(row?.image);
    await deleteUploads((row?.variants ?? []).map((v) => v.image));
    res.status(204).end();
  }),
);
