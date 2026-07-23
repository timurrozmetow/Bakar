/**
 * Bakar logo mark.
 *
 * The artwork is the supplied logo/black.png, shipped trimmed and resized as
 * public/logo/bakar-mark.png. It is painted through a CSS mask (see .bk-mark in
 * index.css), so the single monochrome file takes whatever colour the call site
 * sets — `text-accent` in the header, white on the dark footer, and so on.
 * Callers keep the same API as the hand-drawn SVG this replaced.
 */
export function BrandMark({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <span className={`bk-mark ${className ?? ''}`} style={style} aria-hidden="true" />;
}
