import { Router } from 'express';
import type { z } from 'zod';
import { asyncHandler, HttpError } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';
import { deleteReplaced, deleteUploads } from './files.js';
import { reorderSchema } from '../validation.js';

/// Minimal shape of a Prisma model delegate we rely on.
/// `any` params keep this structurally compatible with every generated delegate.
interface Delegate {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findMany: (args?: any) => Promise<any[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findUnique: (args: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: (args: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: (args: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete: (args: any) => Promise<any>;
}

interface CrudOptions<C extends z.AnyZodObject, U extends z.AnyZodObject> {
  model: Delegate;
  createSchema: C;
  updateSchema: U;
  /// Prisma orderBy for the list endpoint.
  orderBy?: unknown;
  /// Prisma include for read endpoints.
  include?: unknown;
  /// Fields holding uploaded file paths — cleaned from disk on delete/replace.
  fileFields?: string[];
}

/// Builds an authenticated CRUD router for a flat entity.
/// Routes: GET / · GET /:id · POST / · PUT /:id · PATCH /:id · DELETE /:id
export function crudRouter<C extends z.AnyZodObject, U extends z.AnyZodObject>(
  opts: CrudOptions<C, U>,
): Router {
  const { model, createSchema, updateSchema, orderBy, include, fileFields = [] } = opts;
  const router = Router();
  router.use(requireAuth);

  const filesOf = (row: Record<string, unknown> | null) =>
    fileFields.map((f) => (row ? (row[f] as string | undefined) : undefined));

  // Bulk reorder — used by drag-and-drop in the admin.
  // Declared before "/:id" so "reorder" is never parsed as an id.
  router.post(
    '/reorder',
    asyncHandler(async (req, res) => {
      const { items } = reorderSchema.parse(req.body);
      for (const item of items) {
        await model.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } });
      }
      res.json({ ok: true });
    }),
  );

  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      const rows = await model.findMany({
        ...(orderBy ? { orderBy } : {}),
        ...(include ? { include } : {}),
      });
      res.json(rows);
    }),
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const id = Number(req.params.id);
      const row = await model.findUnique({ where: { id }, ...(include ? { include } : {}) });
      if (!row) throw new HttpError(404, 'Запись не найдена');
      res.json(row);
    }),
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const data = createSchema.parse(req.body);
      const row = await model.create({ data, ...(include ? { include } : {}) });
      res.status(201).json(row);
    }),
  );

  router.put(
    '/:id',
    asyncHandler(async (req, res) => {
      const id = Number(req.params.id);
      const data = updateSchema.parse(req.body);
      const previous = fileFields.length ? await model.findUnique({ where: { id } }) : null;
      const row = await model.update({ where: { id }, data, ...(include ? { include } : {}) });

      // Drop files that were swapped out for new uploads.
      for (const field of fileFields) {
        await deleteReplaced(
          (previous as Record<string, string> | null)?.[field],
          (data as Record<string, string>)[field],
        );
      }
      res.json(row);
    }),
  );

  // Partial update — used for toggles (isActive) and reordering (sortOrder).
  router.patch(
    '/:id',
    asyncHandler(async (req, res) => {
      const id = Number(req.params.id);
      const data = updateSchema.partial().parse(req.body);
      const row = await model.update({ where: { id }, data, ...(include ? { include } : {}) });
      res.json(row);
    }),
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const id = Number(req.params.id);
      const row = fileFields.length ? await model.findUnique({ where: { id } }) : null;
      await model.delete({ where: { id } });
      await deleteUploads(filesOf(row as Record<string, unknown> | null));
      res.status(204).end();
    }),
  );

  return router;
}
