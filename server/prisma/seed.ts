import { cpSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import { env } from '../src/lib/env.js';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/// trilingual helper
const t = (tm: string, ru: string, en: string) => ({ tm, ru, en });

// Copy bundled seed images into the uploads folder so content renders immediately.
function copySeedAssets() {
  const src = path.join(__dirname, 'seed-assets');
  const dest = path.resolve(__dirname, '../uploads');
  mkdirSync(dest, { recursive: true });
  try {
    for (const f of readdirSync(src)) cpSync(path.join(src, f), path.join(dest, f));
    console.log('  ✓ seed images copied to uploads/');
  } catch {
    console.warn('  ! seed-assets not found, skipping image copy');
  }
}
const img = (name: string) => `/uploads/${name}`;

const CATEGORIES = [
  {
    slug: 'krupy',
    name: t('Ýarma', 'Крупы', 'Grains'),
    tagline: t(
      'Irmik, bulgur, greçka, nohut — her gün üçin saýlanan däne.',
      'Ирмик, булгур, гречка, нохут — отборное зерно для каждого дня.',
      'Semolina, bulgur, buckwheat, chickpeas — choice grain for every day.',
    ),
    description: t(
      'Saýlanan däneli önümler: arassalanan, kalibrlenen we hil barlagyndan geçen.',
      'Отборные крупы: очищенные, откалиброванные и прошедшие контроль качества.',
      'Choice grains: cleaned, calibrated and quality-checked.',
    ),
    image: img('packs-grains.jpg'),
    hero: img('o-grains.jpg'),
    products: [
      { slug: 'irmik', name: t('Irmik', 'Ирмик', 'Semolina'), weights: ['1 кг'] },
      { slug: 'bulgur', name: t('Koftelik bulgur', 'Булгур', 'Bulgur'), weights: ['1 кг'] },
      { slug: 'grechka', name: t('Greçka', 'Гречка', 'Buckwheat'), weights: ['1 кг'] },
      { slug: 'nohut', name: t('Nohut', 'Нохут', 'Chickpeas'), weights: ['1 кг'] },
    ],
  },
  {
    slug: 'makarony',
    name: t('Makaron', 'Макароны', 'Pasta'),
    tagline: t(
      'Penne, burgu, farfalle, linguine. 10 minutda taýýar.',
      'Пенне, бургу, фарфалле, лингвини. Готово за 10 минут.',
      'Penne, burgu, farfalle, linguine. Ready in 10 minutes.',
    ),
    description: t(
      'Berk bugdaýdan ýasalan makaron — bişende görnüşini saklaýar.',
      'Макароны из твёрдых сортов пшеницы — держат форму при варке.',
      'Durum-wheat pasta — holds its shape when cooked.',
    ),
    image: img('packs-pasta.jpg'),
    hero: img('o-pasta.jpg'),
    products: [
      { slug: 'penne', name: t('Penne', 'Пенне', 'Penne'), weights: ['400 г'] },
      { slug: 'burgu', name: t('Burgu', 'Бургу', 'Burgu'), weights: ['400 г'] },
      { slug: 'farfalle', name: t('Farfalle', 'Фарфалле', 'Farfalle'), weights: ['400 г'] },
      { slug: 'rozhki', name: t('Dirsek', 'Рожки', 'Elbow macaroni'), weights: ['400 г'] },
      { slug: 'lingvini', name: t('Linguine', 'Лингвини', 'Linguine'), weights: ['400 г'] },
    ],
  },
  {
    slug: 'bobovye',
    name: t('Kösükliler', 'Бобовые', 'Legumes'),
    tagline: t(
      'Merjimek we noýba — ösümlik belogynyň çeşmesi.',
      'Чечевица и фасоль — источник растительного белка.',
      'Lentils and beans — a source of plant protein.',
    ),
    description: t(
      'Kösükli önümler: arassa, saýlanan we ýokary belokly.',
      'Бобовые: чистые, отборные, с высоким содержанием белка.',
      'Legumes: clean, choice, high in protein.',
    ),
    image: img('packs-legumes.jpg'),
    hero: img('o-legumes.jpg'),
    products: [
      { slug: 'krasnaya-chechevitsa', name: t('Gyzyl merjimek', 'Красная чечевица', 'Red lentils'), weights: ['1 кг'] },
      { slug: 'zelenaya-chechevitsa', name: t('Ýaşyl merjimek', 'Зелёная чечевица', 'Green lentils'), weights: ['1 кг'] },
      { slug: 'krasnaya-fasol', name: t('Gyzyl noýba', 'Красная фасоль', 'Red beans'), weights: ['1 кг'] },
      { slug: 'belaya-fasol', name: t('Ak noýba', 'Белая фасоль', 'White beans'), weights: ['1 кг'] },
    ],
  },
  {
    slug: 'ris',
    name: t('Tüwi', 'Рис', 'Rice'),
    tagline: t(
      'Uzyn däneli, baldo, osmançik — 500 g-dan 5 kg-a çenli.',
      'Длиннозёрный, балдо, османчик — от 500 г до 5 кг.',
      'Long-grain, baldo, osmancik — from 500 g to 5 kg.',
    ),
    description: t(
      'Dürli görnüşli tüwi — her tagam üçin.',
      'Рис разных сортов — под любое блюдо.',
      'Rice in several varieties — for any dish.',
    ),
    image: img('packs-rice.jpg'),
    hero: img('o-rice.jpg'),
    products: [
      { slug: 'dlinnozernyy', name: t('Uzyn däneli tüwi', 'Длиннозёрный', 'Long-grain rice'), weights: ['500 г', '1 кг'] },
      { slug: 'baldo', name: t('Baldo pirinç', 'Балдо', 'Baldo rice'), weights: ['1 кг'] },
      { slug: 'osmanchik', name: t('Osmançik pirinç', 'Османчик', 'Osmancik rice'), weights: ['1 кг', '5 кг'] },
    ],
  },
  {
    slug: 'hlopya',
    name: t('Gerkules', 'Хлопья', 'Flakes'),
    tagline: t(
      'Bütin däneden «Gerkules» süle perşenkleri.',
      'Овсяные хлопья «Геркулес» из цельного зерна.',
      '"Gerkules" oat flakes from whole grain.',
    ),
    description: t(
      'Ertirlik üçin süle perşenkleri — ýönekeý we peýdaly.',
      'Овсяные хлопья на завтрак — просто и полезно.',
      'Oat flakes for breakfast — simple and wholesome.',
    ),
    image: img('pack-oats.jpg'),
    hero: img('o-oats.jpg'),
    products: [
      { slug: 'gerkules', name: t('Gerkules', 'Овсяные хлопья «Геркулес»', 'Rolled oats "Gerkules"'), weights: ['400 г', '500 г'] },
    ],
  },
  {
    slug: 'semechki',
    name: t('Günebakar çigidi', 'Семечки', 'Sunflower seeds'),
    tagline: t(
      'Gowrulan günebakar çigidi — duzly we duzsuz.',
      'Жареные подсолнечные семечки — солёные и несолёные.',
      'Roasted sunflower seeds — salted and unsalted.',
    ),
    description: t(
      'Saýlanan günebakar çigidi, gowrulan we gaplanan.',
      'Отборные подсолнечные семечки — жареные и упакованные.',
      'Choice sunflower seeds — roasted and packed.',
    ),
    image: img('packs-seeds.jpg'),
    hero: img('o-seeds.jpg'),
    products: [
      { slug: 'nesolenye', name: t('Duzsuz', 'Несолёные', 'Unsalted'), weights: ['150 г', '5 кг'] },
      { slug: 'solenye', name: t('Duzly', 'Солёные', 'Salted'), weights: ['150 г'] },
    ],
  },
];

const CERTIFICATES = [
  { title: t('Halal', 'Халяль', 'Halal'), description: t('Halal standartyna laýyklyk.', 'Соответствие стандарту халяль.', 'Compliant with the halal standard.') },
  { title: t('Non-GMO', 'Без ГМО', 'Non-GMO'), description: t('Genetiki üýtgedilmedik önümler.', 'Продукция без ГМО.', 'Products without GMO.') },
  { title: t('Gluten-free', 'Без глютена', 'Gluten-free'), description: t('Glýutensiz önümler topary.', 'Линейка продуктов без глютена.', 'A range of gluten-free products.') },
  { title: t('Ýokary hilli', 'Сертификат качества', 'Quality certificate'), description: t('Hil dolandyryş ulgamy.', 'Система контроля качества.', 'Quality management system.') },
];

const REVIEWS = [
  {
    text: t(
      '«Bakar ýarmasy hemişe arassa we deň — her hepde alýaryn».',
      '«Крупы Bakar всегда чистые и ровные — беру каждую неделю».',
      '"Bakar grains are always clean and even — I buy them every week".',
    ),
    author: 'Огулджерен',
    role: t('alyjy', 'покупатель', 'customer'),
    city: 'Aşgabat',
  },
  {
    text: t(
      '«Durnukly hil we amatly gaplama — haryt saklanyp galmaýar».',
      '«Стабильное качество и удобная фасовка — товар не залёживается».',
      '"Consistent quality and convenient packaging — the product does not sit on the shelf".',
    ),
    author: 'Магазин «Berk»',
    role: t('bölek satuw', 'розница', 'retail'),
    city: 'Mary',
  },
  {
    text: t(
      '«Bakar bilen distribýutor hökmünde işleýäris — üpjünçilik bökdençsiz».',
      '«Работаем с Bakar как с дистрибьютором — поставки без срывов».',
      '"We work with Bakar as a distributor — supply without disruptions".',
    ),
    author: 'ХБ «Ак ýol»',
    role: t('hyzmatdaş', 'партнёр', 'partner'),
    city: 'Türkmenabat',
  },
];

async function main() {
  copySeedAssets();

  // ── Admin user ──────────────────────────────────────────────
  const passwordHash = await argon2.hash(env.adminPassword);
  await prisma.user.upsert({
    where: { email: env.adminEmail },
    update: { passwordHash, name: env.adminName },
    create: { email: env.adminEmail, passwordHash, name: env.adminName },
  });
  console.log(`  ✓ admin: ${env.adminEmail} / ${env.adminPassword}`);

  // Clean content tables for a repeatable seed.
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.review.deleteMany();
  await prisma.setting.deleteMany();

  // ── Categories + products + banners ─────────────────────────
  let bannerOrder = 0;
  for (let ci = 0; ci < CATEGORIES.length; ci++) {
    const c = CATEGORIES[ci];
    const category = await prisma.category.create({
      data: {
        slug: c.slug,
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        image: c.image,
        sortOrder: ci,
      },
    });

    for (let pi = 0; pi < c.products.length; pi++) {
      const p = c.products[pi];
      await prisma.product.create({
        data: {
          categoryId: category.id,
          slug: p.slug,
          name: p.name,
          description: { tm: '', ru: '', en: '' },
          image: c.image,
          sortOrder: pi,
          variants: { create: p.weights.map((w, i) => ({ weight: w, sortOrder: i })) },
        },
      });
    }

    // Hero banner per category.
    await prisma.banner.create({
      data: {
        title: c.name,
        subtitle: c.tagline,
        ctaLabel: t('Önümleri görmek', 'Смотреть продукцию', 'View products'),
        ctaHref: '#products',
        image: c.hero,
        sortOrder: bannerOrder++,
      },
    });
  }
  console.log(`  ✓ ${CATEGORIES.length} categories, products & banners`);

  // ── Certificates ────────────────────────────────────────────
  for (let i = 0; i < CERTIFICATES.length; i++) {
    await prisma.certificate.create({ data: { ...CERTIFICATES[i], sortOrder: i } });
  }
  console.log(`  ✓ ${CERTIFICATES.length} certificates`);

  // ── Reviews ─────────────────────────────────────────────────
  for (let i = 0; i < REVIEWS.length; i++) {
    await prisma.review.create({ data: { ...REVIEWS[i], sortOrder: i } });
  }
  console.log(`  ✓ ${REVIEWS.length} reviews`);

  // ── Settings (singleton content blocks) ─────────────────────
  const settings: Record<string, unknown> = {
    home_hero: {
      headline: t('Ýönekeý önümler, ak ýürekden.', 'Простые продукты, сделанные добросовестно.', 'Simple products, made in good faith.'),
    },
    home_stats: [
      { value: '6', label: t('önüm kategoriýasy', 'категорий продукции', 'product categories') },
      { value: '25+', label: t('önüm ady', 'наименований', 'product items') },
      { value: '3', label: t('hil şahadatnamasy', 'сертификата качества', 'quality certificates') },
      { value: '100%', label: t('hil gözegçiligi', 'контроль качества', 'quality control') },
    ],
    about: {
      heading: t('Biz hakda', 'О нас', 'About us'),
      lead: t(
        'Ýönekeý önümler, ak ýürekden.',
        'Простые продукты, сделанные добросовестно.',
        'Simple products, made in good faith.',
      ),
      body: t(
        'Meýdandan gaplama çenli: her tapgyr arassalaýyşdan, kalibrlemeden we hil barlagyndan geçýär.',
        'От поля до упаковки: каждая партия проходит очистку, калибровку и контроль качества.',
        'From field to package: each batch is cleaned, calibrated and quality-checked.',
      ),
    },
    contacts: {
      address: t('Türkmenistan, Aşgabat', 'Туркменистан, Ашхабад', 'Turkmenistan, Ashgabat'),
      phone: '+993 12 000000',
      email: 'info@bakar.tm',
      hours: t('Duş–Anna, 9:00–18:00', 'Пн–Пт, 9:00–18:00', 'Mon–Fri, 9:00–18:00'),
      instagram: '',
      telegram: '',
    },
    // Trilingual: the strip re-renders when the visitor switches language.
    // "BAKAR" is the brand and stays the same in all three.
    marquee: {
      words: [
        t('BAKAR', 'BAKAR', 'BAKAR'),
        t('ýokary hilli', 'высокое качество', 'high quality'),
        t('Halal', 'Халяль', 'Halal'),
        t('GMO-syz', 'без ГМО', 'Non-GMO'),
        t('Glýutensiz', 'без глютена', 'Gluten-free'),
        t('Türkmenistan', 'Туркменистан', 'Turkmenistan'),
      ],
    },
    footer: {
      lead: t(
        'Ýönekeý, ynamdar önümler — türkmen supralary üçin.',
        'Простые, надёжные продукты — для туркменского стола.',
        'Simple, reliable products — for the Turkmen table.',
      ),
    },
    partner_cta: {
      heading: t('Hyzmatdaşlara', 'Партнёрам', 'For partners'),
      body: t(
        'Dükanlary, ulgamlary we distribýutorlary hyzmatdaşlyga çagyrýarys.',
        'Приглашаем магазины, сети и дистрибьюторов к сотрудничеству.',
        'We invite shops, chains and distributors to cooperate.',
      ),
    },
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.create({ data: { key, value: value as object } });
  }
  console.log(`  ✓ ${Object.keys(settings).length} settings blocks`);

  console.log('\n  Seed complete.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
