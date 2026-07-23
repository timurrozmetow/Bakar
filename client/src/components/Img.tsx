import type { ImgHTMLAttributes } from 'react';
import { mediaUrl } from '../lib/api';

const WIDTHS = [320, 480, 640, 960, 1280, 1600];

/** Builds a srcset against the server's on-the-fly resize endpoint (/img/<file>?w=). */
export function buildSrcSet(path?: string): string | undefined {
  if (!path || !path.startsWith('/uploads/')) return undefined;
  const name = path.slice('/uploads/'.length);
  if (!/\.(webp|jpe?g|png|avif|gif)$/i.test(name)) return undefined;
  return WIDTHS.map((w) => `/img/${name}?w=${w} ${w}w`).join(', ');
}

/**
 * Responsive <img>: serves width-appropriate webp variants and lazy-loads by default.
 * Falls back to the plain upload URL for non-resizable sources.
 */
export function Img({
  src,
  sizes = '100vw',
  alt = '',
  loading = 'lazy',
  ...props
}: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { src?: string }) {
  if (!src) return null;
  return (
    <img
      src={mediaUrl(src)}
      srcSet={buildSrcSet(src)}
      sizes={sizes}
      alt={alt}
      loading={loading}
      decoding="async"
      {...props}
    />
  );
}
