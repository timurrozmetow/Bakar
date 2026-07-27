import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion, EASE } from '../lib/motion';
import { useLocale } from '../lib/i18n';
import { useLoaderVisible } from '../lib/loader';
import { BrandMark } from './BrandMark';

/**
 * Full-screen brand loader — the Suspense fallback while a route chunk loads.
 *
 * Delay-appear: the whole thing stays unmounted for the first 150 ms, so a warm
 * (cached) chunk that resolves in a couple of frames never flashes the takeover.
 * Only genuinely slow loads ever reveal it. The progress bar is indeterminate
 * (see .bk-loader-bar in index.css) — an unknown-duration wait must never claim
 * completion. The visible "BAKAR" is decoration; the localized status text lives
 * in an sr-only node so screen readers hear "Загрузка…", not the brand.
 */
/** The loader visual itself — brand mark, indeterminate bar, sr-only status. */
function LoaderVisual() {
  const { ui } = useLocale();
  return (
    <div className="bk-loader" role="status" aria-live="polite" aria-busy="true">
      <BrandMark className="bk-loader-mark" />
      <div className="bk-loader-bar">
        <i />
      </div>
      <div className="bk-loader-word" aria-hidden="true">BAKAR</div>
      <span className="sr-only">{ui('common.loading')}</span>
    </div>
  );
}

export function PageLoader() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 150);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return <LoaderVisual />;
}

/**
 * Forced full-screen loader, shown for a minimum time on theme / language / page
 * changes (driven by lib/loader). Rendered once at the app root. It appears
 * instantly to fully mask the change, then fades out when the window elapses.
 * The mark/bar already honour reduced motion; only the fade-out is gated here.
 */
export function LoaderOverlay() {
  const visible = useLoaderVisible();
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="forced-loader"
          className="fixed inset-0 z-[300]"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
        >
          <LoaderVisual />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Shimmer placeholder block. Base colour + one shared sweep (`.bk-shimmer`),
 *  which also carries the reduced-motion gate. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={`bk-shimmer rounded-[12px] bg-surface-2 ${className ?? ''}`} />;
}

type SkeletonVariant = 'category' | 'product' | 'cert';

/**
 * Loading grid. Each variant mirrors the EXACT geometry of the real grid it
 * precedes — columns, gap, radius, image aspect, padding, chip/footer rows — so
 * content lands in place with no layout shift.
 *   category (default) — Home assortment: bk-card, aspect-[4/3], sm:2/lg:3
 *   product            — catalogue packshots: aspect-square, cols-2/lg:3/xl:4
 *   cert               — certificate cards: portrait aspect-[3/4] preview
 */
export function CardGridSkeleton({ count = 6, variant = 'category' }: { count?: number; variant?: SkeletonVariant }) {
  if (variant === 'product') {
    return (
      <div>
        {/* Mirrors a real catalogue <section>: a category header (border-b) then
            the grid at mt-7, so the first product row lands where data will put it. */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line pb-4">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="mt-7 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex h-full flex-col overflow-hidden rounded-[22px] border border-line bg-surface">
            <Skeleton className="aspect-square rounded-none" />
            <div className="flex flex-1 flex-col p-4 sm:p-5">
              <Skeleton className="h-[18px] w-2/3" />
              <Skeleton className="mt-2 h-3 w-full" />
              <Skeleton className="mt-1.5 h-3 w-4/5" />
              <div className="mt-3 flex gap-1.5">
                <Skeleton className="h-5 w-10 rounded-full" />
                <Skeleton className="h-5 w-10 rounded-full" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
              <div className="mt-auto border-t border-line pt-3.5">
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>
    );
  }

  if (variant === 'cert') {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex h-full flex-col rounded-[22px] border border-line bg-surface p-4 sm:p-5">
            <Skeleton className="aspect-[3/4] w-full rounded-[16px]" />
            <div className="mt-5 flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-5 w-2/3" />
            </div>
            <Skeleton className="mt-2 h-3 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bk-card overflow-hidden">
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="space-y-3 p-6">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Floating "back to top" button that appears after scrolling. */
export function BackToTop() {
  const { ui } = useLocale();
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 10 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 10 }}
          // Hover/press go through Framer, not CSS: this is a motion element, so
          // it holds an inline transform that a CSS :active/:hover rule can't beat.
          whileHover={reduce ? undefined : { y: -2 }}
          whileTap={reduce ? undefined : { scale: 0.95 }}
          transition={{ duration: 0.25, ease: EASE }}
          onClick={() => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })}
          aria-label={ui('a11y.backTop')}
          className="fixed bottom-6 right-6 z-50 grid h-12 w-12 place-items-center rounded-full bg-accent text-on-accent"
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
