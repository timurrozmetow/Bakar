import { z } from 'zod';

export const LOCALES = ['tm', 'ru', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/// A trilingual text value. `ru` is required (primary editing language); tm/en optional.
export const i18nString = z.object({
  tm: z.string().default(''),
  ru: z.string().min(1, 'Русский текст обязателен'),
  en: z.string().default(''),
});

/// Optional trilingual value where even ru may be empty.
export const i18nStringOptional = z.object({
  tm: z.string().default(''),
  ru: z.string().default(''),
  en: z.string().default(''),
});

export type I18nString = z.infer<typeof i18nString>;
