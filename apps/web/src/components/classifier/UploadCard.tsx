"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, RefreshCw, ScanLine, ShieldCheck, TriangleAlert } from "lucide-react";
import { gsap, useGSAP, prefereMovimentoReduzido } from "../../lib/gsap";
import { ACEITA_INPUT, type ImagemPreparada } from "../../lib/imagem";
import { GlassIcon } from "../GlassIcon";

export function UploadCard({
  imagem,
  analisando,
  acordando,
  erro,
  onArquivo,
  onAnalisar,
}: {
  imagem: ImagemPreparada | null;
  analisando: boolean;
  acordando: boolean;
  erro: string | null;
  onArquivo: (arquivo: File | undefined) => void;
  onAnalisar: () => void;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);

  // Pré-visualização entra de 0.96 com fade quando a foto muda
  useGSAP(
    () => {
      if (!imagem) return;
      const reduzido = prefereMovimentoReduzido();
      gsap.fromTo(
        "[data-previa]",
        reduzido ? { opacity: 0 } : { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: reduzido ? 0.15 : 0.5, ease: "expo.out" },
      );
    },
    { scope: raiz, dependencies: [imagem] },
  );

  // Linha de varredura: vai e volta enquanto analisa, morta com kill() quando a resposta chega
  useGSAP(
    () => {
      if (!analisando || prefereMovimentoReduzido()) return;
      const caixa = raiz.current?.querySelector<HTMLElement>("[data-previa]");
      if (!caixa) return;
      const varredura = gsap.fromTo(
        "[data-varredura]",
        { y: 0, opacity: 1 },
        { y: () => caixa.clientHeight - 2, duration: 1.5, ease: "sine.inOut", repeat: -1, yoyo: true },
      );
      return () => {
        varredura.kill();
      };
    },
    { scope: raiz, dependencies: [analisando] },
  );

  const escolher = () => arquivoRef.current?.click();

  return (
    <div ref={raiz} className="glass-surface flex h-full flex-col justify-between p-3 rounded-[var(--radius-card)] overflow-hidden">
      <input
        ref={arquivoRef}
        type="file"
        accept={ACEITA_INPUT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          onArquivo(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          onArquivo(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {!imagem ? (
        <div
          role="button"
          tabIndex={0}
          aria-label="Enviar foto: arraste uma imagem para cá ou pressione Enter para escolher"
          onClick={escolher}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              escolher();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastando(false);
            onArquivo(e.dataTransfer.files?.[0]);
          }}
          className={`group relative flex flex-1 min-h-0 cursor-pointer flex-col justify-between rounded-[22px] border border-dashed p-6 transition-all duration-300 sm:p-8 ${
            arrastando
              ? "border-mint-300 bg-mint-300/[0.12] shadow-[0_0_30px_-5px_rgba(150,188,161,0.35)]"
              : "border-paper-50/25 bg-paper-50/[0.03] backdrop-blur-sm hover:border-mint-300/70 hover:bg-paper-50/[0.06] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.12)]"
          }`}
        >
          <GlassIcon
            plate="tilt"
            size={52}
            radius={18}
            tilt="-10deg"
            spread={0.25}
            plateBg="linear-gradient(135deg, rgba(150, 188, 161, 0.45) 0%, rgba(47, 90, 69, 0.75) 100%)"
            ink="var(--mint-300)"
            className="transition-transform duration-300 group-hover:scale-105"
          >
            <ImagePlus className="h-6 w-6" strokeWidth={1.6} aria-hidden="true" />
          </GlassIcon>

          <div className="w-full">
            <p className="titulo text-2xl text-paper-50 sm:text-3xl">
              {arrastando ? "Pode soltar" : "Arraste a foto para cá"}
            </p>
            <p className="mt-2.5 max-w-md text-sm leading-relaxed text-sand-200 text-pretty">
              Chegue perto do objeto e use boa luz. Vale mais de um item na mesma foto.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  escolher();
                }}
                className="btn-pill-solid px-6 text-sm shadow-[0_8px_20px_-6px_rgba(0,0,0,0.4),inset_0_1px_1px_0_rgba(255,255,255,0.7)]"
              >
                Escolher foto
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraRef.current?.click();
                }}
                className="btn-pill-outline px-6 text-sm md:hidden backdrop-blur-md"
              >
                <Camera className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                Tirar foto
              </button>
            </div>
            <p className="mt-4 text-xs font-medium text-sand-200/60">JPG, PNG, WEBP ou HEIC, até 8 MB</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0 flex-col justify-between">
          <div
            data-previa
            className="relative flex-1 min-h-0 overflow-hidden rounded-[20px] border border-paper-50/10 bg-forest-900"
          >
            {imagem.previa ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagem.previa}
                alt="Foto que você enviou para análise"
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <GlassIcon
                  plate="circle"
                  size={54}
                  radius="50%"
                  spread={0.25}
                  plateBg="linear-gradient(135deg, rgba(150, 188, 161, 0.4) 0%, rgba(47, 90, 69, 0.7) 100%)"
                  ink="var(--mint-300)"
                >
                  <ImagePlus className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
                </GlassIcon>
                <p className="text-sm font-medium text-paper-50">{imagem.nome}</p>
                <p className="text-xs text-sand-200/70">
                  Seu navegador não mostra prévia de HEIC, mas a foto pode ser analisada.
                </p>
              </div>
            )}

            {analisando && (
              <>
                <div className="absolute inset-0 bg-forest-900/35" aria-hidden="true" />
                <div
                  data-varredura
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-0.5 bg-mint-300 opacity-0"
                />
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-3 pb-3 pt-5">
            <button type="button" disabled={analisando} onClick={escolher} className="btn-pill-outline px-5 text-sm backdrop-blur-md shadow-sm">
              <RefreshCw className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              Trocar
            </button>
            <button type="button" disabled={analisando} onClick={onAnalisar} className="btn-pill-solid px-7 text-sm shadow-[0_8px_20px_-6px_rgba(0,0,0,0.4),inset_0_1px_1px_0_rgba(255,255,255,0.7)]">
              <ScanLine className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              {analisando ? "Analisando" : "Analisar"}
            </button>
          </div>
        </div>
      )}

      <div aria-live="polite" className="px-3">
        {acordando && (
          <p className="pb-3 text-sm leading-relaxed text-paper-50">
            Preparando o analisador, só um instante.
          </p>
        )}
        {erro && (
          <p role="alert" className="flex gap-2.5 pb-3 text-sm leading-relaxed text-paper-50">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-sand-200" strokeWidth={1.5} aria-hidden="true" />
            {erro}
          </p>
        )}
      </div>

      <p className="mt-2 flex items-center gap-2.5 border-t border-paper-50/15 px-3 pb-2 pt-4 text-xs text-sand-200/70">
        <ShieldCheck className="h-4 w-4 shrink-0 text-mint-300" strokeWidth={1.5} aria-hidden="true" />
        Sua foto é analisada e descartada na hora. Nada é salvo.
      </p>
    </div>
  );
}
