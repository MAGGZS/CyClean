"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, rolarPara } from "../lib/gsap";

const SECOES = [
  { id: "inicio", nome: "Início" },
  { id: "por-que", nome: "Por que separar" },
  { id: "descartar", nome: "Descartar" },
] as const;

/**
 * Indicador lateral: um traço por seção, preenchido pelo progresso do
 * ScrollTrigger daquela seção. Fica fora do #smooth-content (é fixed).
 */
export function ScrollProgress() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const raiz = ref.current;
      if (!raiz) return;

      SECOES.forEach(({ id }) => {
        const secao = document.getElementById(id);
        const barra = raiz.querySelector<HTMLElement>(`[data-barra="${id}"]`);
        const item = raiz.querySelector<HTMLElement>(`[data-item="${id}"]`);
        if (!secao || !barra || !item) return;

        const preencher = gsap.quickSetter(barra, "scaleY");
        ScrollTrigger.create({
          trigger: secao,
          start: "top center",
          end: "bottom center",
          onUpdate: (self) => preencher(self.progress),
          onToggle: (self) => item.toggleAttribute("data-ativa", self.isActive),
          onRefresh: (self) => {
            preencher(self.progress);
            item.toggleAttribute("data-ativa", self.isActive);
          },
        });
      });
    },
    { scope: ref },
  );

  return (
    <nav
      ref={ref}
      aria-label="Progresso da página"
      className="fixed right-7 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
    >
      <ul className="flex flex-col gap-2">
        {SECOES.map(({ id, nome }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              data-item={id}
              onClick={(e) => {
                e.preventDefault();
                rolarPara(id);
              }}
              className="group relative flex h-14 w-6 items-center justify-center"
            >
              <span className="sr-only">{nome}</span>
              <span aria-hidden="true" className="relative block h-full w-px bg-paper-50/25">
                <span
                  data-barra={id}
                  className="absolute inset-0 origin-top scale-y-0 bg-mint-300"
                  style={{ width: 2, left: -0.5 }}
                />
              </span>
              <span
                aria-hidden="true"
                className="rotulo pointer-events-none absolute right-7 whitespace-nowrap rounded-full bg-forest-900 px-3 py-1.5 text-paper-50 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                {nome}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
