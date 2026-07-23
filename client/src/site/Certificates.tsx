import { ArrowUpRight } from 'lucide-react';
import { useSiteData } from '../lib/queries';
import { useLocale } from '../lib/i18n';
import { mediaUrl } from '../lib/api';
import { Seo } from '../lib/seo';
import { Reveal, Stagger, StaggerItem } from '../lib/motion';
import { CardGridSkeleton } from '../components/ux';

export function Certificates() {
  const { data, isLoading } = useSiteData();
  const { ui, tt } = useLocale();
  const certs = data?.certificates ?? [];

  return (
    <div className="pt-28 sm:pt-32">
      <Seo page="certificates" />
      <section className="bk-wrap pb-24">
        <Reveal>
          <span className="bk-kick">{ui('section.certs')}</span>
          <h1 className="bk-h2 max-w-2xl">{ui('section.certsLead')}</h1>
        </Reveal>

        {isLoading ? (
          <div className="mt-12"><CardGridSkeleton /></div>
        ) : certs.length === 0 ? (
          <p className="mt-12 text-muted">{ui('products.empty')}</p>
        ) : (
          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {certs.map((c) => (
              <StaggerItem key={c.id}>
                <div className="bk-card h-full p-7">
                  {c.image ? (
                    <img src={mediaUrl(c.image)} alt={tt(c.title)} loading="lazy" className="mb-4 h-16 w-16 rounded-xl object-cover" />
                  ) : (
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-accent-soft font-extrabold text-accent">✓</span>
                  )}
                  <div className="mt-2 font-heading text-xl font-extrabold text-ink">{tt(c.title)}</div>
                  <p className="mt-2 text-sm text-muted">{tt(c.description)}</p>
                  {c.fileUrl && (
                    <a
                      href={mediaUrl(c.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline"
                    >
                      {ui('certs.openPdf')} <ArrowUpRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>
    </div>
  );
}
