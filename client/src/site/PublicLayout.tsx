import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, useReducedMotion, EASE } from '../lib/motion';
import { Header } from './Header';
import { Footer } from './Footer';
import { BackToTop } from '../components/ux';
import { useSiteData } from '../lib/queries';

export function PublicLayout() {
  const { data } = useSiteData();
  const { pathname } = useLocation();
  const reduce = useReducedMotion();

  // Scroll to top on route change.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  // The shell (header + footer) and each page render immediately; a page shows
  // its own matched skeleton while data loads (in prod the payload is embedded,
  // so there is no loading state). The full-screen PageLoader is reserved for
  // the App-level Suspense fallback that gates a lazy route chunk.
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Header />
      <main className="flex-1">
        <motion.div
          key={pathname}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <Outlet />
        </motion.div>
      </main>
      <Footer data={data} />
      <BackToTop />
    </div>
  );
}
