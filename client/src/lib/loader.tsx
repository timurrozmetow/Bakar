import { useSyncExternalStore } from 'react';

/**
 * Tiny store that drives the forced full-screen loader.
 *
 * The site deliberately shows the brand loader for a minimum time whenever the
 * visitor switches theme, language or page — a requested, intentional pause
 * (the underlying operations are instant, since site data is embedded). It also
 * covers the very first page load. Kept as a module singleton rather than
 * context so any handler can trigger it without provider plumbing; the overlay
 * is rendered once at the app root (LoaderOverlay).
 *
 * To change or disable the pause, edit LOADER_MIN_MS (0 effectively turns it off).
 */
export const LOADER_MIN_MS = 2000;

// Start visible so the very first render is the loader (no flash of content
// first), EXCEPT under /admin, which must not be gated. The pathname is read
// once as the app boots.
const startVisible =
  typeof location !== 'undefined' && !location.pathname.startsWith('/admin') && LOADER_MIN_MS > 0;

let visible = startVisible;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function arm(ms: number) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    visible = false;
    timer = null;
    emit();
  }, ms);
}

// Close the initial-load window. The overlay is already visible on first render,
// so this just schedules the reveal ~LOADER_MIN_MS later.
if (startVisible) arm(LOADER_MIN_MS);

/** Show the loader for at least `ms`. Repeated calls restart the window. */
export function showLoader(ms: number = LOADER_MIN_MS) {
  if (ms <= 0) return;
  visible = true;
  emit();
  arm(ms);
}

export function useLoaderVisible(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => visible,
    () => false,
  );
}
