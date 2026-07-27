import 'dotenv/config';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { PRODUCT_DESCRIPTIONS } from './content/descriptions.js';

/**
 * Attaches the real pasta packshots the client supplied — penne, burgu,
 * farfalle and vermicelli, each an 800 g pack — to the «Макароны» category.
 *
 * penne/burgu/farfalle already existed (as placeholders sharing the category
 * image, at a guessed 400 g); they are updated in place to the real 800 g pack
 * and photo, keeping their catalogue position. Vermicelli is new and appended.
 * rozhki and lingvini are left untouched — the client only asked to add what was
 * missing, not to remove anything.
 *
 * Idempotent: products are matched by slug, so re-running rewrites them in place
 * instead of creating duplicates.
 *
 *   npm run db:add-pasta --prefix server
 */
const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const t = (tm: string, ru: string, en: string) => ({ tm, ru, en });
const img = (name: string) => `/uploads/${name}`;

/** Each kind comes in a single 800 g pack with its own photo. */
const PRODUCTS = [
  { slug: 'penne', kind: 'penne', name: t('Penne', 'Пенне', 'Penne') },
  { slug: 'burgu', kind: 'burgu', name: t('Burgu', 'Бургу', 'Burgu') },
  { slug: 'farfalle', kind: 'farfalle', name: t('Farfalle', 'Фарфалле', 'Farfalle') },
  { slug: 'wermisel', kind: 'wermisel', name: t('Wermişel', 'Вермишель', 'Vermicelli') },
];

/** Copies the bundled pasta packshots into uploads/ so the images resolve. */
function copyAssets() {
  const src = path.join(__dirname, 'seed-assets');
  const dest = path.resolve(__dirname, '../uploads');
  mkdirSync(dest, { recursive: true });
  let copied = 0;
  for (const p of PRODUCTS) {
    const name = `pasta-${p.kind}-800.webp`;
    const from = path.join(src, name);
    if (existsSync(from)) {
      cpSync(from, path.join(dest, name));
      copied += 1;
    }
  }
  console.log(`  скопировано изображений: ${copied}`);
}

async function main() {
  const category = await prisma.category.findUnique({ where: { slug: 'makarony' } });
  if (!category) {
    console.error('Категория «makarony» не найдена — сначала создайте её в админке.');
    process.exitCode = 1;
    return;
  }

  copyAssets();

  // New products are appended after whatever already sits in the category, so
  // rozhki/lingvini keep their place and nothing collides on sortOrder.
  const agg = await prisma.product.aggregate({ where: { categoryId: category.id }, _max: { sortOrder: true } });
  let nextSort = (agg._max.sortOrder ?? -1) + 1;

  for (const p of PRODUCTS) {
    const photo = img(`pasta-${p.kind}-800.webp`);
    const variants = [{ weight: '800 г', image: photo, sortOrder: 0 }];
    const base = {
      categoryId: category.id,
      name: p.name,
      description: PRODUCT_DESCRIPTIONS[p.slug] ?? { tm: '', ru: '', en: '' },
      image: photo,
      isActive: true,
    };

    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      // Keep the existing sortOrder so the catalogue order does not jump around.
      await prisma.$transaction(async (tx) => {
        await tx.productVariant.deleteMany({ where: { productId: existing.id } });
        await tx.product.update({
          where: { id: existing.id },
          data: { ...base, variants: { create: variants } },
        });
      });
      console.log(`  обновлён  ${p.slug}  (800 г, своё фото)`);
    } else {
      await prisma.product.create({
        data: { ...base, slug: p.slug, sortOrder: nextSort++, variants: { create: variants } },
      });
      console.log(`  добавлен  ${p.slug}  (800 г, своё фото)`);
    }
  }

  const total = await prisma.product.count({ where: { categoryId: category.id } });
  console.log(`Готово. Товаров в категории «Макароны»: ${total}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
