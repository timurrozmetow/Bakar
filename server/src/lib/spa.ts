import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { prisma } from './prisma.js';
import type { SitePayload } from './siteData.js';

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

const ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE,
  description: 'Производитель базовых продуктов питания. Halal, без ГМО, без глютена.',
  address: { '@type': 'PostalAddress', addressCountry: 'TM', addressLocality: 'Aşgabat' },
  areaServed: 'TM',
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

// ── Critical CSS ────────────────────────────────────────────────────────────
// The built stylesheet is one small file (~27 KB raw / ~7 KB gzipped). Left as
// a <link> it blocks the first paint for a whole extra round trip, so it is
// folded into the HTML instead.
//
// The cache is keyed by the stylesheet's hashed href, not merely filled once:
// if the process ever sees an index.html from a newer build, a href-blind cache
// would keep looking for a tag that is no longer there and silently stop
// inlining — the page would still render, just a round trip slower, with
// nothing to show for it in the logs.

const MAX_INLINE_CSS = 60 * 1024;
const LINK_TAG = /<link\b[^>]*>/gi;

let cssCache: { href: string; tag: string; css: string | null } | null = null;

function findStylesheetTag(html: string): { tag: string; href: string } | null {
  for (const tag of html.match(LINK_TAG) ?? []) {
    if (!/rel=["']stylesheet["']/i.test(tag)) continue;
    const href = /href=["']([^"']+)["']/i.exec(tag)?.[1];
    if (href?.startsWith('/')) return { tag, href };
  }
  return null;
}

function inlineCss(html: string, dist: string): string {
  const found = findStylesheetTag(html);
  if (!found) return html;

  if (cssCache?.href !== found.href) {
    const file = path.join(dist, found.href);
    let css: string | null = null;
    if (existsSync(file)) {
      const contents = readFileSync(file, 'utf8');
      if (contents.length <= MAX_INLINE_CSS) css = contents;
    }
    cssCache = { href: found.href, tag: found.tag, css };
  }

  if (!cssCache.css) return html;
  // A literal </style> cannot occur inside CSS, so no escaping is needed.
  return html.replace(cssCache.tag, `<style>${cssCache.css}</style>`);
}

// ── LCP preload ─────────────────────────────────────────────────────────────
// The hero image comes from data the client only learns about after its first
// API call, so without a hint the browser cannot start downloading it until JS
// has booted. This makes it discoverable in the initial HTML instead.
//
// One hint per screen band, and the bands are mutually exclusive on purpose.
// `<picture>` picks the first <source> whose media matches, so plain max-width
// queries are enough there. A preload link has no such precedence: every link
// whose media matches fires. With max-width-only queries a phone matched all
// four and downloaded the entire set — the opposite of the point.
//
// HERO_BANDS must stay in step with HERO_SOURCES in
// client/src/components/HeroImage.tsx; both resolve a band to the same file,
// so the preloaded image is the one <picture> then renders.

const IMG_WIDTHS = [320, 480, 640, 960, 1280, 1600];

const HERO_BANDS = [
  { field: 'imageSm', min: 0, max: 639 },
  { field: 'imageMd', min: 640, max: 1023 },
  { field: 'imageLg', min: 1024, max: 1439 },
  { field: 'image', min: 1440, max: Infinity },
] as const;

/** Builds `/img/...` srcset for an uploaded path, or null if it is not resizable. */
function resizableSrcSet(image: unknown): { href: string; srcset: string } | null {
  if (typeof image !== 'string' || !image.startsWith('/uploads/')) return null;
  const name = image.slice('/uploads/'.length);
  if (!/\.(webp|jpe?g|png|avif)$/i.test(name)) return null;
  return {
    href: `/img/${name}?w=1600`,
    srcset: IMG_WIDTHS.map((w) => `/img/${name}?w=${w} ${w}w`).join(', '),
  };
}

function bandMedia(min: number, max: number): string {
  if (min === 0 && max === Infinity) return '';
  if (min === 0) return `(max-width: ${max}px)`;
  if (max === Infinity) return `(min-width: ${min}px)`;
  return `(min-width: ${min}px) and (max-width: ${max}px)`;
}

function heroPreload(site: SitePayload): string {
  const banner = site.banners[0] as Record<string, unknown> | undefined;
  if (!banner) return '';

  const fallback = typeof banner.image === 'string' ? banner.image : '';

  // Resolve every band, then merge neighbours that landed on the same file, so
  // a banner carrying a single artwork emits one unconditional hint rather than
  // four that differ only in their media query.
  const groups: { file: string; min: number; max: number }[] = [];
  for (const band of HERO_BANDS) {
    const value = banner[band.field];
    const file = (typeof value === 'string' && value) || fallback;
    const last = groups[groups.length - 1];
    if (last && last.file === file) last.max = band.max;
    else groups.push({ file, min: band.min, max: band.max });
  }

  return groups
    .map(({ file, min, max }) => {
      const built = resizableSrcSet(file);
      if (!built) return '';
      const media = bandMedia(min, max);
      return (
        `<link rel="preload" as="image"${media ? ` media="${esc(media)}"` : ''}` +
        ` href="${esc(built.href)}" imagesrcset="${esc(built.srcset)}"` +
        ` imagesizes="100vw" fetchpriority="high" />`
      );
    })
    .filter(Boolean)
    .join('\n    ');
}

// ── Shell rendering ─────────────────────────────────────────────────────────

const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

/**
 * JSON safe to embed in a <script> block: `<` is escaped so a string in the
 * data can never close the tag, and the two separators that JSON allows raw
 * but JavaScript source does not are escaped as well.
 */
function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .split(LINE_SEPARATOR)
    .join('\\u2028')
    .split(PARAGRAPH_SEPARATOR)
    .join('\\u2029');
}

/**
 * Builds the HTML actually served to a visitor: per-route meta and structured
 * data for crawlers, the stylesheet inlined, an LCP preload hint, and the site
 * payload embedded so the first render does not wait on `/api/public/site`.
 */
export function renderShell(opts: {
  html: string;
  dist: string;
  pathname: string;
  origin: string;
  meta: Meta;
  jsonLd?: object;
  site: SitePayload;
}): string {
  const { dist, pathname, origin, meta, jsonLd, site } = opts;

  const tags = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE}" />`,
    // Absolute URLs: Facebook, Telegram and X do not resolve relative paths,
    // and none of them render an SVG preview — hence the PNG.
    `<meta property="og:url" content="${esc(origin + pathname)}" />`,
    `<meta property="og:image" content="${esc(origin)}/og-image.png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    pathname === '/' ? heroPreload(site) : '',
    `<script type="application/ld+json" data-seo="org">${safeJson(ORGANIZATION)}</script>`,
    // data-seo="route" is the handle the client updates on in-app navigation,
    // so page-specific structured data is replaced rather than duplicated.
    jsonLd ? `<script type="application/ld+json" data-seo="route">${safeJson(jsonLd)}</script>` : '',
    `<script>window.__BAKAR_SITE__=${safeJson(site)}</script>`,
  ]
    .filter(Boolean)
    .join('\n    ');

  // Drop the build-time title/description, then append ours before </head>.
  const html = inlineCss(opts.html, dist)
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name="description"[^>]*>/i, '');

  return html.replace('</head>', `    ${tags}\n  </head>`);
}
