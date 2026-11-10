"use client";

import { useRef } from "react";
import { gsap, useGSAP, MQ } from "../lib/gsap";

const formatar = (n: number, casas: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

/**
 * CountUp do React Bits reescrito com GSAP + ScrollTrigger (o original usa
 * motion/useSpring). O valor final já vem no HTML, então sem JS ou com
 * movimento reduzido o número certo aparece do mesmo jeito.
 */
export function CountUp({
  valor,
  casas = 0,
  duracao = 1.6,
  className,
}: {
  valor: number;
  casas?: number;
  duracao?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();

      mm.add(MQ.movimento, () => {
        const obj = { v: 0 };
        el.textContent = formatar(0, casas);
        gsap.to(obj, {
          v: valor,
          duration: duracao,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = formatar(obj.v, casas);
          },
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
        return () => {
          el.textContent = formatar(valor, casas);
        };
      });
    },
    { scope: ref, dependencies: [valor, casas, duracao] },
  );

  return (
    <span ref={ref} className={`tnum ${className ?? ""}`}>
      {formatar(valor, casas)}
    </span>
  );
}
