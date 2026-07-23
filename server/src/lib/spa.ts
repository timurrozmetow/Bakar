import { prisma } from './prisma.js';

interface Meta {
  title: string;
  description: string;
}

const SITE = 'BAKAR';

const STATIC_META: Record<string, Meta> = {
  '/': {
    title: 'BAKAR — простые продукты, сделанные добросовестно',
    description:
      'Крупы, макароны, бобовые, рис, хлопья и семечки. Halal, без ГМО, без глютена. Туркменистан.',
  },
  '/products': {
    title: 'Продукция — BAKAR',
    description: 'Шесть категорий базовых продуктов: крупы, макароны, бобовые, рис, хлопья, семечки.',
  },
  '/about': {
    title: 'О нас — BAKAR',
    description: 'От поля до упаковки: очистка, калибровка и контроль качества.',
  },
  '/certificates': {
    title: 'Сертификаты — BAKAR',
    description: 'Сертификаты Halal, без ГМО, без глютена и контроля качества.',
  },
  '/contacts': {
    title: 'Контакты — BAKAR',
    description: 'Сотрудничество для магазинов, сетей и дистрибьюторов.',
  },
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function pickRu(value: unknown): string {
  if (value && typeof value === 'object' && 'ru' in (value as Record<string, unknown>)) {
    const v = value as Record<string, string>;
    return v.ru || v.en || v.tm || '';
  }
  return '';
}

/** Resolves crawler-facing metadata (and structured data) for a site path. */
export async function metaForPath(pathname: string): Promise<{ meta: Meta; jsonLd?: object }> {
  const productMatch = /^\/products\/([a-z0-9-]+)\/?$/.exec(pathname);
  if (productMatch) {
    const product = await prisma.product.findFirst({
      where: { slug: productMatch[1], isActive: true },
      include: { category: true, variants: true },
    });
    if (product) {
      const name = pickRu(product.name);
      const category = pickRu(product.category.name);
      const description = pickRu(product.description) || `${name} — ${category} BAKAR. Halal, без ГМО.`;
      return {
        meta: { title: `${name} — ${SITE}`, description },
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name,
          description,
          category,
          brand: { '@type': 'Brand', name: SITE },
        },
      };
    }
  }

  const clean = pathname.replace(/\/$/, '') || '/';
  return { meta: STATIC_META[clean] ?? STATIC_META['/'] };
}

/** Injects title/description/OG tags (and optional JSON-LD) into the built index.html. */
export function injectMeta(html: string, meta: Meta, jsonLd?: object): string {
  const tags = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE}" />`,
    jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : '',
  ]
    .filter(Boolean)
    .join('\n    ');

  // Replace the build-time title, then append the rest before </head>.
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name="description"[^>]*>/i, '')
    .replace('</head>', `    ${tags}\n  </head>`);
}
