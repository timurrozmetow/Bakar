import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env, isProd } from './lib/env.js';
import { apiRouter } from './routes/index.js';
import { imagesRouter } from './routes/images.js';
import { sitemapRouter } from './routes/sitemap.js';
import { errorHandler, notFound } from './middleware/error.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { UPLOAD_DIR } from './middleware/upload.js';
import { metaForPath, renderShell } from './lib/spa.js';
import { loadSiteData } from './lib/siteData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // correct client IPs behind a reverse proxy (rate limiting)

  app.use(
    helmet({
      // The SPA and uploaded media are served cross-origin in development.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: env.clientOrigin.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());

  // Original uploads + on-the-fly resized variants (srcset).
  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));
  app.use('/img', imagesRouter);

  app.get('/health', (_req, res) => res.json({ ok: true }));

  // Crawler files generated from the database.
  app.use('/', sitemapRouter);

  app.use('/api', apiLimiter, apiRouter);

  // ── Production: serve the built SPA with crawler-facing meta injected ──
  const indexFile = path.join(CLIENT_DIST, 'index.html');
  if (existsSync(indexFile)) {
    app.use(express.static(CLIENT_DIST, { index: false, maxAge: '1y' }));

    app.get('*', async (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/img')) {
        return next();
      }
      try {
        const html = readFileSync(indexFile, 'utf8');
        const [{ meta, jsonLd }, site] = await Promise.all([metaForPath(req.path), loadSiteData()]);
        // Open Graph needs absolute URLs; prefer the configured canonical origin
        // so a request arriving on another host still advertises the real one.
        const origin = (process.env.PUBLIC_SITE_URL ?? `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
        // The shell carries live content, so it must be revalidated every time.
        res.setHeader('Cache-Control', 'no-cache');
        res
          .type('html')
          .send(renderShell({ html, dist: CLIENT_DIST, pathname: req.path, origin, meta, jsonLd, site }));
      } catch (err) {
        next(err);
      }
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export { isProd };
