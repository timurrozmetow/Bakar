import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

// Public site
import { PublicLayout } from './site/PublicLayout';
import { Home } from './site/Home';
import { NotFound } from './site/NotFound';
import { PageLoader, LoaderOverlay } from './components/ux';

// Secondary public pages and the whole admin load on demand.
const Products = lazy(() => import('./site/Products').then((m) => ({ default: m.Products })));
const ProductDetail = lazy(() => import('./site/ProductDetail').then((m) => ({ default: m.ProductDetail })));
const About = lazy(() => import('./site/About').then((m) => ({ default: m.About })));
const Certificates = lazy(() => import('./site/Certificates').then((m) => ({ default: m.Certificates })));
const Contacts = lazy(() => import('./site/Contacts').then((m) => ({ default: m.Contacts })));
const AdminApp = lazy(() => import('./admin/AdminApp'));

export function App() {
  return (
    <>
      {/* Forced brand loader for theme/language/page changes — sits above all. */}
      <LoaderOverlay />
      <Suspense fallback={<PageLoader />}>
        <Routes>
        {/* Public website */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/contacts" element={<Contacts />} />
        </Route>

        {/* Admin — single lazy chunk with its own auth context */}
        <Route path="/admin/*" element={<AdminApp />} />

        <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
