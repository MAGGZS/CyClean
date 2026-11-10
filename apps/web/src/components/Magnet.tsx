"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, MQ } from "../lib/gsap";

/**
 * Magnet do React Bits reescrito com GSAP (o original usa estado do React e
 * transition de CSS). Aqui o deslocamento vai por gsap.quickTo, direto no
 * transform, e só existe em ponteiro fino com movimento liberado.
 */
export function Magnet({
  children,
  forca = 0.22,
  className,
}: {
  children: ReactNode;
  forca?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();

      mm.add(`${MQ.movimento} and (hover: hover) and (pointer: fine)`, () => {
        const xTo = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });

        const mover = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * forca);
          yTo((e.clientY - (r.top + r.height / 2)) * forca);
        };
        const sair = () => {
          xTo(0);
          yTo(0);
        };

        el.addEventListener("pointermove", mover);
        el.addEventListener("pointerleave", sair);
        return () => {
          el.removeEventListener("pointermove", mover);
          el.removeEventListener("pointerleave", sair);
        };
      });
    },
    { scope: ref },
  );

  return (
    <span ref={ref} className={`inline-block will-change-transform ${className ?? ""}`}>
      {children}
    </span>
  );
}
