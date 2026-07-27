import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useSiteData } from '../lib/queries';
import { useLocale } from '../lib/i18n';
import { Seo } from '../lib/seo';
import { Reveal, Stagger, StaggerItem } from '../lib/motion';
import { CardGridSkeleton } from '../components/ux';
import { Img } from '../components/Img';
import type { Category } from '../lib/types';

export function Products() {
  const { data, isLoading } = useSiteData();
  const { ui, tt } = useLocale();
  const categories = data?.categories ?? [];
  const [active, setActive] = useState<number | 'all'>('all');

  const shown = useMemo<Category[]>(
    () => (active === 'all' ? categories : categories.filter((c) => c.id === active)),
    [categories, active],
  );

  const nothingFound = !isLoading && shown.length === 0;

  return (
    <div className="pt-28 sm:pt-32">
      <Seo page="products" />
      <section className="bk-wrap pb-6">
        <Reveal>
          <span className="bk-kick">{ui('section.assortment')}</span>
          <h1 className="bk-h2 max-w-3xl">{ui('products.title')}</h1>
          <p className="mt-4 max-w-2xl text-base text-muted sm:text-lg">{ui('section.assortmentLead')}</p>
        </Reveal>

        {/* Category filter. There is no search box on purpose: six categories and
            a couple of dozen items are faster to scan than to type into. */}
        <div className="mt-8 flex flex-wrap gap-2">
          <button
            onClick={() => setActive('all')}
            className={`bk-press rounded-pill px-4 py-2 text-sm font-bold transition ${active === 'all' ? 'bg-accent text-on-accent' : 'bg-surface-2 text-muted hover:text-ink'}`}
          >
            {ui('products.all')}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`bk-press rounded-pill px-4 py-2 text-sm font-bold transition ${active === c.id ? 'bg-accent text-on-accent' : 'bg-surface-2 text-muted hover:text-ink'}`}
            >
              {tt(c.name)}
            </button>
          ))}
        </div>
      </section>

      <div className="bk-wrap space-y-16 pb-24 sm:space-y-20">
        {isLoading && <CardGridSkeleton variant="product" count={8} />}
        {nothingFound && <p className="py-10 text-center text-muted">{ui('products.empty')}</p>}

        {shown.map((c) => (
          <section key={c.id} id={c.slug}>
            <Reveal className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line pb-4">
              <h2 className="font-heading text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{tt(c.name)}</h2>
              <span className="text-sm text-muted">{tt(c.tagline)}</span>
            </Reveal>

            <Stagger className="mt-7 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {(c.products ?? []).map((p) => {
                const description = tt(p.description);
                return (
                  <StaggerItem key={p.id}>
                    <Link
                      to={`/products/${p.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:border-accent"
                    >
                      {/* object-contain, not cover: these are packshots, and
                          cropping them to fill the frame sliced the bottom off
                          every bag. A square frame is the compromise that suits
                          both a tall single pack and a wider group photo — with
                          a portrait frame the latter sat between empty bands. */}
                      <div className="aspect-square overflow-hidden bg-surface-2">
                        <Img
                          src={p.image}
                          alt={tt(p.name)}
                          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                          className="h-full w-full object-contain p-3 transition duration-[600ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04] sm:p-4"
                        />
                      </div>

                      <div className="flex flex-1 flex-col p-4 sm:p-5">
                        <h3 className="font-heading text-[17px] font-extrabold leading-snug tracking-tight text-ink sm:text-lg">
                          {tt(p.name)}
                        </h3>
                        {description && (
                          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">{description}</p>
                        )}
                        {/* After the name, not over the photo: a screen reader
                            should hear what the product is before its packaging. */}
                        {p.variants.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {p.variants.map((v) => (
                              <span
                                key={v.id}
                                className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-bold text-muted"
                              >
                                {v.weight}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Padding on the wrapper, not a margin on the span: an
                            auto margin collapses to zero once the card is full,
                            which would leave the rule flush against the chips. */}
                        <div className="mt-auto pt-4">
                          <span className="flex items-center gap-1.5 border-t border-line pt-3.5 text-[13px] font-bold text-accent">
                            {ui('products.more')}
                            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </section>
        ))}
      </div>
    </div>
  );
}
