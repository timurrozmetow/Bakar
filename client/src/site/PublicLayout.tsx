import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from '../lib/motion';
import { Header } from './Header';
import { Footer } from './Footer';
import { ScrollProgress, BackToTop, PageLoader } from '../components/ux';
import { useSiteData } from '../lib/queries';

export function PublicLayout() {
  const { data, isLoading } = useSiteData();
  const { pathname } = useLocation();
  const reduce = useReducedMotion();

  // Scroll to top on route change.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  // First visit only — afterwards the query is cached, so navigation stays instant.
  if (isLoading) return <PageLoader />;

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <ScrollProgress />
      <Header />
      <main className="flex-1">
        <motion.div
          key={pathname}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>
      <Footer data={data} />
      <BackToTop />
    </div>
  );
}
