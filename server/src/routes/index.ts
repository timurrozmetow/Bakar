import { Router } from 'express';
import { authRouter } from './auth.js';
import { uploadsRouter } from './uploads.js';
import { bannersRouter } from './banners.js';
import { categoriesRouter } from './categories.js';
import { productsRouter } from './products.js';
import { certificatesRouter } from './certificates.js';
import { reviewsRouter } from './reviews.js';
import { partnerRequestsRouter } from './partnerRequests.js';
import { settingsRouter } from './settings.js';
import { publicRouter } from './public.js';

export const apiRouter = Router();

// Public (no auth)
apiRouter.use('/public', publicRouter);

// Auth
apiRouter.use('/auth', authRouter);

// Admin (each router applies requireAuth internally)
apiRouter.use('/uploads', uploadsRouter);
apiRouter.use('/banners', bannersRouter);
apiRouter.use('/categories', categoriesRouter);
apiRouter.use('/products', productsRouter);
apiRouter.use('/certificates', certificatesRouter);
apiRouter.use('/reviews', reviewsRouter);
apiRouter.use('/partner-requests', partnerRequestsRouter);
apiRouter.use('/settings', settingsRouter);
