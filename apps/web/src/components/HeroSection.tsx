"use client";

import { useRef } from "react";
import Image, { getImageProps } from "next/image";
import { ArrowDown, Play } from "lucide-react";
import { gsap, SplitText, useGSAP, MQ, rolarPara } from "../lib/gsap";
import { Navbar } from "./Navbar";
import { Noise } from "./Noise";
import { Magnet } from "./Magnet";

/** Vídeo do card do hero. Título e canal conferidos no YouTube. */
export const VIDEO_HERO = {
  id: "Go_xijAjy-k",
  titulo: "Ciclo de reciclagem da lata de alumínio",
  canal: "GrupoReciclaBR",
};

/**
 * Lido uma vez por carregamento de página (o StrictMode roda o efeito duas
 * vezes em dev, e a segunda leitura não pode contar como revisita).
 */
let revisitaCache: boolean | null = null;
function ehRevisita(): boolean {
  if (revisitaCache !== null) return revisitaCache;
  try {
    revisitaCache = sessionStorage.getItem("cyclean_visitou") === "1";
    sessionStorage.setItem("cyclean_visitou", "1");
  } catch {
    revisitaCache = false; // sessionStorage bloqueado: entrada completa
  }
  return revisitaCache;
}

interface HeroSectionProps {
  onAbrirVideo: (id: string, titulo: string) => void;
}

/**
 * Foto com direção de arte: paisagem no desktop, retrato no celular.
 * As duas camadas do hero (fundo e recorte) usam o mesmo enquadramento,
 * por isso as silhuetas do recorte caem exatamente sobre a foto.
 */
function FotoHero({
  desktop,
  mobile,
  alt,
  prioridade = false,
}: {
  desktop: string;
  mobile: string;
  alt: string;
  prioridade?: boolean;
}) {
  const comum = { alt, sizes: "100vw", priority: prioridade };
  const {
    props: { srcSet: srcSetDesktop },
  } = getImageProps({ ...comum, src: desktop, width: 2400, height: 1600 });
  const {
    props: { srcSet: srcSetMobile, ...resto },
  } = getImageProps({ ...comum, src: mobile, width: 1080, height: 1920 });

  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={srcSetDesktop} sizes="100vw" />
      <source srcSet={srcSetMobile} sizes="100vw" />
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img {...resto} className="absolute inset-0 h-full w-full object-cover object-center" />
    </picture>
  );
}

