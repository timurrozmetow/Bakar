import 'dotenv/config';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { PRODUCT_DESCRIPTIONS } from './content/descriptions.js';

/**
 * Fills the «Рис» category with the three varieties the client supplied photos
 * for — baldo, basmati and osmanchik — each in 500 g / 1 kg / 5 kg with its own
 * packshot.
 *
 * Idempotent: products are matched by slug, so re-running rewrites them in place
 * instead of creating duplicates. The placeholder `dlinnozernyy` seeded earlier
 * is superseded by `basmati` (basmati is a long-grain rice) and removed.
 *
 *   npm run db:add-rice --prefix server
 */
const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const t = (tm: string, ru: string, en: string) => ({ tm, ru, en });
const img = (name: string) => `/uploads/${name}`;

/** Every variety ships the same three sizes, each with its own photo. */
const packs = (kind: string) => [
  { weight: '500 г', image: img(`rice-${kind}-500.webp`) },
  { weight: '1 кг', image: img(`rice-${kind}-1kg.webp`) },
  { weight: '5 кг', image: img(`rice-${kind}-5kg.webp`) },
];

const PRODUCTS = [
  { slug: 'baldo', kind: 'baldo', name: t('Baldo tüwi', 'Рис балдо', 'Baldo rice') },
  { slug: 'basmati', kind: 'basmati', name: t('Basmati tüwi', 'Рис басмати', 'Basmati rice') },
  { slug: 'osmanchik', kind: 'osmanchik', name: t('Osmançik tüwi', 'Рис османчик', 'Osmancik rice') },
];

/** Copies the bundled rice packshots into uploads/ so the images resolve. */
function copyAssets() {
  const src = path.join(__dirname, 'seed-assets');
  const dest = path.resolve(__dirname, '../uploads');
  mkdirSync(dest, { recursive: true });
  let copied = 0;
  for (const p of PRODUCTS) {
    for (const size of ['500', '1kg', '5kg']) {
      const name = `rice-${p.kind}-${size}.webp`;
      const from = path.join(src, name);
      if (existsSync(from)) {
        cpSync(from, path.join(dest, name));
        copied += 1;
      }
    }
  }
  console.log(`  скопировано изображений: ${copied}`);
}

async function main() {
  const category = await prisma.category.findUnique({ where: { slug: 'ris' } });
  if (!category) {
    console.error('Категория «ris» не найдена — сначала создайте её в админке.');
    process.exitCode = 1;
    return;
  }

  copyAssets();

  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    const variants = packs(p.kind);
    const data = {
      categoryId: category.id,
      name: p.name,
      description: PRODUCT_DESCRIPTIONS[p.slug] ?? { tm: '', ru: '', en: '' },
      // The 1 kg pack is the catalogue face of each variety.
      image: img(`rice-${p.kind}-1kg.webp`),
      sortOrder: i,
      isActive: true,
    };

    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      await prisma.$transaction(async (tx) => {
        await tx.productVariant.deleteMany({ where: { productId: existing.id } });
        await tx.product.update({
          where: { id: existing.id },
          data: { ...data, variants: { create: variants.map((v, j) => ({ ...v, sortOrder: j })) } },
        });
      });
      console.log(`  обновлён  ${p.slug}  (${variants.length} фасовок)`);
    } else {
      await prisma.product.create({
        data: { ...data, slug: p.slug, variants: { create: variants.map((v, j) => ({ ...v, sortOrder: j })) } },
      });
      console.log(`  добавлен  ${p.slug}  (${variants.length} фасовок)`);
    }
  }

  // The длиннозёрный placeholder is superseded by basmati above.
  const stale = await prisma.product.findMany({
    where: { categoryId: category.id, slug: { in: ['dlinnozernyy'] } },
  });
  for (const s of stale) {
    await prisma.product.delete({ where: { id: s.id } });
    console.log(`  удалён устаревший  ${s.slug}`);
  }

  const total = await prisma.product.count({ where: { categoryId: category.id } });
  console.log(`Готово. Товаров в категории «Рис»: ${total}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
