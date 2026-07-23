import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useSiteData } from '../lib/queries';
import { useLocale } from '../lib/i18n';
import { Reveal } from '../lib/motion';
import { Skeleton } from '../components/ux';
import { Img } from '../components/Img';
import type { Category, Product } from '../lib/types';

interface Found {
  product: Product;
  category: Category;
}

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useSiteData();
  const { ui, tt } = useLocale();

  const found = useMemo<Found | undefined>(
    () =>
      data?.categories
        .flatMap((c) => (c.products ?? []).map((p) => ({ product: p, category: c })))
        .find((x) => x.product.slug === slug),
    [data, slug],
  );

  const backLink = (
    <Link to="/products" className="inline-flex items-center gap-1.5 text-sm font-bold text-accent">
      <ChevronLeft className="h-4 w-4" />
      {ui('products.backToCatalog')}
    </Link>
  );

  if (isLoading) {
    return (
      <div className="pt-28 sm:pt-32">
        <section className="bk-wrap pb-24">
          <Skeleton className="h-4 w-40" />
          <div className="mt-6 grid gap-10 lg:grid-cols-2">
            <Skeleton className="aspect-square w-full rounded-[24px]" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-12 w-48" />
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!found) {
    return (
      <div className="pt-28 sm:pt-32">
        <section className="bk-wrap pb-24">
          <div className="py-20 text-center">
            <p className="text-muted">{ui('products.empty')}</p>
            <Link to="/products" className="bk-btn bk-btn-primary mt-6">
              {ui('products.backToCatalog')}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const { product, category } = found;
  const name = tt(product.name);
  const categoryName = tt(category.name);
  const description = tt(product.description);
  const metaDescription = description || `${name} — ${categoryName}. BAKAR.`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: metaDescription,
    category: categoryName,
    brand: { '@type': 'Brand', name: 'BAKAR' },
  };

  return (
    <div className="pt-28 sm:pt-32">
      <Helmet>
        <title>{`${name} — BAKAR`}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={`${name} — BAKAR`} />
        <meta property="og:description" content={metaDescription} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <section className="bk-wrap pb-24">
        {backLink}

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <div className="bk-card aspect-square overflow-hidden bg-surface-2">
            <Img
              src={product.image}
              alt={name}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="w-full rounded-[24px] object-cover"
            />
          </div>

          <Reveal>
            <span className="text-sm font-bold uppercase tracking-wider text-accent">{categoryName}</span>
            <h1 className="bk-h2">{name}</h1>
            {product.name.tm && product.name.tm !== name && (
              <div className="mt-1 text-sm font-semibold uppercase tracking-wider text-muted">{product.name.tm}</div>
            )}

            {description && <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{description}</p>}

            {product.variants.length > 0 && (
              <div className="mt-8">
                <span className="bk-kick">{ui('products.packaging')}</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <span key={v.id} className="rounded-full bg-surface-2 px-3 py-1.5 text-sm font-semibold">
                      {v.weight}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Link to="/contacts" className="bk-btn bk-btn-primary mt-8">
              {ui('cta.partner')}
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
