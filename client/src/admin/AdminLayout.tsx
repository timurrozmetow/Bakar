import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from '../lib/motion';
import {
  LayoutDashboard,
  Images,
  FolderTree,
  Package,
  BadgeCheck,
  MessageSquareQuote,
  Inbox,
  FileText,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from './auth';
import { BrandMark } from '../components/BrandMark';
import { cn } from './ui';

const NAV = [
  { to: '/admin', end: true, icon: LayoutDashboard, label: 'Обзор' },
  { to: '/admin/banners', icon: Images, label: 'Баннеры' },
  { to: '/admin/categories', icon: FolderTree, label: 'Категории' },
  { to: '/admin/products', icon: Package, label: 'Продукция' },
  { to: '/admin/certificates', icon: BadgeCheck, label: 'Сертификаты' },
  { to: '/admin/reviews', icon: MessageSquareQuote, label: 'Отзывы' },
  { to: '/admin/requests', icon: Inbox, label: 'Заявки' },
  { to: '/admin/pages', icon: FileText, label: 'Тексты страниц' },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  async function onLogout() {
    await logout();
    navigate('/admin/login');
  }
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <BrandMark className="h-8 w-8 text-accent" />
        <div>
          <div className="text-lg font-extrabold leading-none tracking-tight">BAKAR</div>
          <div className="text-xs text-muted">CMS</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-semibold transition',
                isActive ? 'bg-accent text-on-accent' : 'text-muted hover:bg-surface-2 hover:text-ink',
              )
            }
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="mb-1 flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-surface-2 hover:text-ink"
        >
          <ExternalLink className="h-[18px] w-[18px]" />
          Открыть сайт
        </a>
        <div className="flex items-center justify-between rounded-[12px] px-1 py-1">
          <NavLink
            to="/admin/profile"
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'min-w-0 flex-1 rounded-[12px] px-2 py-1.5 transition',
                isActive ? 'bg-accent-soft' : 'hover:bg-surface-2',
              )
            }
          >
            <div className="truncate text-sm font-semibold">{user?.name}</div>
            <div className="truncate text-xs text-muted">{user?.email}</div>
          </NavLink>
          <button onClick={onLogout} title="Выйти" className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-red-600">
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // close mobile drawer on route change
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface px-4 py-3 lg:hidden">
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-ink hover:bg-surface-2" aria-label="Меню">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 font-extrabold tracking-tight">
          <BrandMark className="h-6 w-6 text-accent" /> BAKAR <span className="text-xs font-medium text-muted">CMS</span>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-line bg-surface lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.3 }}
            >
              <button onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-muted hover:bg-surface-2" aria-label="Закрыть">
                <X className="h-5 w-5" />
              </button>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="mx-auto flex max-w-[1400px]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-line bg-surface lg:block">
          <SidebarContent />
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
