/**
 * Eventos Server-Sent Events trocados entre o Render e o navegador.
 *
 * analisar: "delta" (pedaço de texto JSON), "resultado" (AnaliseCompleta), "erro".
 * chat:     "delta" (pedaço de texto), "fim", "erro".
 */
export type EventoSSE =
  | { evento: "delta"; dados: { texto: string } }
  | { evento: "resultado"; dados: unknown }
  | { evento: "fim"; dados: Record<string, never> }
  | { evento: "erro"; dados: { mensagem: string } };

export const LIMITE_UPLOAD_BYTES = 8 * 1024 * 1024;
export const LADO_MAXIMO_IMAGEM = 1600;
export const QUALIDADE_JPEG = 0.85;
