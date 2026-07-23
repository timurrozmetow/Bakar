import { Link } from 'react-router-dom';
import { BrandMark } from '../components/BrandMark';
import { useLocale } from '../lib/i18n';
import type { SiteData } from '../lib/types';

export function Footer({ data }: { data?: SiteData }) {
  const { ui, tt } = useLocale();
  const contacts = data?.settings.contacts;
  const footer = data?.settings.footer;

  return (
    <footer style={{ background: 'var(--bk-footer)', color: '#e9e8e2' }}>
      <div className="bk-wrap grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight">
            <BrandMark className="h-8 w-8" style={{ color: 'var(--bk-green)' }} />
            BAKAR
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
            {tt(footer?.lead) || 'Простые, надёжные продукты — для туркменского стола.'}
          </p>
        </div>

        <div>
          {/* h2, not h5: the page goes h1 → h2 and skipping levels breaks the
              document outline for screen readers. Size comes from the class. */}
          <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-white/50">Разделы</h2>
          <ul className="space-y-3 text-sm text-white/80">
            <li><Link to="/products" className="hover:text-white">{ui('nav.products')}</Link></li>
            <li><Link to="/about" className="hover:text-white">{ui('nav.about')}</Link></li>
            <li><Link to="/certificates" className="hover:text-white">{ui('nav.certs')}</Link></li>
            <li><Link to="/contacts" className="hover:text-white">{ui('nav.contacts')}</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-white/50">{ui('nav.contacts')}</h2>
          <ul className="space-y-3 text-sm text-white/80">
            {contacts?.address && <li>{tt(contacts.address)}</li>}
            {contacts?.phone && <li><a href={`tel:${contacts.phone}`} className="hover:text-white">{contacts.phone}</a></li>}
            {contacts?.email && <li><a href={`mailto:${contacts.email}`} className="hover:text-white">{contacts.email}</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="bk-wrap flex flex-wrap items-center justify-between gap-3 py-6 text-xs text-white/50">
          <span>© {new Date().getFullYear()} BAKAR. Türkmenistan.</span>
          <span>Halal · Non-GMO · Gluten-free</span>
        </div>
      </div>
    </footer>
  );
}
