import { prisma } from './prisma.js';

/**
 * Everything the public site needs in one payload.
 *
 * Shared by two consumers on purpose:
 *  - `GET /api/public/site` for client-side navigation, and
 *  - the SPA shell, which inlines the very same object into the HTML so the
 *    first render needs no API round trip at all.
 * Keeping one function means the two can never drift apart.
 */
export async function loadSiteData() {
  const [banners, categories, certificates, reviews, settings] = await Promise.all([
    prisma.banner.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: {
        products: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          include: { variants: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    }),
    prisma.certificate.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }),
    prisma.review.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }),
    prisma.setting.findMany(),
  ]);

  const settingsMap: Record<string, unknown> = {};
  for (const s of settings) settingsMap[s.key] = s.value;

  return { banners, categories, certificates, reviews, settings: settingsMap };
}

export type SitePayload = Awaited<ReturnType<typeof loadSiteData>>;
