import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { I18nText, Locale } from './types';

/** Static UI strings for the public site, in all three languages. */
const DICT = {
  'nav.home': { tm: 'Baş sahypa', ru: 'Главная', en: 'Home' },
  'nav.products': { tm: 'Önümler', ru: 'Продукция', en: 'Products' },
  'nav.about': { tm: 'Biz hakda', ru: 'О нас', en: 'About' },
  'nav.certs': { tm: 'Şahadatnamalar', ru: 'Сертификаты', en: 'Certificates' },
  'nav.contacts': { tm: 'Habarlaşmak', ru: 'Контакты', en: 'Contacts' },
  'cta.partner': { tm: 'Hyzmatdaş bolmak', ru: 'Стать партнёром', en: 'Become a partner' },
  'cta.viewProducts': { tm: 'Önümleri görmek', ru: 'Смотреть продукцию', en: 'View products' },
  'section.assortment': { tm: 'Görnüşler', ru: 'Ассортимент', en: 'Assortment' },
  'section.assortmentLead': {
    tm: 'Alty kategoriýa, bir hil standarty.',
    ru: 'Шесть категорий, один стандарт качества.',
    en: 'Six categories, one quality standard.',
  },
  'section.reviews': { tm: 'Synlar', ru: 'Отзывы', en: 'Reviews' },
  'section.reviewsLead': {
    tm: 'Öýde-de, tekjede-de bizi saýlaýarlar.',
    ru: 'Нас выбирают дома и на полке.',
    en: 'Chosen at home and on the shelf.',
  },
  'section.certs': { tm: 'Şahadatnamalar', ru: 'Сертификаты', en: 'Certificates' },
  'section.certsLead': {
    tm: 'Hil we howpsuzlyk tassyklandy.',
    ru: 'Качество и безопасность подтверждены.',
    en: 'Quality and safety confirmed.',
  },
  'products.title': { tm: 'Ähli Bakar önümleri', ru: 'Вся продукция Bakar', en: 'All Bakar products' },
  'products.all': { tm: 'Hemmesi', ru: 'Все', en: 'All' },
  'products.empty': { tm: 'Önüm tapylmady', ru: 'Товары не найдены', en: 'No products found' },
  'products.search': { tm: 'Önüm gözlemek…', ru: 'Поиск по товарам…', en: 'Search products…' },
  'products.backToCatalog': { tm: 'Ähli önümler', ru: 'Вся продукция', en: 'All products' },
  'products.packaging': { tm: 'Gaplama', ru: 'Фасовка', en: 'Packaging' },
  'products.category': { tm: 'Kategoriýa', ru: 'Категория', en: 'Category' },
  'contacts.title': { tm: 'Habarlaşmak', ru: 'Контакты', en: 'Contacts' },
  'contacts.address': { tm: 'Salgy', ru: 'Адрес', en: 'Address' },
  'contacts.phone': { tm: 'Telefon', ru: 'Телефон', en: 'Phone' },
  'contacts.email': { tm: 'E-poçta', ru: 'E-mail', en: 'E-mail' },
  'contacts.hours': { tm: 'Iş wagty', ru: 'Часы работы', en: 'Hours' },
  'form.name': { tm: 'Adyňyz', ru: 'Ваше имя', en: 'Your name' },
  'form.company': { tm: 'Kompaniýa', ru: 'Компания', en: 'Company' },
  'form.phone': { tm: 'Telefon', ru: 'Телефон', en: 'Phone' },
  'form.email': { tm: 'E-poçta', ru: 'E-mail', en: 'E-mail' },
  'form.message': { tm: 'Habar', ru: 'Сообщение', en: 'Message' },
  'form.submit': { tm: 'Ibermek', ru: 'Отправить', en: 'Send' },
  'form.sending': { tm: 'Iberilýär…', ru: 'Отправка…', en: 'Sending…' },
  'form.success': {
    tm: 'Sag boluň! Biz siziň bilen habarlaşarys.',
    ru: 'Спасибо! Мы свяжемся с вами.',
    en: 'Thank you! We will contact you.',
  },
  'form.error': { tm: 'Ýalňyşlyk ýüze çykdy', ru: 'Произошла ошибка', en: 'Something went wrong' },
  'notfound.title': { tm: 'Sahypa tapylmady', ru: 'Страница не найдена', en: 'Page not found' },
  'notfound.back': { tm: 'Baş sahypa', ru: 'На главную', en: 'Back home' },
  // hero / misc
  'hero.scroll': { tm: 'aşak süýşüriň', ru: 'листайте вниз', en: 'scroll down' },
  'certs.openPdf': { tm: 'PDF açmak', ru: 'Открыть PDF', en: 'Open PDF' },
  'common.loading': { tm: 'Ýüklenýär…', ru: 'Загрузка…', en: 'Loading…' },
  'common.error': { tm: 'Ýalňyşlyk ýüze çykdy', ru: 'Произошла ошибка', en: 'Something went wrong' },
  'common.retry': { tm: 'Gaýtadan', ru: 'Повторить', en: 'Retry' },
  'common.empty': { tm: 'Boş', ru: 'Пусто', en: 'Empty' },
  // accessibility labels
  'a11y.theme': { tm: 'Temany çalyşmak', ru: 'Сменить тему', en: 'Toggle theme' },
  'a11y.menu': { tm: 'Menýu', ru: 'Меню', en: 'Menu' },
  'a11y.lang': { tm: 'Dil', ru: 'Язык', en: 'Language' },
  'a11y.backTop': { tm: 'Ýokary', ru: 'Наверх', en: 'Back to top' },
  'a11y.prevSlide': { tm: 'Öňki', ru: 'Предыдущий слайд', en: 'Previous slide' },
  'a11y.nextSlide': { tm: 'Indiki', ru: 'Следующий слайд', en: 'Next slide' },
  // about badges
  'about.quality': { tm: 'Kepillendirilen hil', ru: 'Гарантированное качество', en: 'Guaranteed quality' },
} as const;

export type UIKey = keyof typeof DICT;

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** resolve a trilingual field to the current locale (falls back to ru → any). */
  tt: (field?: I18nText | null) => string;
  /** resolve a static UI string. */
  ui: (key: UIKey) => string;
}

const Ctx = createContext<LocaleCtx | null>(null);

function pick(field: I18nText | null | undefined, locale: Locale): string {
  if (!field) return '';
  return field[locale] || field.ru || field.en || field.tm || '';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(
    () => (localStorage.getItem('bakar_locale') as Locale) || 'ru',
  );

  useEffect(() => {
    localStorage.setItem('bakar_locale', locale);
    document.documentElement.lang = locale === 'tm' ? 'tk' : locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);
  const tt = useCallback((field?: I18nText | null) => pick(field, locale), [locale]);
  const ui = useCallback((key: UIKey) => pick(DICT[key], locale), [locale]);

  const value = useMemo(() => ({ locale, setLocale, tt, ui }), [locale, setLocale, tt, ui]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale(): LocaleCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
