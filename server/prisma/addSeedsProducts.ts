import 'dotenv/config';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

/**
 * Fills the «Семечки» category with the three roast levels and their packaging.
 *
 * Idempotent: products are matched by slug, so re-running updates them in place
 * instead of creating duplicates. Packaging is rewritten wholesale each run,
 * which is what makes the script safe to use as the source of truth for these
 * three items.
 *
 *   npm run db:add-seeds --prefix server
 */
const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const t = (tm: string, ru: string, en: string) => ({ tm, ru, en });
const img = (name: string) => `/uploads/${name}`;

/**
 * Packaging is the same for all three kinds; only some sizes have their own
 * photo. 50 g and 100 g were not supplied, and the single 5 kg photo is printed
 * "duzsuz" — so it is attached to the unsalted product only, rather than shown
 * under a salted one where it would contradict the label. Sizes without a photo
 * simply keep the product image.
 */
const packs = (kind: string) => [
  { weight: '50 г', image: '' },
  { weight: '100 г', image: '' },
  { weight: '150 г', image: img(`seeds-${kind}-150.webp`) },
  { weight: '200 г', image: img(`seeds-${kind}-200.webp`) },
  { weight: '5 кг', image: kind === 'unsalted' ? img('seeds-bulk-5kg.webp') : '' },
];

const PRODUCTS = [
  {
    slug: 'semechki-solenye',
    kind: 'salted',
    name: t('Duzly çigit', 'Солёные семечки', 'Salted sunflower seeds'),
    description: t(
      'Gowrulan günebakar çigidi, doly duzlanan — güýçli tagam üçin.',
      'Жареные подсолнечные семечки с полной степенью посола — для насыщенного вкуса.',
      'Roasted sunflower seeds, fully salted — for a rich flavour.',
    ),
  },
  {
    slug: 'semechki-slabosolenye',
    kind: 'lightly-salted',
    name: t('Az duzly çigit', 'Слабосолёные семечки', 'Lightly salted sunflower seeds'),
    description: t(
      'Gowrulan günebakar çigidi, ýeňil duzlanan — çigidiň öz tagamy saklanýar.',
      'Жареные подсолнечные семечки лёгкого посола — вкус самого ядра остаётся на первом плане.',
      'Roasted sunflower seeds, lightly salted — the kernel’s own taste stays in front.',
    ),
  },
  {
    slug: 'semechki-nesolenye',
    kind: 'unsalted',
    name: t('Duzsuz çigit', 'Несолёные семечки', 'Unsalted sunflower seeds'),
    description: t(
      'Gowrulan günebakar çigidi, duzsuz — arassa tagam we duz goşulmadyk düzüm.',
      'Жареные подсолнечные семечки без соли — чистый вкус и состав без добавок.',
      'Roasted sunflower seeds, unsalted — clean taste, nothing added.',
    ),
  },
];

/** Copies the bundled packshots into uploads/ so the images resolve. */
function copyAssets() {
  const src = path.join(__dirname, 'seed-assets');
  const dest = path.resolve(__dirname, '../uploads');
  mkdirSync(dest, { recursive: true });
  let copied = 0;
  for (const p of PRODUCTS) {
    for (const name of [`seeds-${p.kind}-150.webp`, `seeds-${p.kind}-200.webp`]) {
      const from = path.join(src, name);
      if (existsSync(from)) {
        cpSync(from, path.join(dest, name));
        copied += 1;
      }
    }
  }
  const bulk = path.join(src, 'seeds-bulk-5kg.webp');
  if (existsSync(bulk)) {
    cpSync(bulk, path.join(dest, 'seeds-bulk-5kg.webp'));
    copied += 1;
  }
  console.log(`  скопировано изображений: ${copied}`);
}

async function main() {
  const category = await prisma.category.findUnique({ where: { slug: 'semechki' } });
  if (!category) {
    console.error('Категория «semechki» не найдена — сначала создайте её в админке.');
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
      description: p.description,
      // The 200 g pack is the catalogue face of each kind.
      image: img(`seeds-${p.kind}-200.webp`),
      sortOrder: i,
      isActive: true,
    };

    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      await prisma.$transaction(async (tx) => {
        await tx.productVariant.deleteMany({ where: { productId: existing.id } });
        await tx.product.update({
          where: { id: existing.id },
          data: {
            ...data,
            variants: { create: variants.map((v, j) => ({ ...v, sortOrder: j })) },
          },
        });
      });
      console.log(`  обновлён  ${p.slug}  (${variants.length} фасовок)`);
    } else {
      await prisma.product.create({
        data: {
          ...data,
          slug: p.slug,
          variants: { create: variants.map((v, j) => ({ ...v, sortOrder: j })) },
        },
      });
      console.log(`  добавлен  ${p.slug}  (${variants.length} фасовок)`);
    }
  }

  // The two placeholder products seeded earlier are superseded by the three above.
  const stale = await prisma.product.findMany({
    where: { categoryId: category.id, slug: { in: ['solenye', 'nesolenye'] } },
  });
  for (const s of stale) {
    await prisma.product.delete({ where: { id: s.id } });
    console.log(`  удалён устаревший  ${s.slug}`);
  }

  const total = await prisma.product.count({ where: { categoryId: category.id } });
  console.log(`Готово. Товаров в категории «Семечки»: ${total}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
