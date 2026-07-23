import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { ThemeProvider } from './lib/theme';
import { LocaleProvider } from './lib/i18n';
import { MotionProvider } from './lib/motion';
import './index.css';

// Dynamic import so the devtools never reach a production build at all.
const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LocaleProvider>
          <MotionProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </MotionProvider>
          {import.meta.env.DEV && (
            <Suspense fallback={null}>
              <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
            </Suspense>
          )}
        </LocaleProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
