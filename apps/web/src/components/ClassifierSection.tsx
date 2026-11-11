"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { ArrowUp } from "lucide-react";
import type { AnaliseCompleta, MensagemChat } from "@descarta/shared";
import { gsap, useGSAP, MQ, prefereMovimentoReduzido } from "../lib/gsap";
import { prepararImagem, validarArquivo, type ImagemPreparada } from "../lib/imagem";
import { fetchAcordando, lerSSE } from "../lib/sse";
import { Noise } from "./Noise";
import { GlassIcon } from "./GlassIcon";
import { Marca } from "./Navbar";
import { UploadCard } from "./classifier/UploadCard";
import { ResultadoAnalise } from "./classifier/ResultadoAnalise";

type Entrada =
  | { id: number; tipo: "ia" | "usuario"; texto: string }
  | { id: number; tipo: "analise"; dados: AnaliseCompleta };

const SUGESTOES = ["E se estiver sujo de gordura?", "Preciso tirar o rótulo?", "Posso amassar antes de jogar?"];

/** Materiais já escritos pela IA no JSON parcial, para mostrar o progresso real do streaming. */
function materiaisParciais(json: string): string[] {
  return [...json.matchAll(/"material"\s*:\s*"([^"]+)"/g)].map((m) => m[1]!);
}

/** Cada mensagem entra com y 8 → 0 e fade, em 0.2 s. */
function Mensagem({
  lado,
  analise = false,
  children,
}: {
  lado: "ia" | "usuario";
  analise?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduzido = prefereMovimentoReduzido();
      gsap.fromTo(
        ref.current,
        reduzido ? { opacity: 0 } : { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: reduzido ? 0.15 : 0.2, ease: "power2.out" },
      );
    },
    { scope: ref },
  );

  if (lado === "usuario") {
    return (
      <div ref={ref} className="flex justify-end">
        <div className="max-w-[85%] rounded-[20px] rounded-br-[6px] bg-paper-50/95 px-4 py-3 text-sm leading-relaxed text-forest-900 shadow-md backdrop-blur-md">
          <span className="sr-only">Você: </span>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} data-analise={analise || undefined} className="flex gap-3">
      <span className="mt-1 flex shrink-0 items-center justify-center">
        <GlassIcon
          plate="circle"
          size={32}
          radius="50%"
          spread={0.22}
          plateBg="linear-gradient(135deg, rgba(150, 188, 161, 0.5) 0%, rgba(47, 90, 69, 0.9) 100%)"
          ink="var(--paper-50)"
        >
          <Marca className="h-3.5 w-3.5" />
        </GlassIcon>
      </span>
      <div className="min-w-0 flex-1">
        <span className="sr-only">CYCLEAN: </span>
        {children}
      </div>
    </div>
  );
}

function Balao({ children }: { children: ReactNode }) {
  let conteudo = children;
  if (typeof children === "string") {
    const limpo = children.trim();
    if (limpo.startsWith("{") && limpo.endsWith("}")) {
      try {
        const obj = JSON.parse(limpo);
        if (typeof obj.mensagem === "string") {
          conteudo = obj.mensagem;
        }
      } catch {}
    }
  }

  return (
    <div className="glass-bubble w-fit max-w-full whitespace-pre-wrap rounded-[20px] rounded-tl-[6px] px-4 py-3 text-sm leading-relaxed text-paper-50">
      {conteudo}
    </div>
  );
}

