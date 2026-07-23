import { prisma } from '../lib/prisma.js';
import { crudRouter } from '../lib/crud.js';
import { categoryCreate, categoryUpdate } from '../validation.js';

export const categoriesRouter = crudRouter({
  model: prisma.category,
  createSchema: categoryCreate,
  updateSchema: categoryUpdate,
  orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  include: { _count: { select: { products: true } } },
  fileFields: ['image'],
});
