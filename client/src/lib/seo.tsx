import { useEffect } from 'react';
import { useLocale } from './i18n';
import type { I18nText } from './types';

const SITE_NAME = 'BAKAR';

type MetaKey = 'home' | 'products' | 'about' | 'certificates' | 'contacts' | 'notfound';

const META: Record<MetaKey, { title: I18nText; description: I18nText }> = {
  home: {
    title: {
      tm: 'BAKAR — ýönekeý önümler, ak ýürekden',
      ru: 'BAKAR — простые продукты, сделанные добросовестно',
      en: 'BAKAR — simple products, made in good faith',
    },
    description: {
      tm: 'Ýarma, makaron, kösükliler, tüwi, perşenkler we çigit. Halal, GMO-syz, glýutensiz. Türkmenistan.',
      ru: 'Крупы, макароны, бобовые, рис, хлопья и семечки. Halal, без ГМО, без глютена. Туркменистан.',
      en: 'Grains, pasta, legumes, rice, flakes and seeds. Halal, non-GMO, gluten-free. Turkmenistan.',
    },
  },
  products: {
    title: { tm: 'Önümler — BAKAR', ru: 'Продукция — BAKAR', en: 'Products — BAKAR' },
    description: {
      tm: 'Alty kategoriýa esasy önüm: ýarma, makaron, kösükliler, tüwi, perşenkler, çigit.',
      ru: 'Шесть категорий базовых продуктов: крупы, макароны, бобовые, рис, хлопья, семечки.',
      en: 'Six categories of staple foods: grains, pasta, legumes, rice, flakes, seeds.',
    },
  },
  about: {
    title: { tm: 'Biz hakda — BAKAR', ru: 'О нас — BAKAR', en: 'About — BAKAR' },
    description: {
      tm: 'Meýdandan gaplama çenli: arassalaýyş, kalibrleme we hil gözegçiligi.',
      ru: 'От поля до упаковки: очистка, калибровка и контроль качества.',
      en: 'From field to package: cleaning, calibration and quality control.',
    },
  },
  certificates: {
    title: { tm: 'Şahadatnamalar — BAKAR', ru: 'Сертификаты — BAKAR', en: 'Certificates — BAKAR' },
    description: {
      tm: 'Halal, GMO-syz, glýutensiz we hil şahadatnamalary.',
      ru: 'Сертификаты Halal, без ГМО, без глютена и контроля качества.',
      en: 'Halal, non-GMO, gluten-free and quality certificates.',
    },
  },
  contacts: {
    title: { tm: 'Habarlaşmak — BAKAR', ru: 'Контакты — BAKAR', en: 'Contacts — BAKAR' },
    description: {
      tm: 'Dükanlar, ulgamlar we distribýutorlar üçin hyzmatdaşlyk.',
      ru: 'Сотрудничество для магазинов, сетей и дистрибьюторов.',
      en: 'Partnership for shops, chains and distributors.',
    },
  },
  notfound: {
    title: { tm: 'Sahypa tapylmady — BAKAR', ru: 'Страница не найдена — BAKAR', en: 'Page not found — BAKAR' },
    description: { tm: '', ru: '', en: '' },
  },
};

/**
 * Head management, hand-rolled instead of react-helmet-async.
 *
 * Crawlers never depend on this: the server already writes the real title,
 * description, OG tags and structured data into the HTML shell (see
 * server/src/lib/spa.ts). All that is left for the client is keeping the head
 * honest during in-app navigation, which is a dozen lines of DOM writes — not
 * worth ~16 KB of library in every visitor's bundle.
 *
 * Tags are updated in place rather than appended, so the server's versions are
 * overwritten instead of duplicated.
 */
function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertJsonLd(id: string, data: object | null) {
  const selector = `script[type="application/ld+json"][data-seo="${id}"]`;
  let el = document.head.querySelector<HTMLScriptElement>(selector);
  if (!data) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.dataset.seo = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function useHead(opts: { title: string; description?: string; lang?: string; jsonLd?: object | null }) {
  const { title, description, lang } = opts;
  // Serialised so a fresh object literal on every render does not re-run the effect.
  const jsonLd = opts.jsonLd ? JSON.stringify(opts.jsonLd) : null;

  useEffect(() => {
    if (lang) document.documentElement.lang = lang;
    // An empty title means "not resolved yet" — leave what the server wrote.
    if (!title) return;
    document.title = title;
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:image', '/og-image.svg');
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'theme-color', '#10794a');
    if (description) {
      upsertMeta('name', 'description', description);
      upsertMeta('property', 'og:description', description);
    }
  }, [title, description, lang]);

  useEffect(() => {
    upsertJsonLd('route', jsonLd ? (JSON.parse(jsonLd) as object) : null);
  }, [jsonLd]);
}

/** Head tags for one of the fixed public pages. */
export function Seo({ page }: { page: MetaKey }) {
  const { locale, tt } = useLocale();
  const meta = META[page];
  useHead({
    title: tt(meta.title),
    description: tt(meta.description),
    lang: locale === 'tm' ? 'tk' : locale,
  });
  return null;
}
