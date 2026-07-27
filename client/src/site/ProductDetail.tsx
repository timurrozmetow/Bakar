import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useHead } from '../lib/seo';
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

  // Computed before the early returns below so the head hook stays unconditional.
  const seo = useMemo(() => {
    if (!found) return null;
    const name = tt(found.product.name);
    const categoryName = tt(found.category.name);
    const description = tt(found.product.description) || `${name} — ${categoryName}. BAKAR.`;
    return {
      title: `${name} — BAKAR`,
      description,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name,
        description,
        category: categoryName,
        brand: { '@type': 'Brand', name: 'BAKAR' },
      },
    };
  }, [found, tt]);

  useHead({ title: seo?.title ?? '', description: seo?.description, jsonLd: seo?.jsonLd ?? null });

  // Selected packaging. Kept as an id rather than an index so it survives the
  // list changing, and reset whenever a different product is opened.
  const [variantId, setVariantId] = useState<number | null>(null);
  useEffect(() => setVariantId(null), [slug]);

  const variants = found?.product.variants ?? [];
  const selected = variants.find((v) => v.id === variantId) ?? null;
  // A pack without its own photo falls back to the product image.
  const shownImage = selected?.image || found?.product.image || '';

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
            {/* rounded-[30px] to match the bk-card --r-lg frame the photo sits in */}
            <Skeleton className="aspect-square w-full rounded-[30px]" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-11 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              {/* packaging kick + chips, so the CTA below does not jump down */}
              <div className="pt-4">
                <Skeleton className="h-3 w-24" />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Skeleton className="h-9 w-16 rounded-full" />
                  <Skeleton className="h-9 w-16 rounded-full" />
                  <Skeleton className="h-9 w-16 rounded-full" />
                </div>
              </div>
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

  return (
    <div className="pt-28 sm:pt-32">
      <section className="bk-wrap pb-24">
        {backLink}

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          {/* Same reasoning as the catalogue card: a packshot must be shown
              whole, and the image filled its box only by cropping the pack.
              The key makes React swap the element when the packaging changes,
              so the new photo fades in instead of popping. */}
          <div className="bk-card aspect-square overflow-hidden bg-surface-2">
            <Img
              key={shownImage}
              src={shownImage}
              alt={selected ? `${name} — ${selected.weight}` : name}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-full w-full rounded-[24px] object-contain p-6 sm:p-8"
            />
          </div>

          <Reveal>
            <span className="text-sm font-bold uppercase tracking-wider text-accent">{categoryName}</span>
            <h1 className="bk-h2">{name}</h1>

            {description && <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{description}</p>}

            {variants.length > 0 && (
              <div className="mt-8">
                <span className="bk-kick">{ui('products.packaging')}</span>
                {/* Clickable only when at least one pack has its own photo —
                    otherwise every choice would show the same picture and the
                    control would promise something it cannot deliver. */}
                {variants.some((v) => v.image) ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {variants.map((v) => {
                      const on = selected ? v.id === selected.id : false;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setVariantId(on ? null : v.id)}
                          className={`bk-press rounded-full border px-4 py-2 text-sm font-semibold transition ${
                            on
                              ? 'border-accent bg-accent text-on-accent'
                              : 'border-line bg-surface-2 text-ink hover:border-accent hover:text-accent'
                          }`}
                        >
                          {v.weight}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {variants.map((v) => (
                      <span key={v.id} className="rounded-full bg-surface-2 px-3 py-1.5 text-sm font-semibold">
                        {v.weight}
                      </span>
                    ))}
                  </div>
                )}
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
