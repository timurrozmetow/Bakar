import { Helmet } from 'react-helmet-async';
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

const ORG_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  description: 'Производитель базовых продуктов питания. Halal, без ГМО, без глютена.',
  address: { '@type': 'PostalAddress', addressCountry: 'TM', addressLocality: 'Aşgabat' },
  areaServed: 'TM',
};

export function Seo({ page }: { page: MetaKey }) {
  const { locale, tt } = useLocale();
  const meta = META[page];
  const title = tt(meta.title);
  const description = tt(meta.description);
  const htmlLang = locale === 'tm' ? 'tk' : locale;

  return (
    <Helmet>
      <html lang={htmlLang} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content="/og-image.svg" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="theme-color" content="#10794a" />
      <script type="application/ld+json">{JSON.stringify(ORG_JSONLD)}</script>
    </Helmet>
  );
}
