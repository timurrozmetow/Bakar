import { prisma } from '../lib/prisma.js';
import { crudRouter } from '../lib/crud.js';
import { certificateCreate, certificateUpdate } from '../validation.js';

export const certificatesRouter = crudRouter({
  model: prisma.certificate,
  createSchema: certificateCreate,
  updateSchema: certificateUpdate,
  orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  fileFields: ['image', 'fileUrl'],
});
