import { z } from 'zod';
import { i18nString, i18nStringOptional } from './lib/i18n.js';

const slug = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug: только латиница в нижнем регистре, цифры и дефис');

export const bannerCreate = z.object({
  title: i18nString,
  subtitle: i18nStringOptional,
  ctaLabel: i18nStringOptional,
  ctaHref: z.string().default('#products'),
  // `image` is the large-screen artwork and the fallback; the rest are the
  // per-breakpoint crops and may be left empty.
  image: z.string().default(''),
  imageSm: z.string().default(''),
  imageMd: z.string().default(''),
  imageLg: z.string().default(''),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export const bannerUpdate = bannerCreate;

export const categoryCreate = z.object({
  slug,
  name: i18nString,
  tagline: i18nStringOptional,
  description: i18nStringOptional,
  image: z.string().default(''),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export const categoryUpdate = categoryCreate;

export const variantInput = z.object({
  weight: z.string().min(1),
  /** Optional packshot for this exact pack; falls back to the product image. */
  image: z.string().default(''),
  sortOrder: z.number().int().default(0),
});

export const productCreate = z.object({
  categoryId: z.number().int(),
  slug,
  name: i18nString,
  description: i18nStringOptional,
  image: z.string().default(''),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  variants: z.array(variantInput).default([]),
});
export const productUpdate = productCreate;

export const certificateCreate = z.object({
  title: i18nString,
  description: i18nStringOptional,
  image: z.string().default(''),
  fileUrl: z.string().default(''),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export const certificateUpdate = certificateCreate;

export const reviewCreate = z.object({
  text: i18nString,
  author: z.string().min(1),
  role: i18nStringOptional,
  city: z.string().default(''),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export const reviewUpdate = reviewCreate;

// Public form submission.
export const partnerRequestCreate = z.object({
  name: z.string().min(1, 'Укажите имя').max(200),
  company: z.string().max(200).default(''),
  phone: z.string().max(60).default(''),
  email: z.string().email('Некорректный e-mail').or(z.literal('')).default(''),
  message: z.string().max(4000).default(''),
});
export const partnerRequestStatus = z.object({
  status: z.enum(['new', 'in_progress', 'done']),
});

export const settingUpdate = z.object({
  value: z.unknown(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Введите текущий пароль'),
  newPassword: z.string().min(8, 'Новый пароль — минимум 8 символов'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Укажите имя').max(120),
  email: z.string().email('Некорректный e-mail'),
});

/** Bulk reorder payload: [{ id, sortOrder }, ...] */
export const reorderSchema = z.object({
  items: z.array(z.object({ id: z.number().int(), sortOrder: z.number().int() })).min(1),
});
