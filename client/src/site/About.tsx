import { useSiteData } from '../lib/queries';
import { useLocale } from '../lib/i18n';
import type { StatItem } from '../lib/types';
import { Seo } from '../lib/seo';
import { Reveal, Stagger, StaggerItem } from '../lib/motion';

export function About() {
  const { data } = useSiteData();
  const { ui, tt } = useLocale();
  const about = data?.settings.about;
  const stats = (data?.settings.home_stats ?? []) as StatItem[];

  const badges = ['Halal', 'Non-GMO', 'Gluten-free'];

  return (
    <div className="pt-28 sm:pt-32">
      <Seo page="about" />
      <section className="bk-wrap pb-20">
        <Reveal>
          <span className="bk-kick">{tt(about?.heading) || ui('nav.about')}</span>
          <h1 className="bk-h2 max-w-3xl">{tt(about?.lead)}</h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{tt(about?.body)}</p>

          <div className="mt-10 flex flex-wrap gap-3">
            {badges.map((b) => (
              <span key={b} className="rounded-pill border border-line bg-surface px-5 py-2 text-sm font-bold text-ink">
                {b}
              </span>
            ))}
          </div>
        </Reveal>

        {stats.length > 0 && (
          <Stagger className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s, i) => (
              <StaggerItem key={i} className="text-center md:text-left">
                <div className="font-heading text-[clamp(34px,5vw,56px)] font-extrabold leading-none text-accent">{s.value}</div>
                <div className="mt-2 text-sm font-medium text-muted">{tt(s.label)}</div>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>
    </div>
  );
}
