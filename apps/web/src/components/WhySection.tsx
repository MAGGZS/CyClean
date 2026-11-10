"use client";

import { useRef } from "react";
import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { LISTA_LIXEIRAS } from "@descarta/shared";
import { gsap, SplitText, useGSAP, MQ, rolarPara } from "../lib/gsap";
import { CountUp } from "./CountUp";
import { Noise } from "./Noise";

/**
 * Dados do Panorama dos Resíduos Sólidos no Brasil 2024, da ABREMA (ano-base 2023).
 * Não alterar sem conferir na publicação.
 */
const FONTE = "ABREMA, Panorama dos Resíduos Sólidos no Brasil 2024 (ano-base 2023)";
const DADOS_MENORES = [
  { valor: 382, sufixo: "kg", texto: "por pessoa ao longo do ano" },
  { valor: 8, sufixo: "%", texto: "do que é gerado segue para a reciclagem" },
  { valor: 41, sufixo: "%", texto: "teve destino inadequado, como lixões" },
] as const;

const MOTIVOS = [
  {
    titulo: "Misturado, o reciclável vira rejeito",
    texto:
      "Papel engordurado e embalagem com resto de comida contaminam o que está junto. Na triagem, o lote sujo é recusado e segue para o aterro.",
  },
  {
    titulo: "Quem faz a triagem são pessoas",
    texto:
      "Grande parte do que o Brasil recicla passa pelas mãos de catadoras e catadores. Embalagem limpa e vidro embrulhado evitam cortes e adiantam o trabalho.",
  },
  {
    titulo: "Lata volta a ser lata",
    texto:
      "Alumínio e vidro podem ser fundidos de novo sem perder qualidade. Separado do jeito certo, o material entra outra vez na fábrica no lugar de matéria-prima nova.",
  },
] as const;

