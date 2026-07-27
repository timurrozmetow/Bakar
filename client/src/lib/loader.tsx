import { useSyncExternalStore } from 'react';

/**
 * Tiny store that drives the forced full-screen loader.
 *
 * The site deliberately shows the brand loader for a minimum time whenever the
 * visitor switches theme, language or page — a requested, intentional pause
 * (the underlying operations are instant, since site data is embedded). Kept as
 * a module singleton rather than context so any handler can trigger it without
 * provider plumbing; the overlay is rendered once at the app root (LoaderOverlay).
 *
 * To change or disable the pause, edit LOADER_MIN_MS (0 effectively turns it off).
 */
export const LOADER_MIN_MS = 2000;

let visible = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** Show the loader for at least `ms`. Repeated calls restart the window. */
export function showLoader(ms: number = LOADER_MIN_MS) {
  if (ms <= 0) return;
  visible = true;
  emit();
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    visible = false;
    timer = null;
    emit();
  }, ms);
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
