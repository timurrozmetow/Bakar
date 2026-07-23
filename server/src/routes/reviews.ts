import { prisma } from '../lib/prisma.js';
import { crudRouter } from '../lib/crud.js';
import { reviewCreate, reviewUpdate } from '../validation.js';

export const reviewsRouter = crudRouter({
  model: prisma.review,
  createSchema: reviewCreate,
  updateSchema: reviewUpdate,
  orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
});
