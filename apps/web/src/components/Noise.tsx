/**
 * Granulação sutil por cima das fotos. Baseado no Noise do React Bits, trocado
 * de canvas animado por um SVG estático (feTurbulence): mesmo efeito visual,
 * sem loop de animação e sem custo de CPU.
 */
const GRAO =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function Noise({ opacity = 0.07 }: { opacity?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 mix-blend-overlay"
      style={{ backgroundImage: GRAO, backgroundSize: "240px 240px", opacity }}
    />
  );
}
