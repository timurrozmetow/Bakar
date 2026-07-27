import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PRODUCT_DESCRIPTIONS } from './content/descriptions.js';

/**
 * Fills in product descriptions without touching anything already written.
 *
 * Most products were seeded with an empty `description`, so their catalogue
 * cards showed only a name. This writes a trilingual description for each
 * product that still has none, matched by slug. A description edited in the
 * admin is left alone, and running the script twice changes nothing.
 *
 *   npm run db:upgrade-descriptions --prefix server
 */
const prisma = new PrismaClient();

type I18n = { tm?: string; ru?: string; en?: string } | null | undefined;

const isBlank = (v: I18n): boolean => {
  if (!v || typeof v !== 'object') return true;
  return ['tm', 'ru', 'en'].every((k) => {
    const s = (v as Record<string, unknown>)[k];
    return s === undefined || s === null || s === '';
  });
};

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, slug: true, description: true } });

  const added: string[] = [];
  const kept: string[] = [];
  const missing: string[] = [];

  for (const p of products) {
    if (!isBlank(p.description as I18n)) {
      kept.push(p.slug);
      continue;
    }
    const desc = PRODUCT_DESCRIPTIONS[p.slug];
    if (!desc) {
      missing.push(p.slug);
      continue;
    }
    await prisma.product.update({ where: { id: p.id }, data: { description: desc } });
    added.push(p.slug);
  }

  if (added.length === 0) {
    console.log('Все описания уже заполнены — ничего не менялось.');
  } else {
    console.log(`Добавлены описания (${added.length}): ${added.join(', ')}`);
  }
  if (kept.length) console.log(`Оставлены как были (${kept.length}): ${kept.join(', ')}`);
  if (missing.length) console.log(`Без описания в словаре (${missing.length}): ${missing.join(', ')}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