export function ClassifierSection({ onAbrirVideo }: { onAbrirVideo: (id: string, titulo: string) => void }) {
  const raiz = useRef<HTMLElement>(null);
  const rolagem = useRef<HTMLDivElement>(null);
  const cancelar = useRef<AbortController | null>(null);
  const proximoId = useRef(1);

  const [imagem, setImagem] = useState<ImagemPreparada | null>(null);
  const [analisando, setAnalisando] = useState(false);
  const [acordando, setAcordando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [contexto, setContexto] = useState<AnaliseCompleta | null>(null);
  const [parcial, setParcial] = useState<{ tipo: "analise" | "chat"; texto: string } | null>(null);
  const [pergunta, setPergunta] = useState("");
  const [respondendo, setRespondendo] = useState(false);

  const ocupado = analisando || respondendo;
  const novaEntrada = (
    e: { tipo: "ia" | "usuario"; texto: string } | { tipo: "analise"; dados: AnaliseCompleta },
  ) =>
    setEntradas((lista) => [...lista, { ...e, id: proximoId.current++ } as Entrada]);

  // As duas colunas entram de lados opostos, uma vez
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const gatilho = { trigger: "[data-colunas]", start: "top 80%", toggleActions: "play none none none" };

      mm.add(MQ.desktop, () => {
        gsap.from("[data-col='esq']", { autoAlpha: 0, x: -30, duration: 1.0, ease: "power2.out", scrollTrigger: gatilho });
        gsap.from("[data-col='dir']", { autoAlpha: 0, x: 30, duration: 1.0, ease: "power2.out", scrollTrigger: gatilho });
      });
      mm.add(MQ.mobile, () => {
        gsap.from("[data-col]", { autoAlpha: 0, y: 20, duration: 0.85, stagger: 0.12, ease: "power2.out", scrollTrigger: gatilho });
      });
      mm.add(MQ.movimento, () => {
        gsap.from("[data-cabecalho] > *", {
          autoAlpha: 0,
          y: 18,
          duration: 0.9,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: { trigger: "[data-cabecalho]", start: "top 85%", toggleActions: "play none none none" },
        });
      });
    },
    { scope: raiz },
  );

  // Conversa sempre no fim
  useEffect(() => {
    const el = rolagem.current;
    if (!el) return;
    // Análise nova: mostra o começo dela. Resto da conversa: acompanha o fim.
    const analises = el.querySelectorAll<HTMLElement>("[data-analise]");
    const analise = entradas.at(-1)?.tipo === "analise" && !parcial ? analises[analises.length - 1] : null;
    el.scrollTop = analise ? analise.offsetTop - 20 : el.scrollHeight;
  }, [entradas, parcial]);

  // Ao sair da página: cancela o que estiver em andamento e solta a prévia
  useEffect(() => () => cancelar.current?.abort(), []);
  useEffect(() => {
    const previa = imagem?.previa;
    return () => {
      if (previa) URL.revokeObjectURL(previa);
    };
  }, [imagem]);

  const receberArquivo = async (arquivo: File | undefined) => {
    if (!arquivo || analisando) return;
    const problema = validarArquivo(arquivo);
    if (problema) {
      setErro(problema);
      return;
    }
    setErro(null);
    try {
      setImagem(await prepararImagem(arquivo));
    } catch (e) {
      setErro((e as Error).message);
    }
  };

  const analisar = async () => {
    if (!imagem || ocupado) return;
    cancelar.current?.abort();
    const controle = new AbortController();
    cancelar.current = controle;

    setAnalisando(true);
    setAcordando(false);
    setErro(null);
    setEntradas([]);
    setContexto(null);
    setParcial({ tipo: "analise", texto: "" });

    // Se a primeira resposta demorar, o Render provavelmente está acordando
    const aviso = setTimeout(() => setAcordando(true), 6000);
    let recebeu = false;
    let json = "";

    try {
      const resposta = await fetchAcordando(
        "/api/analisar",
        () => {
          const corpo = new FormData();
          corpo.append("imagem", imagem.blob, imagem.nome);
          return { method: "POST", body: corpo, signal: controle.signal };
        },
        () => setAcordando(true),
      );

      if (resposta.status === 429) {
        throw new Error("Você chegou ao limite de 10 análises em 10 minutos. Tente de novo daqui a pouco.");
      }
      if (!resposta.ok) throw new Error("O analisador não respondeu. Tente de novo em instantes.");

      await lerSSE(resposta, (evento, dados) => {
        clearTimeout(aviso);
        setAcordando(false);
        if (evento === "delta") {
          json += String(dados.texto ?? "");
          setParcial({ tipo: "analise", texto: json });
        } else if (evento === "resultado") {
          recebeu = true;
          const analise = dados as unknown as AnaliseCompleta;
          setContexto(analise);
          novaEntrada({ tipo: "analise", dados: analise });
        } else if (evento === "erro") {
          recebeu = true;
          setErro(String(dados.mensagem ?? "Não deu para analisar essa foto. Tente outra."));
        }
      });

      if (!recebeu) throw new Error("A análise terminou sem resposta. Tente de novo.");
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        const msg = (e as Error).message;
        setErro(
          /fetch|network|load failed|^\d+$/i.test(msg)
            ? "Não deu para falar com o analisador. Confira sua conexão e tente de novo."
            : msg,
        );
      }
    } finally {
      clearTimeout(aviso);
      setAcordando(false);
      setParcial(null);
      setAnalisando(false);
    }
  };

  const perguntar = async (texto: string) => {
    const limpa = texto.trim();
    if (!limpa || ocupado) return;
    cancelar.current?.abort();
    const controle = new AbortController();
    cancelar.current = controle;

    setPergunta("");
    setRespondendo(true);
    novaEntrada({ tipo: "usuario", texto: limpa });
    setParcial({ tipo: "chat", texto: "" });

    // O histórico vive só aqui, na memória da página, e vai inteiro a cada pergunta
    const historico: MensagemChat[] = [
      ...entradas.flatMap((e): MensagemChat[] =>
        e.tipo === "analise" ? [] : [{ papel: e.tipo === "usuario" ? "usuario" : "assistente", texto: e.texto }],
      ),
      { papel: "usuario" as const, texto: limpa },
    ].slice(-20);

    let resposta = "";
    let falha: string | null = null;

    try {
      const res = await fetchAcordando(
        "/api/chat",
        () => ({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contexto: contexto ? { itens: contexto.itens, mensagem: contexto.mensagem } : null,
            historico,
            pergunta: limpa,
          }),
          signal: controle.signal,
        }),
        () => setParcial({ tipo: "chat", texto: "Preparando o analisador, só um instante." }),
      );
      if (!res.ok) throw new Error("sem resposta");

      await lerSSE(res, (evento, dados) => {
        if (evento === "delta") {
          resposta += String(dados.texto ?? "");
          setParcial({ tipo: "chat", texto: resposta });
        } else if (evento === "erro") {
          falha = String(dados.mensagem ?? "");
        }
      });
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      falha = "erro";
    } finally {
      setParcial(null);
      setRespondendo(false);
    }

    let textoResposta = resposta.trim();
    if (textoResposta.startsWith("{") && textoResposta.endsWith("}")) {
      try {
        const obj = JSON.parse(textoResposta);
        if (typeof obj.mensagem === "string") {
          textoResposta = obj.mensagem;
        }
      } catch {}
    }

    novaEntrada({
      tipo: "ia",
      texto: textoResposta || (falha ? "Não consegui responder agora. Tente perguntar de novo." : "Sem resposta."),
    });
  };

  const materiais = parcial?.tipo === "analise" ? materiaisParciais(parcial.texto) : [];

  return (
    <section id="descartar" ref={raiz} className="frame scroll-mt-0">
      <div className="absolute inset-0 -z-10">
        <Image src="/images/hero-forest.jpg" alt="" fill sizes="100vw" className="object-cover object-bottom" />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-900/75 via-forest-900/40 to-forest-900/80" />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <Noise />
      </div>

      <div className="px-5 py-16 md:px-9 md:py-24 lg:pr-20">
        <div data-cabecalho className="max-w-4xl">
          <p className="rotulo text-mint-300">Descartar</p>
          <h2 className="titulo mt-5 text-paper-50" style={{ fontSize: "clamp(2.75rem, 6.4vw, 6.25rem)" }}>
            Em qual lixeira
            <br />
            isso vai?
          </h2>
        </div>

        {/* 45% envio / 55% conversa; altura estática e fixa em ambas as colunas */}
        <div data-colunas className="mt-12 grid grid-cols-1 items-start gap-6 lg:mt-16 lg:grid-cols-[45fr_55fr]">
          <div data-col="esq" className="flex h-[34rem] sm:h-[38rem] lg:h-[42rem] max-h-[34rem] sm:max-h-[38rem] lg:max-h-[42rem] flex-col">
            <UploadCard
              imagem={imagem}
              analisando={analisando}
              acordando={acordando}
              erro={erro}
              onArquivo={receberArquivo}
              onAnalisar={analisar}
            />
          </div>

          <div
            data-col="dir"
            className="glass-surface flex h-[34rem] sm:h-[38rem] lg:h-[42rem] max-h-[34rem] sm:max-h-[38rem] lg:max-h-[42rem] flex-col overflow-hidden"
          >
            {/* Cabeçalho do assistente */}
            <div className="flex shrink-0 items-center justify-between border-b border-paper-50/10 px-5 py-4 sm:px-6 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint-300 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-mint-300" />
                </span>
                <span className="text-sm font-semibold tracking-wide text-paper-50">Assistente CYCLEAN</span>
              </div>
              <span className="text-xs font-mono text-sand-200/70">IA Conectada</span>
            </div>

            <div
              ref={rolagem}
              role="log"
              aria-live="polite"
              aria-label="Conversa com o CYCLEAN"
              tabIndex={0}
              className="rolagem-fina relative flex-1 min-h-0 space-y-5 overflow-y-auto overscroll-contain p-5 sm:p-6"
            >
              <Mensagem lado="ia">
                <Balao>
                  Envie a foto de uma embalagem, garrafa, resto ou aparelho ao lado. Eu identifico o material, digo em
                  qual lixeira ele vai e como preparar. Depois é só perguntar o que ficou em dúvida.
                </Balao>
              </Mensagem>

              {entradas.map((e) =>
                e.tipo === "analise" ? (
                  <Mensagem key={e.id} lado="ia" analise>
                    <ResultadoAnalise dados={e.dados} onAbrirVideo={onAbrirVideo} />
                  </Mensagem>
                ) : (
                  <Mensagem key={e.id} lado={e.tipo}>
                    {e.tipo === "ia" ? <Balao>{e.texto}</Balao> : e.texto}
                  </Mensagem>
                ),
              )}

              {/* Texto chegando da API em tempo real */}
              {parcial?.tipo === "chat" && (
                <Mensagem lado="ia">
                  <Balao>{parcial.texto || "Pensando"}</Balao>
                </Mensagem>
              )}
              {parcial?.tipo === "analise" && (
                <Mensagem lado="ia">
                  <Balao>
                    {materiais.length === 0
                      ? "Olhando a foto"
                      : `Encontrei ${materiais.join(", ")}. Montando as instruções`}
                  </Balao>
                </Mensagem>
              )}
            </div>

            {contexto && !ocupado && entradas.length === 1 && (
              <div className="flex shrink-0 flex-wrap gap-2 px-5 pb-3 sm:px-6">
                {SUGESTOES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => perguntar(s)}
                    className="glass-pill min-h-9 px-4 text-xs font-medium text-paper-50 transition-all hover:border-mint-300 hover:text-mint-300 hover:scale-[1.02]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                perguntar(pergunta);
              }}
              className="flex shrink-0 items-center gap-2 border-t border-paper-50/10 p-3 sm:p-4 backdrop-blur-md"
            >
              <label htmlFor="pergunta" className="sr-only">
                Pergunta sobre o descarte
              </label>
              <input
                id="pergunta"
                type="text"
                value={pergunta}
                onChange={(e) => setPergunta(e.target.value)}
                maxLength={1000}
                autoComplete="off"
                placeholder={contexto ? "Pergunte sobre esse material..." : "Pergunte sobre descarte..."}
                className="glass-input h-12 min-w-0 flex-1 rounded-full px-5 text-sm text-paper-50 placeholder:text-sand-200/60 focus:border-mint-300 focus:outline-none focus:ring-1 focus:ring-mint-300/40"
              />
              <button
                type="submit"
                disabled={!pergunta.trim() || ocupado}
                aria-label="Enviar pergunta"
                className="btn-round h-12 w-12 bg-mint-300 text-forest-900 transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
              >
                <ArrowUp className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
