import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import type { SiteData } from './types';

declare global {
  interface Window {
    __BAKAR_SITE__?: SiteData;
  }
}

/**
 * In production the server embeds the payload in the HTML shell, so the first
 * render costs no request at all. Read once at module load; from then on React
 * Query owns the data and refetches normally when the admin invalidates it.
 * Undefined under `vite dev`, where the shell comes from Vite — the query then
 * simply fetches as usual.
 */
const embeddedSite = typeof window === 'undefined' ? undefined : window.__BAKAR_SITE__;

/** Public aggregated site content (no auth). */
export function useSiteData() {
  return useQuery({
    queryKey: ['site'],
    queryFn: () => api.get<SiteData>('/public/site'),
    staleTime: 60_000,
    initialData: embeddedSite,
  });
}
