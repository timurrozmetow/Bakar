import { useCallback, useState, type ImgHTMLAttributes } from 'react';
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
 * Responsive <img>: serves width-appropriate webp variants, lazy-loads by
 * default, and fades in once the pixels actually decode (via `.bk-img` in
 * index.css) so photos ease out of the surface-2 box instead of popping.
 *
 * `priority` opts an image out of the fade for LCP: it renders fully opaque,
 * eager and high-priority. Use it for a clearly above-the-fold hero image; the
 * carousel hero uses HeroImage directly and never routes through here.
 */
export function Img({
  src,
  sizes = '100vw',
  alt = '',
  loading = 'lazy',
  priority = false,
  className,
  ...props
}: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { src?: string; priority?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  // A cached image can finish decoding before React binds onLoad; the ref
  // callback catches that case so it doesn't stay stranded at opacity 0.
  const ref = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete) setLoaded(true);
  }, []);

  if (!src) return null;

  if (priority) {
    return (
      <img
        src={mediaUrl(src)}
        srcSet={buildSrcSet(src)}
        sizes={sizes}
        alt={alt}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className={className}
        {...props}
      />
    );
  }

  return (
    <img
      ref={ref}
      src={mediaUrl(src)}
      srcSet={buildSrcSet(src)}
      sizes={sizes}
      alt={alt}
      loading={loading}
      decoding="async"
      // onError also clears the gate — a broken image must never sit invisible.
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)}
      className={`bk-img ${loaded ? 'is-loaded' : ''} ${className ?? ''}`}
      {...props}
    />
  );
}
