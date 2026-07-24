import { prisma } from '../lib/prisma.js';
import { crudRouter } from '../lib/crud.js';
import { bannerCreate, bannerUpdate } from '../validation.js';

export const bannersRouter = crudRouter({
  model: prisma.banner,
  createSchema: bannerCreate,
  updateSchema: bannerUpdate,
  orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  // All four so replaced or deleted artwork is cleaned off disk, not just the
  // large-screen one.
  fileFields: ['image', 'imageSm', 'imageMd', 'imageLg'],
});
