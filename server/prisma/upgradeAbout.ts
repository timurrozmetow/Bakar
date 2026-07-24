import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { ABOUT_DEFAULT } from './content/about.js';

/**
 * Fills in the sections added to the «О нас» page without touching anything
 * already written by hand.
 *
 * The page grew from three text fields to an intro photo, a story, production
 * stages, principles and a gallery. Re-seeding would have wiped the whole
 * database, so this script only writes keys that are absent or empty — text the
 * client has edited survives untouched, and running it twice changes nothing.
 *
 *   npm run db:upgrade-about --prefix server
 */
const prisma = new PrismaClient();

type Block = Record<string, unknown>;

const isBlank = (v: unknown): boolean => {
  if (v === undefined || v === null || v === '') return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') {
    // A trilingual field counts as blank only when every language is empty.
    const values = Object.values(v as Record<string, unknown>);
    return values.length === 0 || values.every((x) => x === '' || x === undefined || x === null);
  }
  return false;
};

async function main() {
  const row = await prisma.setting.findUnique({ where: { key: 'about' } });
  const current: Block = (row?.value as Block | null) ?? {};
  const next: Block = { ...current };

  const added: string[] = [];
  const kept: string[] = [];

  for (const [key, fallback] of Object.entries(ABOUT_DEFAULT as Block)) {
    if (!isBlank(current[key])) {
      kept.push(key);
      continue;
    }
    // `image` and `gallery` ship empty on purpose — the plant photos are the
    // client's to add. Reporting them as "added" every run would be noise.
    if (isBlank(fallback)) {
      if (!(key in next)) next[key] = fallback;
      continue;
    }
    next[key] = fallback;
    added.push(key);
  }

  // `story` is nested, so its two halves are checked separately.
  const story = (current.story ?? {}) as Block;
  const storyDefault = (ABOUT_DEFAULT as Block).story as Block;
  if (!isBlank(current.story)) {
    next.story = {
      heading: isBlank(story.heading) ? storyDefault.heading : story.heading,
      body: isBlank(story.body) ? storyDefault.body : story.body,
    };
  }

  if (added.length === 0) {
    console.log('Все разделы «О нас» уже заполнены — ничего не менялось.');
    console.log(`  сохранено без изменений: ${kept.join(', ')}`);
    return;
  }

  await prisma.setting.upsert({
    where: { key: 'about' },
    create: { key: 'about', value: next as never },
    update: { value: next as never },
  });

  console.log(`Добавлены разделы: ${added.join(', ')}`);
  if (kept.length) console.log(`Оставлено как было: ${kept.join(', ')}`);
  console.log('\nФотографии завода загрузите в админке: Тексты страниц → Страница «О нас».');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
