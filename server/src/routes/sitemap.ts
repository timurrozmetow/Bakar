import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/error.js';

export const sitemapRouter = Router();

const STATIC_PATHS: { path: string; priority: string; changefreq: string }[] = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/products', priority: '0.9', changefreq: 'weekly' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/certificates', priority: '0.7', changefreq: 'monthly' },
  { path: '/contacts', priority: '0.8', changefreq: 'monthly' },
];

function baseUrl(req: { protocol: string; get: (h: string) => string | undefined }): string {
  const configured = process.env.PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');
  return `${req.protocol}://${req.get('host') ?? 'localhost'}`;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// GET /sitemap.xml — static routes plus every active product.
sitemapRouter.get(
  '/sitemap.xml',
  asyncHandler(async (req, res) => {
    const base = baseUrl(req);
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: { sortOrder: 'asc' },
    });

    const entries = [
      ...STATIC_PATHS.map(
        (p) =>
          `  <url>\n    <loc>${esc(base + p.path)}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
      ),
      ...products.map(
        (p) =>
          `  <url>\n    <loc>${esc(`${base}/products/${p.slug}`)}</loc>\n    <lastmod>${p.updatedAt.toISOString().slice(0, 10)}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`,
      ),
    ];

    res.type('application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`);
  }),
);

// GET /robots.txt — points crawlers at the dynamic sitemap.
sitemapRouter.get('/robots.txt', (req, res) => {
  const base = baseUrl(req);
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${base}/sitemap.xml\n`);
});