export function WhySection() {
  const raiz = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const umaVez = "play none none none";

      // Desktop: entrada suave e elegante com elevação e fade
      mm.add(MQ.desktop, () => {
        gsap.from("[data-vidro]", {
          autoAlpha: 0,
          y: 36,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: "[data-vidro]", start: "top 85%", toggleActions: umaVez },
        });
      });

      // Celular: entrada simples com menor deslocamento
      mm.add(MQ.mobile, () => {
        gsap.from("[data-vidro]", {
          autoAlpha: 0,
          y: 24,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: { trigger: "[data-vidro]", start: "top 88%", toggleActions: umaVez },
        });
      });

      mm.add(MQ.movimento, () => {
        // Título revelado linha a linha, com máscara
        const split = SplitText.create("[data-titulo]", {
          type: "lines",
          mask: "lines",
        });

        gsap.from(split.lines, {
          yPercent: 105,
          duration: 1.1,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: "[data-titulo]", start: "top 82%", toggleActions: umaVez },
        });

        gsap.from("[data-texto] > *", {
          autoAlpha: 0,
          y: 18,
          duration: 0.85,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: { trigger: "[data-texto]", start: "top 85%", toggleActions: umaVez },
        });

        gsap.from("[data-dado]", {
          autoAlpha: 0,
          y: 24,
          duration: 0.9,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: { trigger: "[data-dados]", start: "top 85%", toggleActions: umaVez },
        });

        // Faixa das lixeiras: bloco a bloco, da esquerda para a direita
        gsap.from("[data-lixeira]", {
          autoAlpha: 0,
          x: -20,
          duration: 0.8,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: { trigger: "[data-faixa]", start: "top 85%", toggleActions: umaVez },
        });

        gsap.from("[data-motivo]", {
          autoAlpha: 0,
          y: 24,
          duration: 0.9,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: { trigger: "[data-motivos]", start: "top 82%", toggleActions: umaVez },
        });

        return () => split.revert();
      });
    },
    { scope: raiz },
  );

  return (
    <section id="por-que" ref={raiz} className="frame">
      {/* Fundo de folhagem com camada sólida */}
      <div className="absolute inset-x-0 -inset-y-[12%] -z-10">
        <Image
          src="/images/foliage-wide.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-forest-900/55" />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <Noise />
      </div>

      <div className="px-5 py-16 md:px-9 md:py-24 lg:pr-20">
        {/* Card de vidro: foto à esquerda, texto à direita */}
        <div
          data-vidro
          className="glass-surface grid grid-cols-1 gap-8 p-3 md:grid-cols-12 md:gap-12"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-[16px] md:col-span-5 md:aspect-auto md:min-h-[30rem]">
            <Image
              src="/images/glass-card.jpg"
              alt="Quatro lixeiras de coleta seletiva lado a lado: amarela, azul, vermelha e verde"
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover"
            />
          </div>

          <div className="flex flex-col justify-center px-3 pb-6 md:col-span-7 md:py-12 md:pl-0 md:pr-12">
            <p className="rotulo text-mint-300">O caminho do que você joga fora</p>
            <h2
              data-titulo
              className="titulo mt-5 text-paper-50"
              style={{ fontSize: "clamp(3rem, 7.2vw, 7rem)" }}
            >
              Por que
              <br />
              separar?
            </h2>

            <div data-texto>
              <hr className="mt-8 border-0 border-t border-paper-50/20" />
              <p className="mt-8 max-w-[34rem] text-base leading-relaxed text-paper-50 md:text-lg">
                Reciclável misturado com resto de comida se contamina. Perde valor, é recusado na triagem
                e acaba no aterro ou no lixão, junto com o que não tinha mais jeito.
              </p>
              <p className="mt-4 max-w-[34rem] text-base leading-relaxed text-sand-200 md:text-lg">
                Separar em casa é a parte do caminho que depende de você. Leva um minuto e decide se a
                embalagem volta como matéria-prima.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#descartar"
                  onClick={(e) => {
                    e.preventDefault();
                    rolarPara("descartar");
                  }}
                  className="btn-pill-solid px-6 text-sm"
                >
                  Descartar agora
                </a>
                <a
                  href="#cores"
                  onClick={(e) => {
                    e.preventDefault();
                    rolarPara("cores");
                  }}
                  className="btn-pill-outline px-6 text-sm"
                >
                  Ver as cores das lixeiras
                  <ArrowDown className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Números: um grande, três menores */}
        <div data-dados className="mt-20 grid grid-cols-6 gap-x-6 gap-y-10 md:mt-28 lg:grid-cols-12">
          <div data-dado className="col-span-6 lg:col-span-6">
            <p className="display text-paper-50" style={{ fontSize: "clamp(5rem, 14vw, 13rem)" }}>
              <CountUp valor={81} />
            </p>
            <p className="titulo mt-3 text-2xl text-paper-50 md:text-3xl">milhões de toneladas</p>
            <p className="mt-2 max-w-sm text-base leading-relaxed text-sand-200">
              de resíduos urbanos gerados no Brasil em um ano
            </p>
          </div>

          {DADOS_MENORES.map((d) => (
            <div
              key={d.texto}
              data-dado
              className="col-span-3 border-t border-paper-50/20 pt-5 sm:col-span-2 lg:self-end"
            >
              <p className="titulo text-5xl text-paper-50 md:text-6xl">
                <CountUp valor={d.valor} />
                <span className="ml-1 text-2xl text-mint-300 md:text-3xl">{d.sufixo}</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-sand-200">{d.texto}</p>
            </div>
          ))}

          <p className="col-span-6 text-xs text-sand-200 lg:col-span-12">Fonte dos quatro dados: {FONTE}.</p>
        </div>

        {/* Guia de cores das lixeiras */}
        <div id="cores" className="mt-20 scroll-mt-8 md:mt-28">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h3 className="titulo text-3xl text-paper-50 md:text-5xl">Cada cor, um material</h3>
            <p className="max-w-sm text-sm leading-relaxed text-sand-200 md:text-right">
              Padrão nacional de cores da coleta seletiva, definido pela Resolução CONAMA nº 275/2001.
            </p>
          </div>

          <ul
            data-faixa
            className="sem-barra mt-8 flex snap-x overflow-x-auto rounded-[28px]"
            aria-label="Cores das lixeiras e o material de cada uma"
          >
            {LISTA_LIXEIRAS.map((l) => (
              <li
                key={l.cor}
                data-lixeira
                className="flex h-56 min-w-[8.5rem] flex-1 lg:min-w-0 snap-start flex-col justify-between p-4 md:h-72"
                style={{ backgroundColor: l.hex, color: l.tinta }}
              >
                <span className="rotulo">{l.nome}</span>
                <span className="text-base font-semibold leading-tight">{l.material}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-sand-200 lg:hidden">Deslize para ver as dez cores.</p>
        </div>

        {/* Motivos: lista com fios, não grade de cards */}
        <div data-motivos className="mt-20 md:mt-28">
          {MOTIVOS.map((m) => (
            <div
              key={m.titulo}
              data-motivo
              className="grid grid-cols-1 gap-3 border-t border-paper-50/20 py-8 md:grid-cols-12 md:gap-8 md:py-10"
            >
              <h3 className="titulo text-2xl text-paper-50 md:col-span-6 md:text-4xl">{m.titulo}</h3>
              <p className="text-base leading-relaxed text-sand-200 md:col-span-5 md:col-start-8">
                {m.texto}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
