/** Bakar logo mark — the wheat-burst + mountain glyph, ported 1:1 from the design. */
export function BrandMark({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const petals = [-12, 12, -40, 40, -68, 68, -96, 96];
  return (
    <svg className={className} style={style} viewBox="0 0 120 130" fill="currentColor" aria-hidden="true">
      {petals.map((deg) => (
        <path
          key={deg}
          d="M0 -16 C6.2 -7,6.2 7,0 16 C-6.2 7,-6.2 -7,0 -16 Z"
          transform={`rotate(${deg} 60 78) translate(60 46)`}
        />
      ))}
      <path d="M43 72 C44 55,76 55,77 72 C71 63,66 65,60 65 C54 65,49 63,43 72 Z" />
      <path d="M60 73 L104 108 L87 108 L60 86 L33 108 L16 108 Z" />
    </svg>
  );
}
