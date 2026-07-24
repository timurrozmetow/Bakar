import { mediaUrl } from '../lib/api';
import { buildSrcSet } from './Img';
import type { Banner } from '../lib/types';

/**
 * Breakpoints for art-directed banner artwork, narrowest first.
 *
 * Plain max-width queries are correct here because <picture> takes the first
 * matching <source> and stops. The preload hints in server/src/lib/spa.ts use
 * mutually exclusive ranges instead — preload links have no such precedence, so
 * overlapping queries there make the browser fetch every match. Both sides must
 * resolve a given viewport to the same file, otherwise it is downloaded twice.
 */
export const HERO_SOURCES = [
  { field: 'imageSm', media: '(max-width: 639px)' },
  { field: 'imageMd', media: '(max-width: 1023px)' },
  { field: 'imageLg', media: '(max-width: 1439px)' },
] as const;

/**
 * Hero artwork as a <picture>: one <source> per breakpoint the editor has
 * actually supplied, falling back to `image` everywhere else. Sources are
 * ordered narrowest-first because the browser takes the first match.
 */
export function HeroImage({ banner, eager }: { banner: Banner; eager: boolean }) {
  const fallback = banner.image;
  if (!fallback) return null;

  const sources = HERO_SOURCES
    // Skipping empty and duplicate entries keeps the markup honest: a <source>
    // pointing at the same file as the <img> would only add bytes.
    .filter(({ field }) => banner[field] && banner[field] !== fallback)
    .map(({ field, media }) => ({ media, src: banner[field] }));

  return (
    <picture>
      {sources.map(({ media, src }) => (
        <source key={media} media={media} srcSet={buildSrcSet(src) ?? mediaUrl(src)} sizes="100vw" />
      ))}
      <img
        src={mediaUrl(fallback)}
        srcSet={buildSrcSet(fallback)}
        sizes="100vw"
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        decoding="async"
      />
    </picture>
  );
}
