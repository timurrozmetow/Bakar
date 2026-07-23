import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { BrandMark } from '../components/BrandMark';
import { useLocale } from '../lib/i18n';
import { useTheme } from '../lib/theme';
import { LOCALES, LOCALE_LABEL } from '../lib/types';

const LINKS = [
  { to: '/', key: 'nav.home' as const, end: true },
  { to: '/products', key: 'nav.products' as const },
  { to: '/about', key: 'nav.about' as const },
  { to: '/certificates', key: 'nav.certs' as const },
  { to: '/contacts', key: 'nav.contacts' as const },
];

export function Header() {
  const { ui, locale, setLocale } = useLocale();
  const { theme, toggle } = useTheme();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-3.5 z-50 px-3">
      <div
        className="mx-auto flex max-w-[1160px] items-center gap-6 rounded-pill border px-4 py-2.5 transition"
        style={{
          background: solid ? 'var(--bk-surface)' : 'color-mix(in srgb, var(--bk-surface) 82%, transparent)',
          borderColor: 'var(--bk-line)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Link to="/" className="mr-auto flex items-center gap-2.5 pl-1.5 font-heading text-[21px] font-extrabold tracking-tight">
          {/* 32px, not 28: the real mark has eight petals plus the chevron and
              turns into a blob at the size the simpler drawn logo tolerated. */}
          <BrandMark className="h-8 w-8 text-accent" />
          BAKAR
        </Link>

        <nav className="hidden items-center gap-1.5 text-[14.5px] font-medium md:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `rounded-pill px-3.5 py-2 transition ${
                  isActive ? 'bg-accent text-on-accent' : 'text-ink hover:bg-accent-soft hover:text-accent'
                }`
              }
            >
              {ui(l.key)}
            </NavLink>
          ))}
        </nav>

        {/* language */}
        <div className="hidden rounded-pill bg-surface-2 p-1 md:inline-flex">
          {LOCALES.map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={`rounded-pill px-2.5 py-1.5 text-[11.5px] font-bold transition ${
                locale === l ? 'bg-accent text-on-accent' : 'text-muted hover:text-ink'
              }`}
            >
              {LOCALE_LABEL[l]}
            </button>
          ))}
        </div>

        <button
          onClick={toggle}
          className="grid h-10 w-10 place-items-center rounded-pill border border-line bg-surface text-ink transition hover:bg-surface-2"
          aria-label={ui('a11y.theme')}
        >
          {theme === 'dark' ? <Sun className="h-[19px] w-[19px]" /> : <Moon className="h-[19px] w-[19px]" />}
        </button>

        <button onClick={() => setOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-pill border border-line bg-surface text-ink md:hidden" aria-label={ui('a11y.menu')}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* mobile menu */}
      {open && (
        <div className="mx-auto mt-2 max-w-[1160px] rounded-2xl border border-line bg-surface p-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                    isActive ? 'bg-accent text-on-accent' : 'text-ink hover:bg-surface-2'
                  }`
                }
              >
                {ui(l.key)}
              </NavLink>
            ))}
          </nav>
          <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
            {LOCALES.map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`rounded-pill px-3 py-1.5 text-xs font-bold ${
                  locale === l ? 'bg-accent text-on-accent' : 'bg-surface-2 text-muted'
                }`}
              >
                {LOCALE_LABEL[l]}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
