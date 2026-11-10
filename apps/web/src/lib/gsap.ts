"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

// Único lugar onde os plugins são registrados. Todo componente importa daqui.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, useGSAP);
}

/** Consultas usadas com gsap.matchMedia() em todos os componentes animados. */
export const MQ = {
  desktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
  mobile: "(max-width: 1023.98px) and (prefers-reduced-motion: no-preference)",
  movimento: "(prefers-reduced-motion: no-preference)",
  reduzido: "(prefers-reduced-motion: reduce)",
} as const;

/** Curvas do projeto: entrada, transição entre seções e microinteração. */
export const EASE = {
  entrada: "expo.out",
  secao: "power3.inOut",
  micro: "power2.out",
} as const;

export function prefereMovimentoReduzido(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MQ.reduzido).matches;
}

/** Rola até uma seção. Usa o ScrollSmoother quando ele está ativo (desktop). */
export function rolarPara(id: string) {
  const alvo = document.getElementById(id);
  if (!alvo) return;
  const smoother = ScrollSmoother.get();
  if (smoother) {
    smoother.scrollTo(alvo, true, "top top");
  } else {
    alvo.scrollIntoView({ behavior: prefereMovimentoReduzido() ? "auto" : "smooth", block: "start" });
  }
  history.replaceState(null, "", `#${id}`);
}

export { gsap, ScrollTrigger, ScrollSmoother, SplitText, useGSAP };
