"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { gsap, useGSAP, ScrollSmoother, prefereMovimentoReduzido } from "../lib/gsap";

interface VideoModalProps {
  youtubeId: string | null;
  titulo?: string;
  onClose: () => void;
}

export function VideoModal({ youtubeId, titulo, onClose }: VideoModalProps) {
  const raizRef = useRef<HTMLDivElement>(null);
  const fecharRef = useRef<HTMLButtonElement>(null);
  const focoAnterior = useRef<HTMLElement | null>(null);

  // Trava a rolagem, fecha no Esc e devolve o foco ao botão que abriu
  useEffect(() => {
    if (!youtubeId) return;
    focoAnterior.current = document.activeElement as HTMLElement | null;
    const smoother = ScrollSmoother.get();
    smoother?.paused(true);
    document.body.style.overflow = "hidden";
    fecharRef.current?.focus();

    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        // só existe um controle nosso no modal além do player
        const focaveis = raizRef.current?.querySelectorAll<HTMLElement>("button, iframe");
        if (!focaveis?.length) return;
        const primeiro = focaveis[0]!;
        const ultimo = focaveis[focaveis.length - 1]!;
        if (e.shiftKey && document.activeElement === primeiro) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primeiro.focus();
        }
      }
    };
    window.addEventListener("keydown", tecla);

    return () => {
      window.removeEventListener("keydown", tecla);
      document.body.style.overflow = "";
      smoother?.paused(false);
      focoAnterior.current?.focus?.();
    };
  }, [youtubeId, onClose]);

  // Modal fica centrado: entra de 0.96 com fade, sem origem no gatilho
  useGSAP(
    () => {
      if (!youtubeId) return;
      const reduzido = prefereMovimentoReduzido();
      gsap.fromTo(
        "[data-fundo]",
        { opacity: 0 },
        { opacity: 1, duration: reduzido ? 0.15 : 0.25, ease: "power2.out" },
      );
      gsap.fromTo(
        "[data-caixa]",
        reduzido ? { opacity: 0 } : { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: reduzido ? 0.15 : 0.35, ease: "expo.out" },
      );
    },
    { scope: raizRef, dependencies: [youtubeId] },
  );

  if (!youtubeId) return null;

  return (
    <div
      ref={raizRef}
      role="dialog"
      aria-modal="true"
      aria-label={titulo || "Vídeo sobre descarte correto"}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
    >
      <div
        data-fundo
        className="absolute inset-0 bg-forest-900/90"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        data-caixa
        className="relative w-full max-w-4xl rounded-[28px] border border-paper-50/15 bg-forest-900 p-2"
      >
        <div className="flex items-center justify-between gap-4 py-2 pl-4 pr-2">
          <p className="truncate text-sm font-medium text-paper-50">{titulo || "Vídeo"}</p>
          <button
            ref={fecharRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar vídeo"
            className="btn-round h-11 w-11 text-sand-200 hover:bg-paper-50/10 hover:text-paper-50"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-[20px] bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
            title={titulo || "Vídeo sobre reciclagem"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
