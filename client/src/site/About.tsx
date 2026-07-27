import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteData } from '../lib/queries';
import { useLocale } from '../lib/i18n';
import type { AboutStep, AboutValue, StatItem } from '../lib/types';
import { Seo } from '../lib/seo';
import { Reveal, Stagger, StaggerItem } from '../lib/motion';
import { Img } from '../components/Img';

export function About() {
  const { data } = useSiteData();
  const { ui, tt } = useLocale();
  const about = data?.settings.about;
  const stats = (data?.settings.home_stats ?? []) as StatItem[];

  // Every block below the intro is optional: the page has to read well while
  // the plant photos are still being collected.
  const steps = (about?.steps ?? []) as AboutStep[];
  const values = (about?.values ?? []) as AboutValue[];
  const gallery = (about?.gallery ?? []).filter(Boolean);
  const storyBody = tt(about?.story?.body);

  const badges = [ui('badge.halal'), ui('badge.nonGmo'), ui('badge.glutenFree')];

  return (
    <div className="pt-28 sm:pt-32">
      <Seo page="about" />

      {/* ── Intro ─────────────────────────────────────────────── */}
      <section className="bk-wrap pb-16 sm:pb-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <Reveal>
            <span className="bk-kick">{tt(about?.heading) || ui('nav.about')}</span>
            <h1 className="bk-h2 max-w-2xl">{tt(about?.lead)}</h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{tt(about?.body)}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              {badges.map((b) => (
                <span key={b} className="rounded-pill border border-line bg-surface px-5 py-2 text-sm font-bold text-ink">
                  {b}
                </span>
              ))}
            </div>
          </Reveal>

          {about?.image && (
            <Reveal delay={0.1}>
              <div className="overflow-hidden rounded-[24px] border border-line bg-surface-2">
                <Img
                  src={about.image}
                  alt={tt(about?.lead)}
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  // Above-the-fold on /about and a likely LCP element — opt out
                  // of the load-fade so it paints eagerly.
                  priority
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────── */}
      {stats.length > 0 && (
        <section style={{ background: 'var(--bk-surface-2)' }}>
          <Stagger className="bk-wrap grid grid-cols-2 gap-8 py-14 sm:py-16 md:grid-cols-4">
            {stats.map((s, i) => (
              <StaggerItem key={i} className="text-center md:text-left">
                <div className="font-heading text-[clamp(34px,5vw,56px)] font-extrabold leading-none text-accent">
                  {s.value}
                </div>
                <div className="mt-2 text-sm font-medium text-muted">{tt(s.label)}</div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}

      {/* ── Story ─────────────────────────────────────────────── */}
      {storyBody && (
        <section className="bk-wrap py-16 sm:py-20 md:py-24">
          <Reveal>
            <span className="bk-kick">{tt(about?.story?.heading) || ui('about.story')}</span>
            {/* Blank lines in the admin become paragraphs here. */}
            <div className="mt-6 max-w-3xl space-y-4 text-base leading-relaxed text-muted sm:text-lg">
              {storyBody
                .split(/\n\s*\n/)
                .map((p) => p.trim())
                .filter(Boolean)
                .map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* ── Production steps ──────────────────────────────────── */}
      {steps.length > 0 && (
        <section className="bk-wrap pb-16 sm:pb-20 md:pb-24">
          <Reveal>
            <span className="bk-kick">{ui('about.process')}</span>
            <h2 className="bk-h2 max-w-2xl">{ui('about.processLead')}</h2>
          </Reveal>

          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((s, i) => (
              <StaggerItem key={i}>
                <article className="bk-card flex h-full flex-col overflow-hidden">
                  {/* Without a photo the card keeps its shape through the number
                      badge alone, so a half-filled page still looks deliberate. */}
                  {s.image ? (
                    <div className="aspect-[4/3] overflow-hidden bg-surface-2">
                      <Img
                        src={s.image}
                        alt={tt(s.title)}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-6">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft font-heading text-sm font-extrabold text-accent">
                      {i + 1}
                    </span>
                    <h3 className="mt-4 font-heading text-xl font-extrabold tracking-tight text-ink">{tt(s.title)}</h3>
                    {tt(s.text) && <p className="mt-2 text-sm leading-relaxed text-muted">{tt(s.text)}</p>}
                  </div>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}

      {/* ── Principles ────────────────────────────────────────── */}
      {values.length > 0 && (
        <section style={{ background: 'var(--bk-surface-2)' }}>
          <div className="bk-wrap py-16 sm:py-20 md:py-24">
            <Reveal>
              <span className="bk-kick">{ui('about.values')}</span>
              <h2 className="bk-h2 max-w-2xl">{ui('about.valuesLead')}</h2>
            </Reveal>
            <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((v, i) => (
                <StaggerItem key={i}>
                  <div className="h-full rounded-[22px] border border-line bg-surface p-6">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-lg font-extrabold text-accent">
                      ✓
                    </span>
                    <h3 className="mt-4 font-heading text-lg font-extrabold tracking-tight text-ink">{tt(v.title)}</h3>
                    {tt(v.text) && <p className="mt-2 text-sm leading-relaxed text-muted">{tt(v.text)}</p>}
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {/* ── Gallery ───────────────────────────────────────────── */}
      {gallery.length > 0 && (
        <section className="bk-wrap py-16 sm:py-20 md:py-24">
          <Reveal>
            <span className="bk-kick">{ui('about.gallery')}</span>
          </Reveal>
          {/* The first photo spans two columns so an odd number of shots still
              fills the row instead of leaving a gap. */}
          <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((src, i) => (
              <StaggerItem key={i} className={i === 0 ? 'sm:col-span-2 sm:row-span-2' : undefined}>
                <div className="h-full overflow-hidden rounded-[20px] border border-line bg-surface-2">
                  <Img
                    src={src}
                    alt=""
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className={`w-full object-cover ${i === 0 ? 'aspect-[4/3] sm:h-full' : 'aspect-[4/3]'}`}
                  />
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="bk-wrap pb-20 sm:pb-24 md:pb-28">
        <Reveal>
          <div
            className="overflow-hidden rounded-[24px] px-6 py-12 text-center sm:rounded-[30px] sm:px-8 sm:py-14"
            style={{ background: 'var(--bk-accent)', color: 'var(--bk-on-accent)' }}
          >
            <h2 className="mx-auto max-w-2xl font-heading text-[clamp(24px,3.5vw,38px)] font-extrabold leading-tight tracking-tight">
              {ui('cta.partner')}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base opacity-90">{ui('cta.partnerLead')}</p>
            <Link to="/contacts" className="bk-btn bk-btn-white mt-7">
              {ui('cta.partner')} <ArrowRight />
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
