/**
 * Padrão de cores da Resolução CONAMA nº 275/2001.
 * Estas são as únicas cores fora da paleta do site: aparecem na faixa do guia
 * (Seção 2) e no chip da resposta da IA (Seção 3).
 */
export const CORES_LIXEIRA = [
  "azul",
  "vermelho",
  "verde",
  "amarelo",
  "marrom",
  "preto",
  "laranja",
  "branco",
  "roxo",
  "cinza",
] as const;

export type CorLixeira = (typeof CORES_LIXEIRA)[number];

export interface InfoLixeira {
  cor: CorLixeira;
  /** Nome da cor como aparece na interface. */
  nome: string;
  /** O que vai nessa lixeira, segundo a CONAMA 275. */
  material: string;
  hex: string;
  /** Cor do texto sobre o bloco, escolhida pelo contraste. */
  tinta: "#12241A" | "#F2F3E7";
}

export const LIXEIRAS: Record<CorLixeira, InfoLixeira> = {
  azul: { cor: "azul", nome: "Azul", material: "Papel e papelão", hex: "#1F5FAD", tinta: "#F2F3E7" },
  vermelho: { cor: "vermelho", nome: "Vermelho", material: "Plástico", hex: "#C8312B", tinta: "#F2F3E7" },
  verde: { cor: "verde", nome: "Verde", material: "Vidro", hex: "#237A34", tinta: "#F2F3E7" },
  amarelo: { cor: "amarelo", nome: "Amarelo", material: "Metal", hex: "#E8C21C", tinta: "#12241A" },
  marrom: { cor: "marrom", nome: "Marrom", material: "Orgânico", hex: "#7A4B2A", tinta: "#F2F3E7" },
  preto: { cor: "preto", nome: "Preto", material: "Madeira", hex: "#1A1A1A", tinta: "#F2F3E7" },
  laranja: { cor: "laranja", nome: "Laranja", material: "Resíduos perigosos", hex: "#E6782A", tinta: "#12241A" },
  branco: { cor: "branco", nome: "Branco", material: "Serviços de saúde", hex: "#F5F5F5", tinta: "#12241A" },
  roxo: { cor: "roxo", nome: "Roxo", material: "Radioativo", hex: "#6B3FA0", tinta: "#F2F3E7" },
  cinza: { cor: "cinza", nome: "Cinza", material: "Não reciclável", hex: "#8A8D8F", tinta: "#12241A" },
};

export const LISTA_LIXEIRAS: InfoLixeira[] = CORES_LIXEIRA.map((c) => LIXEIRAS[c]);
