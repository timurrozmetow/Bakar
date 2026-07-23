import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

/**
 * One-off, idempotent upgrade of the `marquee` setting.
 *
 * The strip used to store bare strings, so a Russian visitor saw Turkmen words.
 * Each word becomes {tm, ru, en}. Words the table below knows are translated;
 * anything else is copied into all three languages so nothing is ever lost —
 * the admin can then edit it in Тексты страниц → Бегущая строка.
 *
 * Safe to run more than once: entries already in the new shape are left alone.
 *
 *   npm run db:upgrade-marquee --prefix server
 */
const prisma = new PrismaClient();

const KNOWN: Record<string, { tm: string; ru: string; en: string }> = {
  bakar: { tm: 'BAKAR', ru: 'BAKAR', en: 'BAKAR' },
  'ýokary hilli': { tm: 'ýokary hilli', ru: 'высокое качество', en: 'high quality' },
  halal: { tm: 'Halal', ru: 'Халяль', en: 'Halal' },
  'non-gmo': { tm: 'GMO-syz', ru: 'без ГМО', en: 'Non-GMO' },
  'gmo-syz': { tm: 'GMO-syz', ru: 'без ГМО', en: 'Non-GMO' },
  'gluten-free': { tm: 'Glýutensiz', ru: 'без глютена', en: 'Gluten-free' },
  glýutensiz: { tm: 'Glýutensiz', ru: 'без глютена', en: 'Gluten-free' },
  türkmenistan: { tm: 'Türkmenistan', ru: 'Туркменистан', en: 'Turkmenistan' },
};

async function main() {
  const row = await prisma.setting.findUnique({ where: { key: 'marquee' } });
  if (!row) {
    console.log('Настройки «marquee» нет — обновлять нечего.');
    return;
  }

  const value = row.value as { words?: unknown[] } | null;
  const words = Array.isArray(value?.words) ? value.words : [];
  if (words.length === 0) {
    console.log('Список слов пуст — обновлять нечего.');
    return;
  }

  let converted = 0;
  const upgraded = words.map((word) => {
    if (typeof word !== 'string') return word; // already trilingual
    converted += 1;
    return KNOWN[word.trim().toLowerCase()] ?? { tm: word, ru: word, en: word };
  });

  if (converted === 0) {
    console.log(`Все ${words.length} слов уже трёхъязычные — ничего не менялось.`);
    return;
  }

  await prisma.setting.update({ where: { key: 'marquee' }, data: { value: { words: upgraded } } });
  console.log(`Обновлено слов: ${converted} из ${words.length}.`);
  for (const w of upgraded) {
    const v = w as { tm: string; ru: string; en: string };
    console.log(`  ${v.tm}  |  ${v.ru}  |  ${v.en}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
