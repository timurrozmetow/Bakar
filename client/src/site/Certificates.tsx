import { useEffect, useState } from 'react';
import { X, ZoomIn, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useSiteData } from '../lib/queries';
import { useLocale } from '../lib/i18n';
import { mediaUrl } from '../lib/api';
import { Seo } from '../lib/seo';
import { Reveal, Stagger, StaggerItem, AnimatePresence, motion } from '../lib/motion';
import { CardGridSkeleton } from '../components/ux';
import { Img } from '../components/Img';
import type { Certificate } from '../lib/types';

export function Certificates() {
  const { data, isLoading } = useSiteData();
  const { ui, tt } = useLocale();
  const certs = data?.certificates ?? [];
  const [viewing, setViewing] = useState<Certificate | null>(null);

  return (
    <div className="pt-28 sm:pt-32">
      <Seo page="certificates" />
      <section className="bk-wrap pb-24">
        <Reveal>
          <span className="bk-kick">{ui('section.certs')}</span>
          <h1 className="bk-h2 max-w-2xl">{ui('section.certsLead')}</h1>
        </Reveal>

        {isLoading ? (
          <div className="mt-12">
            <CardGridSkeleton />
          </div>
        ) : certs.length === 0 ? (
          <p className="mt-12 text-muted">{ui('products.empty')}</p>
        ) : (
          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {certs.map((c) => (
              <StaggerItem key={c.id}>
                <CertificateCard cert={c} onView={() => setViewing(c)} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>

      <Lightbox cert={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

function CertificateCard({ cert, onView }: { cert: Certificate; onView: () => void }) {
  const { ui, tt } = useLocale();
  const title = tt(cert.title);
  // A file (usually a PDF) opens directly; an image opens the in-page viewer.
  const hasFile = Boolean(cert.fileUrl);
  const canOpen = hasFile || Boolean(cert.image);

  const preview = (
    <div className="relative overflow-hidden rounded-[16px] border border-line bg-surface-2">
      {/* The scan is a portrait A4 document — object-contain keeps it whole and
          readable instead of cropping it to an unrecognisable square. */}
      <div className="aspect-[3/4] w-full">
        {cert.image ? (
          <Img
            src={cert.image}
            alt={title}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="h-full w-full object-contain p-3 transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <ShieldCheck className="h-16 w-16 text-accent/40" />
          </div>
        )}
      </div>
      {canOpen && (
        <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-surface/90 text-ink opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
          {hasFile ? <ArrowUpRight className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
        </span>
      )}
    </div>
  );

  const body = (
    <div className="mt-5 flex flex-1 flex-col">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-[13px] font-extrabold text-accent">
          ✓
        </span>
        <h2 className="font-heading text-lg font-extrabold tracking-tight text-ink">{title}</h2>
      </div>
      {tt(cert.description) && <p className="mt-2 text-sm leading-relaxed text-muted">{tt(cert.description)}</p>}
      {canOpen && (
        <span className="mt-auto flex items-center gap-1.5 pt-4 text-[13px] font-bold text-accent">
          {hasFile ? ui('certs.openPdf') : ui('certs.view')}
          {hasFile ? <ArrowUpRight className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
        </span>
      )}
    </div>
  );

  const cardClass =
    'group flex h-full flex-col rounded-[22px] border border-line bg-surface p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-accent sm:p-5';

  // A PDF is a normal link (new tab); an image opens the viewer via a button.
  if (hasFile) {
    return (
      <a href={mediaUrl(cert.fileUrl)} target="_blank" rel="noreferrer" className={cardClass}>
        {preview}
        {body}
      </a>
    );
  }
  if (cert.image) {
    return (
      <button type="button" onClick={onView} className={cardClass}>
        {preview}
        {body}
      </button>
    );
  }
  return (
    <div className={cardClass}>
      {preview}
      {body}
    </div>
  );
}

/** Full-screen viewer for a certificate scan. */
function Lightbox({ cert, onClose }: { cert: Certificate | null; onClose: () => void }) {
  const { ui, tt } = useLocale();

  useEffect(() => {
    if (!cert) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    // Lock body scroll while the overlay is open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [cert, onClose]);

  return (
    <AnimatePresence>
      {cert && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col bg-black/80 p-4 backdrop-blur-sm sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={tt(cert.title)}
        >
          <div className="mb-4 flex items-center justify-between text-white">
            <span className="font-heading text-lg font-extrabold">{tt(cert.title)}</span>
            <button
              type="button"
              onClick={onClose}
              aria-label={ui('a11y.close')}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <motion.img
            src={mediaUrl(cert.image)}
            alt={tt(cert.title)}
            className="mx-auto min-h-0 w-auto max-w-full flex-1 rounded-[12px] bg-white object-contain"
            initial={{ scale: 0.96 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.96 }}
            transition={{ duration: 0.2 }}
            // The click target for closing is the backdrop; the image itself should not.
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
