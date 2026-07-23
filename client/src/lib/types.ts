/** Trilingual text stored as JSON on the server. */
export interface I18nText {
  tm: string;
  ru: string;
  en: string;
}

export const LOCALES = ['tm', 'ru', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABEL: Record<Locale, string> = { tm: 'TM', ru: 'RU', en: 'EN' };
export const LOCALE_NAME: Record<Locale, string> = {
  tm: 'Türkmençe',
  ru: 'Русский',
  en: 'English',
};

export const emptyI18n = (): I18nText => ({ tm: '', ru: '', en: '' });

export interface Banner {
  id: number;
  title: I18nText;
  subtitle: I18nText;
  ctaLabel: I18nText;
  ctaHref: string;
  image: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductVariant {
  id: number;
  productId: number;
  weight: string;
  sortOrder: number;
}

export interface Product {
  id: number;
  categoryId: number;
  slug: string;
  name: I18nText;
  description: I18nText;
  image: string;
  sortOrder: number;
  isActive: boolean;
  variants: ProductVariant[];
  category?: Category;
}

export interface Category {
  id: number;
  slug: string;
  name: I18nText;
  tagline: I18nText;
  description: I18nText;
  image: string;
  sortOrder: number;
  isActive: boolean;
  products?: Product[];
  _count?: { products: number };
}

export interface Certificate {
  id: number;
  title: I18nText;
  description: I18nText;
  image: string;
  fileUrl: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Review {
  id: number;
  text: I18nText;
  author: string;
  role: I18nText;
  city: string;
  sortOrder: number;
  isActive: boolean;
}

export interface PartnerRequest {
  id: number;
  name: string;
  company: string;
  phone: string;
  email: string;
  message: string;
  status: 'new' | 'in_progress' | 'done';
  createdAt: string;
}

export interface StatItem {
  value: string;
  label: I18nText;
}

/** Aggregated payload from GET /api/public/site. */
export interface SiteData {
  banners: Banner[];
  categories: Category[];
  certificates: Certificate[];
  reviews: Review[];
  settings: {
    home_hero?: { headline: I18nText };
    home_stats?: StatItem[];
    about?: { heading: I18nText; lead: I18nText; body: I18nText };
    contacts?: {
      address: I18nText;
      phone: string;
      email: string;
      hours: I18nText;
      instagram?: string;
      telegram?: string;
    };
    marquee?: { words: string[] };
    footer?: { lead: I18nText };
    partner_cta?: { heading: I18nText; body: I18nText };
    [key: string]: unknown;
  };
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
}
