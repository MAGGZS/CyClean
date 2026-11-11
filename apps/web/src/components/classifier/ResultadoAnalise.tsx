"use client";

import { useRef } from "react";
import Image from "next/image";
import { ArrowUpRight, Check, Play, TriangleAlert, X } from "lucide-react";
import { LIXEIRAS, type AnaliseCompleta, type ItemAnalise } from "@descarta/shared";
import { gsap, useGSAP, MQ } from "../../lib/gsap";

const CONFIANCA: Record<ItemAnalise["confianca"], string> = {
  alta: "Confiança alta",
  media: "Confiança média",
  baixa: "Confiança baixa",
};

/** Chip na cor oficial da lixeira, com um pulso de cor único ao aparecer. */
function ChipLixeira({ item }: { item: ItemAnalise }) {
  const ref = useRef<HTMLSpanElement>(null);
  const info = LIXEIRAS[item.cor_lixeira] ?? LIXEIRAS.cinza;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.movimento, () => {
        gsap
          .timeline({ delay: 0.15 })
          .fromTo("[data-chip]", { scale: 0.96, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: "back.out(2)" })
          .fromTo(
            "[data-pulso]",
            { scale: 1, opacity: 0.6 },
            { scaleX: 1.18, scaleY: 1.6, opacity: 0, duration: 0.7, ease: "power2.out" },
            "<",
          );
      });
    },
    { scope: ref },
  );

  return (
    <span ref={ref} className="relative inline-flex">
      <span
        data-pulso
        aria-hidden="true"
        className="absolute inset-0 rounded-full opacity-0"
        style={{ backgroundColor: info.hex }}
      />
      <span
        data-chip
        className="relative inline-flex min-h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold"
        style={{ backgroundColor: info.hex, color: info.tinta }}
      >
        <span className="sr-only">Lixeira: </span>
        {item.lixeira}
      </span>
    </span>
  );
}

function Lista({
  titulo,
  itens,
  icone,
}: {
  titulo: string;
  itens: string[];
  icone: "certo" | "errado";
}) {
  if (!itens.length) return null;
  const Icone = icone === "certo" ? Check : X;
  return (
    <div>
      <h5 className="rotulo text-sand-200">{titulo}</h5>
      <ul className="mt-3 space-y-2">
        {itens.map((texto) => (
          <li key={texto} className="flex gap-3 text-sm leading-relaxed text-paper-50">
            <Icone
              className={`mt-1 h-4 w-4 shrink-0 ${icone === "certo" ? "text-mint-300" : "text-sand-200"}`}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <span>{texto}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Item({ item }: { item: ItemAnalise }) {
  return (
    <article className="border-t border-paper-50/15 pt-6 first:border-t-0 first:pt-0">
      {/* 1. material + confiança  2. lixeira */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div>
          <h4 className="titulo text-2xl text-paper-50">{item.material}</h4>
          <p className="mt-1 text-xs text-sand-200">{CONFIANCA[item.confianca]}</p>
        </div>
        <ChipLixeira item={item} />
      </div>

      {/* 5. resíduo especial: não vai na coleta comum */}
      {item.residuo_especial && (
        <div
          role="note"
          className="mt-5 flex gap-3 rounded-[16px] p-4 text-sm leading-relaxed"
          style={{ backgroundColor: LIXEIRAS.laranja.hex, color: LIXEIRAS.laranja.tinta }}
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <p>
            <strong className="font-semibold">Não vai na coleta comum.</strong> Leve a um ponto de entrega
            próprio para esse tipo de resíduo. {item.observacao}
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {/* 3. como preparar */}
        <Lista titulo="Como preparar" itens={item.preparo} icone="certo" />
        {/* 4. erros comuns */}
        <Lista titulo="Erros comuns" itens={item.erros_comuns} icone="errado" />
      </div>

      {item.observacao && !item.residuo_especial && (
        <p className="mt-5 text-sm leading-relaxed text-sand-200">{item.observacao}</p>
      )}
    </article>
  );
}

export function ResultadoAnalise({
  dados,
  onAbrirVideo,
}: {
  dados: AnaliseCompleta;
  onAbrirVideo: (id: string, titulo: string) => void;
}) {
  return (
    <div className="glass-bubble w-full rounded-[20px] rounded-tl-[6px] p-5 sm:p-6">
      <p className="text-base leading-relaxed text-paper-50">{dados.mensagem}</p>

      {dados.itens.length > 0 && (
        <div className="mt-6 space-y-6">
          {dados.itens.map((item, i) => (
            <Item key={`${item.material}-${i}`} item={item} />
          ))}
        </div>
      )}

      {/* 6. referências: vídeos da biblioteca e fontes */}
      {dados.videos.length > 0 && (
        <div className="mt-8">
          <h5 className="rotulo text-sand-200">Para ver</h5>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {dados.videos.slice(0, 3).map((v) => (
              <li key={v.youtubeId}>
                <button
                  type="button"
                  onClick={() => onAbrirVideo(v.youtubeId, v.titulo)}
                  className="group flex w-full items-center gap-3 rounded-[16px] bg-forest-900/80 backdrop-blur-sm border border-paper-50/10 p-2 pr-4 text-left transition-all duration-200 hover:bg-forest-700/80 hover:border-mint-300/40"
                >
                  <span className="relative block h-14 w-24 shrink-0 overflow-hidden rounded-[10px] bg-forest-700">
                    <Image
                      src={`https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg`}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                    <span className="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-mint-300 text-forest-900">
                      <Play className="ml-0.5 h-3 w-3 fill-current" strokeWidth={0} aria-hidden="true" />
                    </span>
                  </span>
                  <span className="line-clamp-2 text-sm font-medium leading-snug text-paper-50">
                    <span className="sr-only">Assistir: </span>
                    {v.titulo}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {dados.fontes.length > 0 && (
        <div className="mt-8">
          <h5 className="rotulo text-sand-200">Fontes</h5>
          <ul className="mt-3 space-y-2">
            {dados.fontes.map((f) => (
              <li key={f.url}>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-1.5 text-sm text-mint-300 underline decoration-mint-300/40 underline-offset-4 transition-colors hover:decoration-mint-300"
                >
                  {f.titulo}
                  <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  <span className="sr-only">(abre em nova aba)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
