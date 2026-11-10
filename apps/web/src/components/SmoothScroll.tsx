"use client";

import { ScrollTrigger, useGSAP } from "../lib/gsap";

/**
 * Recalcula pontos de disparo do ScrollTrigger quando fontes e imagens terminam de carregar.
 * A rolagem é 100% nativa e acelerada por hardware, garantindo 60/120 FPS sem travamentos.
 */
export function SmoothScroll() {
  useGSAP(() => {
    // Pontos de disparo recalculados quando fontes e imagens terminam de carregar
    const recalcular = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(recalcular).catch(() => {});
    if (document.readyState === "complete") recalcular();
    else window.addEventListener("load", recalcular, { once: true });

    return () => window.removeEventListener("load", recalcular);
  });

  return null;
}
