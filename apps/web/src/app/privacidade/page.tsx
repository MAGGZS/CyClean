import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Marca } from "../../components/Navbar";

export const metadata = {
  title: "Privacidade | CYCLEAN",
  description: "O que o CYCLEAN faz com a sua foto: analisa e descarta. Nada é salvo.",
};

const PONTOS = [
  {
    titulo: "Nenhuma foto é salva",
    texto:
      "A imagem que você envia fica só na memória do servidor durante a análise, por alguns segundos. Quando a resposta sai, ela é descartada. Não vai para banco de dados, disco, armazenamento ou registro de log.",
  },
  {
    titulo: "Sem cadastro e sem rastreamento",
    texto:
      "O site não pede conta, não usa cookies de rastreamento nem ferramentas de analytics de terceiros. Seu endereço IP serve apenas para limitar abusos (10 análises a cada 10 minutos) e não é gravado.",
  },
  {
    titulo: "A conversa fica no seu navegador",
    texto:
      "As perguntas que você faz depois da análise vivem na memória da página enquanto ela está aberta. Fechou ou recarregou, a conversa some. O servidor não guarda histórico.",
  },
  {
    titulo: "O único dado guardado é um contador",
    texto:
      "Para saber se o projeto está sendo útil, somamos quantas análises houve por dia e por tipo de material, por exemplo: plástico, 12 vezes hoje. O número não está ligado a nenhuma pessoa.",
  },
] as const;

export default function PrivacidadePage() {
  return (
    <main className="frame min-h-svh px-5 py-8 md:px-9 md:py-10">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 text-paper-50" aria-label="CYCLEAN, voltar ao início">
          <Marca className="h-6 w-6 text-mint-300" />
          <span className="titulo text-xl">CYCLEAN</span>
        </Link>
        <Link href="/" className="btn-pill-outline px-5 text-sm">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          Voltar
        </Link>
      </div>

      <div className="mt-20 grid gap-12 md:mt-28 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="rotulo text-mint-300">Privacidade</p>
          <h1 className="titulo mt-5 text-paper-50" style={{ fontSize: "clamp(2.75rem, 6vw, 5.5rem)" }}>
            Sua foto não fica com a gente
          </h1>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          {PONTOS.map((p) => (
            <section key={p.titulo} className="border-t border-paper-50/20 py-8 first:border-t-0 first:pt-0">
              <h2 className="titulo text-2xl text-paper-50">{p.titulo}</h2>
              <p className="mt-3 max-w-[38rem] text-base leading-relaxed text-sand-200">{p.texto}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
