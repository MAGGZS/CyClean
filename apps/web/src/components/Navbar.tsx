"use client";

import { ArrowUpRight } from "lucide-react";
import { rolarPara } from "../lib/gsap";

const LINKS = [
  { id: "inicio", nome: "Início" },
  { id: "por-que", nome: "Por que separar" },
  { id: "descartar", nome: "Descartar" },
] as const;

/** Marca: o "C" do CYCLEAN em formato de anel de reciclagem circular. */
export function Marca({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
      <circle cx="12" cy="12" r="10.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14.5 8.5A4.5 4.5 0 1 0 14.5 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Navbar() {
  const ir = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    rolarPara(id);
  };

  return (
    <header
      id="site-navbar"
      className="pre-anim absolute inset-x-0 top-0 z-30 grid grid-cols-2 items-center px-5 py-5 md:grid-cols-[1fr_auto_1fr] md:px-9 md:py-7"
    >
      <a
        href="#inicio"
        onClick={ir("inicio")}
        className="flex w-fit items-center gap-2.5 text-paper-50"
        aria-label="CYCLEAN, voltar ao início"
      >
        <Marca className="h-6 w-6 text-mint-300" />
        <span className="titulo text-xl">CYCLEAN</span>
      </a>

      <nav aria-label="Navegação principal" className="hidden items-center gap-9 md:flex">
        {LINKS.map(({ id, nome }) => (
          <a key={id} href={`#${id}`} onClick={ir(id)} className="link-nav text-sm font-medium">
            {nome}
          </a>
        ))}
      </nav>

      <a
        href="#descartar"
        onClick={ir("descartar")}
        className="btn-pill-outline justify-self-end px-5 text-sm"
      >
        Enviar foto
        <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
      </a>
    </header>
  );
}
