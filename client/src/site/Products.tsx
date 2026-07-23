import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X } from 'lucide-react';
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
  const [query, setQuery] = useState('');

  // Filter by category tab, then by free-text search across all three languages.
  const shown = useMemo<Category[]>(() => {
    const byCategory = active === 'all' ? categories : categories.filter((c) => c.id === active);
    const q = query.trim().toLowerCase();
    if (!q) return byCategory;

    return byCategory
      .map((c) => ({
        ...c,
        products: (c.products ?? []).filter((p) =>
          [p.name.ru, p.name.tm, p.name.en, ...p.variants.map((v) => v.weight)]
            .filter(Boolean)
            .some((v) => v.toLowerCase().includes(q)),
        ),
      }))
      .filter((c) => (c.products ?? []).length > 0);
  }, [categories, active, query]);

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

        {/* search */}
        <div className="relative mt-8 max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ui('products.search')}
            className="w-full rounded-pill border border-line bg-surface py-3 pl-11 pr-10 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Очистить"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* category filter */}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => setActive('all')}
            className={`rounded-pill px-4 py-2 text-sm font-bold transition ${active === 'all' ? 'bg-accent text-on-accent' : 'bg-surface-2 text-muted hover:text-ink'}`}
          >
            {ui('products.all')}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`rounded-pill px-4 py-2 text-sm font-bold transition ${active === c.id ? 'bg-accent text-on-accent' : 'bg-surface-2 text-muted hover:text-ink'}`}
            >
              {tt(c.name)}
            </button>
          ))}
        </div>
      </section>

      <div className="bk-wrap space-y-14 pb-24 sm:space-y-16">
        {isLoading && <CardGridSkeleton count={8} />}
        {nothingFound && <p className="py-10 text-center text-muted">{ui('products.empty')}</p>}

        {shown.map((c) => (
          <section key={c.id} id={c.slug}>
            <Reveal className="flex items-baseline gap-3 border-b border-line pb-4">
              <h2 className="font-heading text-2xl font-extrabold tracking-tight text-ink">{tt(c.name)}</h2>
              <span className="text-sm font-bold uppercase tracking-wider text-accent">{c.name.tm}</span>
            </Reveal>
            <Stagger className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {(c.products ?? []).map((p) => (
                <StaggerItem key={p.id}>
                  <Link
                    to={`/products/${p.slug}`}
                    className="bk-card group block h-full overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow"
                  >
                    <div className="aspect-square overflow-hidden bg-surface-2">
                      <Img
                        src={p.image}
                        alt={tt(p.name)}
                        sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <div className="font-heading font-extrabold text-ink">{tt(p.name)}</div>
                      {p.name.tm && p.name.tm !== tt(p.name) && (
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted">{p.name.tm}</div>
                      )}
                      {p.variants.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {p.variants.map((v) => (
                            <span key={v.id} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted">
                              {v.weight}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </section>
        ))}
      </div>
    </div>
  );
}
