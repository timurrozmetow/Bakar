import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Quote } from 'lucide-react';
import { useSiteData } from '../lib/queries';
import { useLocale } from '../lib/i18n';
import { mediaUrl } from '../lib/api';
import type { StatItem } from '../lib/types';
import { Seo } from '../lib/seo';
import { Reveal, Stagger, StaggerItem, motion, useReducedMotion } from '../lib/motion';
import { CardGridSkeleton, Skeleton } from '../components/ux';
import { Img } from '../components/Img';

export function Home() {
  const { data, isLoading } = useSiteData();
  const { ui, tt } = useLocale();
  const reduce = useReducedMotion();
  const banners = data?.banners ?? [];
  const categories = data?.categories ?? [];
  const reviews = data?.reviews ?? [];
  const certs = data?.certificates ?? [];
  const stats = (data?.settings.home_stats ?? []) as StatItem[];
  const marquee = data?.settings.marquee?.words ?? ['BAKAR', 'Halal', 'Non-GMO', 'Gluten-free', 'Türkmenistan'];
  const partner = data?.settings.partner_cta;

  // hero carousel
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  const active = banners[slide];

  return (
    <div>
      <Seo page="home" />

      {/* ── Hero carousel ─────────────────────────────────────── */}
      <section className="relative flex min-h-[88vh] items-end overflow-hidden sm:min-h-[92vh]">
        {isLoading && <Skeleton className="absolute inset-0 rounded-none" />}
        {banners.map((b, i) => (
          <div
            key={b.id}
            className={`bk-hero-slide ${i === slide ? 'on' : ''}`}
            style={{ backgroundImage: `url(${mediaUrl(b.image)})` }}
          />
        ))}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,20,14,.28) 0%, rgba(10,20,14,.35) 45%, rgba(8,16,11,.82) 100%)' }} />
        <div className="bk-wrap relative z-10 pb-20 pt-36 text-white sm:pb-24 sm:pt-40">
          {active && (
            <motion.div
              key={active.id}
              className="max-w-2xl"
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="bk-kick" style={{ color: '#bfe6cf' }}>{active.title.tm || 'BAKAR'}</span>
              <h1 className="mt-3 font-heading text-[clamp(36px,7vw,84px)] font-extrabold leading-[1.02] tracking-tight">
                {tt(active.title)}
              </h1>
              <p className="mt-5 max-w-xl text-base text-white/80 sm:text-lg">{tt(active.subtitle)}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/products" className="bk-btn bk-btn-white">
                  {tt(active.ctaLabel) || ui('cta.viewProducts')} <ArrowRight />
                </Link>
                <Link to="/contacts" className="bk-btn" style={{ borderColor: 'rgba(255,255,255,.4)', color: '#fff' }}>
                  {ui('cta.partner')}
                </Link>
              </div>

              {banners.length > 1 && (
                <div className="mt-10 flex gap-2">
                  {banners.map((b, i) => (
                    <button
                      key={b.id}
                      onClick={() => setSlide(i)}
                      aria-label={`${ui('a11y.nextSlide')} ${i + 1}`}
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: i === slide ? 34 : 14, background: i === slide ? '#fff' : 'rgba(255,255,255,.45)' }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Marquee ───────────────────────────────────────────── */}
      <div className="bk-marq">
        <div className="bk-marq-track">
          {[...marquee, ...marquee].map((w, i) => (
            <span key={i} className="inline-flex items-center gap-16">
              {w}
              <span style={{ opacity: 0.5 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Assortment ────────────────────────────────────────── */}
      <section className="bk-wrap py-16 sm:py-20 md:py-28">
        <Reveal>
          <span className="bk-kick">{ui('section.assortment')}</span>
          <h2 className="bk-h2 max-w-2xl">{ui('section.assortmentLead')}</h2>
        </Reveal>
        {isLoading ? (
          <div className="mt-12"><CardGridSkeleton /></div>
        ) : (
          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <StaggerItem key={c.id}>
                <Link to="/products" className="bk-card group block h-full overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow">
                  <div className="aspect-[4/3] overflow-hidden bg-surface-2">
                    <Img
                      src={c.image}
                      alt={tt(c.name)}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <div className="text-sm font-bold uppercase tracking-wider text-accent">{c.name.tm}</div>
                    <div className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-ink">{tt(c.name)}</div>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{tt(c.tagline)}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-accent">
                      {ui('cta.viewProducts')} <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>

      {/* ── Stats ─────────────────────────────────────────────── */}
      {stats.length > 0 && (
        <section style={{ background: 'var(--bk-surface-2)' }}>
          <Stagger className="bk-wrap grid grid-cols-2 gap-8 py-14 sm:py-16 md:grid-cols-4">
            {stats.map((s, i) => (
              <StaggerItem key={i} className="text-center md:text-left">
                <div className="font-heading text-[clamp(34px,5vw,56px)] font-extrabold leading-none text-accent">{s.value}</div>
                <div className="mt-2 text-sm font-medium text-muted">{tt(s.label)}</div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}

      {/* ── Reviews ───────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <section className="bk-wrap py-16 sm:py-20 md:py-28">
          <Reveal>
            <span className="bk-kick">{ui('section.reviews')}</span>
            <h2 className="bk-h2 max-w-2xl">{ui('section.reviewsLead')}</h2>
          </Reveal>
          <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
            {reviews.map((r) => (
              <StaggerItem key={r.id}>
                <figure className="bk-card flex h-full flex-col p-7">
                  <Quote className="h-8 w-8 text-accent/30" />
                  <blockquote className="mt-4 flex-1 text-[17px] leading-relaxed text-ink">{tt(r.text)}</blockquote>
                  <figcaption className="mt-6 border-t border-line pt-4">
                    <div className="font-bold text-ink">{r.author}</div>
                    <div className="text-sm text-muted">
                      {tt(r.role)}{r.city ? `, ${r.city}` : ''}
                    </div>
                  </figcaption>
                </figure>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}

      {/* ── Certificates preview ──────────────────────────────── */}
      {certs.length > 0 && (
        <section className="bk-wrap pb-8">
          <Reveal className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {certs.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-pill border border-line bg-surface px-5 py-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-sm font-extrabold text-accent">✓</span>
                <span className="font-bold text-ink">{tt(c.title)}</span>
              </div>
            ))}
          </Reveal>
        </section>
      )}

      {/* ── Partner CTA ───────────────────────────────────────── */}
      <section className="bk-wrap py-16 sm:py-20 md:py-28">
        <Reveal>
          <div className="overflow-hidden rounded-[24px] px-6 py-14 text-center sm:rounded-[30px] sm:px-8 sm:py-16 md:px-16" style={{ background: 'var(--bk-accent)', color: 'var(--bk-on-accent)' }}>
            <h2 className="mx-auto max-w-2xl font-heading text-[clamp(26px,4vw,46px)] font-extrabold leading-tight tracking-tight">
              {tt(partner?.heading) || ui('cta.partner')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base opacity-90 sm:text-lg">
              {tt(partner?.body) || 'Приглашаем магазины, сети и дистрибьюторов к сотрудничеству.'}
            </p>
            <Link to="/contacts" className="bk-btn bk-btn-white mt-8">
              {ui('cta.partner')} <ArrowRight />
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
