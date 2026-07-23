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

/** First non-empty translation, preferring Russian. */
function pickRu(value: unknown): string {
  if (value && typeof value === 'object') {
    const v = value as Record<string, string>;
    return (v.ru || v.en || v.tm || '').trim();
  }
  return '';
}

// GET /llms.txt — a Markdown map of the site for language models.
// Without this route the SPA catch-all answered with HTML, which has neither an
// H1 nor Markdown links, so the file failed validation. See llmstxt.org.
sitemapRouter.get(
  '/llms.txt',
  asyncHandler(async (req, res) => {
    const base = baseUrl(req);
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: {
        products: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        },
      },
    });

    const lines = [
      '# BAKAR',
      '',
      '> Туркменский производитель базовых продуктов питания: крупы, макароны, бобовые,',
      '> рис, хлопья и семечки. Halal, без ГМО, без глютена. Сайт доступен на туркменском,',
      '> русском и английском языках.',
      '',
      '## Разделы',
      '',
      `- [Главная](${base}/): баннеры, ассортимент, отзывы и сертификаты`,
      `- [Продукция](${base}/products): полный каталог по категориям`,
      `- [О нас](${base}/about): производство от поля до упаковки`,
      `- [Сертификаты](${base}/certificates): Halal, Non-GMO, gluten-free и контроль качества`,
      `- [Контакты](${base}/contacts): адрес, телефон и заявка на сотрудничество`,
      '',
    ];

    for (const category of categories) {
      const name = pickRu(category.name) || `Категория ${category.id}`;
      lines.push(`## ${name}`, '');
      const tagline = pickRu(category.tagline);
      if (tagline) lines.push(`${tagline}`, '');
      for (const product of category.products) {
        const title = pickRu(product.name) || product.slug;
        const summary = pickRu(product.description).replace(/\s+/g, ' ').slice(0, 160);
        lines.push(`- [${title}](${base}/products/${product.slug})${summary ? `: ${summary}` : ''}`);
      }
      lines.push('');
    }

    lines.push('## Дополнительно', '', `- [Карта сайта](${base}/sitemap.xml): все адреса в формате XML`, '');

    res.type('text/plain; charset=utf-8');
    res.send(lines.join('\n'));
  }),
);
