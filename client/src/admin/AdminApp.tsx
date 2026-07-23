import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './auth';
import { Spinner } from './ui';
import { AdminLayout } from './AdminLayout';
import { LoginPage } from './LoginPage';
import { Dashboard } from './pages/Dashboard';
import { BannersPage } from './pages/BannersPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ProductsPage } from './pages/ProductsPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { RequestsPage } from './pages/RequestsPage';
import { PagesPage } from './pages/PagesPage';
import { ProfilePage } from './pages/ProfilePage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

/**
 * The whole admin panel, loaded as one lazy chunk.
 * Auth state lives here so public visitors never mount it (or hit /auth/me).
 * The toaster lives here too — only the admin raises toasts, and mounting it
 * globally put `sonner` in the bundle every public visitor downloads.
 */
export default function AdminApp() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route
          path=""
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="banners" element={<BannersPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="certificates" element={<CertificatesPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="pages" element={<PagesPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
