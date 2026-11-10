"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, RefreshCw, ScanLine, ShieldCheck, TriangleAlert } from "lucide-react";
import { gsap, useGSAP, prefereMovimentoReduzido } from "../../lib/gsap";
import { ACEITA_INPUT, type ImagemPreparada } from "../../lib/imagem";

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
    <div ref={raiz} className="glass-surface flex flex-col p-3">
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
          className={`flex min-h-[20rem] cursor-pointer flex-col items-start justify-between rounded-[16px] border border-dashed p-6 transition-colors duration-200 md:min-h-[24rem] lg:min-h-[32rem] ${
            arrastando ? "border-mint-300 bg-paper-50/10" : "border-paper-50/30 hover:border-paper-50/60"
          }`}
        >
          <ImagePlus className="h-8 w-8 text-mint-300" strokeWidth={1.25} aria-hidden="true" />

          <div className="w-full">
            <p className="titulo text-3xl text-paper-50">
              {arrastando ? "Pode soltar" : "Arraste a foto para cá"}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-sand-200">
              Chegue perto do objeto e use boa luz. Vale mais de um item na mesma foto.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  escolher();
                }}
                className="btn-pill-solid px-6 text-sm"
              >
                Escolher foto
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraRef.current?.click();
                }}
                className="btn-pill-outline px-6 text-sm md:hidden"
              >
                <Camera className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                Tirar foto
              </button>
            </div>
            <p className="mt-4 text-xs text-sand-200">JPG, PNG, WEBP ou HEIC, até 8 MB</p>
          </div>
        </div>
      ) : (
        <div>
          <div
            data-previa
            className="relative aspect-[4/3] overflow-hidden rounded-[16px] bg-forest-900"
          >
            {imagem.previa ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagem.previa}
                alt="Foto que você enviou para análise"
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                <ImagePlus className="h-7 w-7 text-mint-300" strokeWidth={1.25} aria-hidden="true" />
                <p className="text-sm text-paper-50">{imagem.nome}</p>
                <p className="text-xs text-sand-200">
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
            <button type="button" disabled={analisando} onClick={escolher} className="btn-pill-outline px-5 text-sm">
              <RefreshCw className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              Trocar
            </button>
            <button type="button" disabled={analisando} onClick={onAnalisar} className="btn-pill-solid px-7 text-sm">
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

      <p className="mt-1 flex items-center gap-2.5 border-t border-paper-50/15 px-3 pb-2 pt-4 text-xs text-sand-200">
        <ShieldCheck className="h-4 w-4 shrink-0 text-mint-300" strokeWidth={1.5} aria-hidden="true" />
        Sua foto é analisada e descartada na hora. Nada é salvo.
      </p>
    </div>
  );
}