export function HeroSection({ onAbrirVideo }: HeroSectionProps) {
  const raiz = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const PECAS = "[data-fundo], [data-palavra], [data-recorte], [data-apoio], [data-video], #site-navbar";

      // Movimento reduzido: tudo aparece com um fade curto, sem deslocamento
      mm.add(MQ.reduzido, () => {
        gsap.fromTo(PECAS, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15, ease: "none" });
      });

      mm.add(MQ.movimento, () => {
        const split = SplitText.create("[data-palavra]", { type: "chars", charsClass: "will-change-transform" });

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl
          // 1. fundo: fade + zoom suave de câmera
          .fromTo(
            "[data-fundo]",
            { autoAlpha: 0, scale: 1.06 },
            { autoAlpha: 1, scale: 1, duration: 1.6, ease: "power2.out" },
            0,
          )
          // 2. letras sobem uma a uma de forma fluida e natural
          .set("[data-palavra]", { autoAlpha: 1 }, 0.25)
          .fromTo(
            split.chars,
            { opacity: 0, yPercent: 40, filter: "blur(6px)" },
            { opacity: 1, yPercent: 0, filter: "blur(0px)", duration: 1.1, stagger: 0.07, ease: "power3.out" },
            "<",
          )
          // 3. troncos e galhos da própria foto surgem na frente das letras
          .fromTo(
            "[data-recorte]",
            { autoAlpha: 0, scale: 1.03, y: 25 },
            { autoAlpha: 1, scale: 1, y: 0, duration: 1.1, ease: "power3.out" },
            0.7,
          )
          // 4. frase e botão
          .fromTo(
            "[data-apoio] > *",
            { autoAlpha: 0, y: 16 },
            { autoAlpha: 1, y: 0, duration: 0.85, stagger: 0.1, ease: "power2.out" },
            "<+=0.2",
          )
          .set("[data-apoio]", { autoAlpha: 1 }, "<")
          // 5. nav desce do topo; card de vídeo entra pela direita
          .fromTo("#site-navbar", { autoAlpha: 0, y: -20 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out" }, 1.1)
          .fromTo("[data-video]", { autoAlpha: 0, x: 30 }, { autoAlpha: 1, x: 0, duration: 0.8, ease: "power2.out" }, "<");

        // Saída do hero: o fundo escurece com a camada sólida conforme rola
        gsap.to("[data-sombra]", {
          opacity: 0.6,
          ease: "none",
          scrollTrigger: { trigger: raiz.current, start: "top top", end: "bottom top", scrub: true },
        });
        // Indicador de rolagem: o traço se preenche com a rolagem
        gsap.fromTo(
          "[data-rolar-traco]",
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: raiz.current, start: "top top", end: "40% top", scrub: true },
          },
        );

        return () => split.revert();
      });
    },
    { scope: raiz },
  );

  return (
    <section
      id="inicio"
      ref={raiz}
      className="frame flex h-svh min-h-[620px] flex-col"
    >
      {/* Camada 1: foto de fundo. */}
      <div className="absolute inset-x-0 -inset-y-[12%] -z-10">
        <div data-fundo className="pre-anim absolute inset-0">
          <FotoHero
            desktop="/images/hero-forest.jpg"
            mobile="/images/hero-forest-mobile.jpg"
            alt="Floresta de pinheiros com neblina e luz entrando entre os troncos"
            prioridade
          />
          <div className="absolute inset-0 bg-forest-900/45" />
        </div>
      </div>

      {/* Camada 2: palavra gigante */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center pb-[14svh] md:pb-[6svh]"
      >
        <h1
          data-palavra
          className="pre-anim display select-none whitespace-nowrap text-paper-50"
          style={{ fontSize: "clamp(3.75rem, 18vw, 24rem)" }}
        >
          SEPARE
        </h1>
      </div>

      {/* Camada 3: recorte da mesma foto (troncos e galhos contra a neblina) na frente das letras */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -inset-y-[12%] -z-10"
      >
        <div data-recorte className="pre-anim absolute inset-0">
          <FotoHero desktop="/images/hero-depth.webp" mobile="/images/hero-depth-mobile.webp" alt="" />
        </div>
      </div>

      <div data-sombra aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-forest-900 opacity-0" />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <Noise />
      </div>

      <Navbar />

      {/* Base do hero: apoio à esquerda, rolagem ao centro, vídeo à direita */}
      <div className="mt-auto grid grid-cols-1 items-end gap-6 p-5 md:grid-cols-[1fr_auto_1fr] md:gap-8 md:p-9">
        <div data-apoio className="pre-anim max-w-[26rem]">
          <p className="rotulo text-mint-300">Coleta seletiva / Padrão CONAMA 275</p>
          <p className="mt-3 text-base leading-relaxed text-paper-50 md:text-lg">
            Fotografe o que você vai jogar fora. A gente diz em qual lixeira vai e como preparar.
          </p>
          <div className="mt-6">
            <Magnet>
              <a
                href="#descartar"
                onClick={(e) => {
                  e.preventDefault();
                  rolarPara("descartar");
                }}
                className="btn-pill-solid h-14 pl-7 pr-2 text-base"
              >
                Descartar agora
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-900 text-paper-50">
                  <ArrowDown className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                </span>
              </a>
            </Magnet>
          </div>
        </div>

        <div aria-hidden="true" className="hidden flex-col items-center gap-3 pb-1 md:flex">
          <span className="relative block h-12 w-px bg-paper-50/25">
            <span data-rolar-traco className="absolute inset-0 origin-top scale-y-0 bg-paper-50" />
          </span>
          <span className="rotulo text-sand-200">Role</span>
        </div>

        <div className="md:justify-self-end">
          <button
            type="button"
            data-video
            onClick={() => onAbrirVideo(VIDEO_HERO.id, VIDEO_HERO.titulo)}
            aria-label={`Assistir ao vídeo: ${VIDEO_HERO.titulo}`}
            className="pre-anim group flex w-full items-center gap-4 rounded-[28px] bg-forest-900/90 p-2 pr-5 text-left md:w-[22rem]"
          >
            <span className="relative block h-20 w-28 shrink-0 overflow-hidden rounded-[20px]">
              <Image
                src="/images/glass-card.jpg"
                alt=""
                fill
                sizes="112px"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              />
              <span className="absolute inset-0 bg-forest-900/30" />
              <span className="btn-round absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 bg-mint-300 text-forest-900 group-active:scale-95">
                <Play className="ml-0.5 h-3.5 w-3.5 fill-current" strokeWidth={0} aria-hidden="true" />
              </span>
            </span>
            <span className="min-w-0">
              <span className="rotulo block text-mint-300">Vídeo</span>
              <span className="mt-1 block text-sm font-semibold leading-snug text-paper-50">
                {VIDEO_HERO.titulo}
              </span>
              <span className="mt-0.5 block text-xs text-sand-200">{VIDEO_HERO.canal}</span>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
