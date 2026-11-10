import Link from "next/link";
import { Marca } from "./Navbar";

/** Rodapé do site. O ano do copyright é a porta discreta do painel. */
export function Footer() {
  return (
    <footer className="border-t border-paper-50/10 bg-forest-900 px-6 pb-8 pt-10 text-sand-200 md:px-12 md:pb-10 md:pt-14">
      <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-md">
          <div className="flex items-center gap-2.5">
            <Marca className="h-6 w-6 text-mint-300" />
            <span className="titulo text-xl text-paper-50">CYCLEAN</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-sand-200/80">
            Projeto de extensão universitária. Aberto, sem cadastro e sem rastreamento: a foto que você
            envia é analisada e descartada na hora.
          </p>
        </div>

        <div className="flex items-center gap-8 text-sm">
          <Link
            href="/privacidade"
            className="font-medium text-sand-200 underline decoration-sand-200/30 underline-offset-4 transition-colors hover:text-paper-50 hover:decoration-paper-50"
          >
            Privacidade
          </Link>
          <span className="tnum text-sand-200/80">
            ©{" "}
            <Link href="/painel-x7" aria-label="2026" className="cursor-text hover:text-mint-300 transition-colors" prefetch={false}>
              2026
            </Link>{" "}
            CYCLEAN
          </span>
        </div>
      </div>
    </footer>
  );
}
