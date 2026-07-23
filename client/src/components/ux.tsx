import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { AnimatePresence, motion } from '../lib/motion';
import { useLocale } from '../lib/i18n';
import { BrandMark } from './BrandMark';

/**
 * Full-screen brand loader, shown while a route chunk or the site data is still
 * loading. Ported from the original Bakar design (pulsing mark + progress bar).
 */
export function PageLoader() {
  return (
    <div className="bk-loader" role="status" aria-live="polite">
      <BrandMark className="bk-loader-mark" />
      <div className="bk-loader-bar">
        <i />
      </div>
      <div className="bk-loader-word">BAKAR</div>
    </div>
  );
}

/** Shimmer placeholder block. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-[12px] bg-surface-2 ${className ?? ''}`} />;
}

/** Card-grid skeleton used while site data loads. */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bk-card overflow-hidden">
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="space-y-3 p-6">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Thin accent progress bar at the very top, tied to scroll position.
 *
 * Where `animation-timeline: scroll()` is supported the bar is driven entirely
 * by CSS on the compositor and no JavaScript runs at all. The fallback below
 * never reads a layout property inside the scroll handler — page height is
 * measured only on resize — so scrolling cannot trigger a forced reflow.
 */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline', 'scroll()')) return;
    const el = ref.current;
    if (!el) return;

    let max = 0;
    let frame = 0;

    const measure = () => {
      max = document.documentElement.scrollHeight - window.innerHeight;
    };
    const paint = () => {
      frame = 0;
      el.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    measure();
    paint();
    const ro = new ResizeObserver(() => {
      measure();
      paint();
    });
    ro.observe(document.documentElement);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={ref} className="bk-scroll-progress" aria-hidden />;
}

/** Floating "back to top" button that appears after scrolling. */
export function BackToTop() {
  const { ui } = useLocale();
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
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={ui('a11y.backTop')}
          className="fixed bottom-6 right-6 z-50 grid h-12 w-12 place-items-center rounded-full bg-accent text-on-accent shadow-lg transition hover:-translate-y-0.5"
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
