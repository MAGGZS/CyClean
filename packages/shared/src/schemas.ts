import { z } from "zod";
import { CORES_LIXEIRA } from "./lixeiras";

/**
 * Categorias usadas para agrupar vídeos e métricas.
 * A IA escolhe uma delas para cada item identificado.
 */
export const CATEGORIAS = [
  "papel",
  "plastico",
  "vidro",
  "metal",
  "organico",
  "madeira",
  "perigoso",
  "saude",
  "radioativo",
  "nao_reciclavel",
  "eletronico",
  "pilha_bateria",
  "oleo",
  "medicamento",
  "lampada",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export const NOMES_CATEGORIA: Record<Categoria, string> = {
  papel: "Papel e papelão",
  plastico: "Plástico",
  vidro: "Vidro",
  metal: "Metal",
  organico: "Orgânico",
  madeira: "Madeira",
  perigoso: "Resíduo perigoso",
  saude: "Serviços de saúde",
  radioativo: "Radioativo",
  nao_reciclavel: "Não reciclável",
  eletronico: "Eletrônico",
  pilha_bateria: "Pilha e bateria",
  oleo: "Óleo de cozinha",
  medicamento: "Medicamento",
  lampada: "Lâmpada",
};

export const CONFIANCAS = ["alta", "media", "baixa"] as const;
export type Confianca = (typeof CONFIANCAS)[number];

/** Aceita "média" com acento e variações de caixa vindas da IA. */
const confiancaSchema = z
  .string()
  .transform((v) =>
    v
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""),
  )
  .pipe(z.enum(CONFIANCAS));

const categoriaSchema = z
  .string()
  .transform((v) =>
    v
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s-]+/g, "_"),
  )
  .pipe(z.enum(CATEGORIAS));

const corSchema = z
  .string()
  .transform((v) => v.toLowerCase().trim())
  .pipe(z.enum(CORES_LIXEIRA));

/** Um objeto identificado na foto. */
export const itemAnaliseSchema = z.object({
  material: z.string().min(1).max(120),
  categoria: categoriaSchema,
  lixeira: z.string().min(1).max(120),
  cor_lixeira: corSchema,
  confianca: confiancaSchema,
  preparo: z.array(z.string().max(300)).max(8).default([]),
  erros_comuns: z.array(z.string().max(300)).max(8).default([]),
  residuo_especial: z.boolean().default(false),
  observacao: z.string().max(600).nullable().default(null),
});

export type ItemAnalise = z.infer<typeof itemAnaliseSchema>;

/** Formato exato que a IA deve devolver. */
export const analiseIASchema = z.object({
  itens: z.array(itemAnaliseSchema).max(8),
  mensagem: z.string().max(800),
});

export type AnaliseIA = z.infer<typeof analiseIASchema>;

export interface VideoReferencia {
  /** ID do vídeo no YouTube (11 caracteres). */
  youtubeId: string;
  titulo: string;
  material: string;
  idioma: string;
}

export interface FonteReferencia {
  titulo: string;
  url: string;
}

/** O que o Render envia ao navegador no fim da análise. */
export interface AnaliseCompleta extends AnaliseIA {
  videos: VideoReferencia[];
  fontes: FonteReferencia[];
}

/* ---------- Chat ---------- */

export const mensagemChatSchema = z.object({
  papel: z.enum(["usuario", "assistente"]),
  texto: z.string().min(1).max(4000),
});

export type MensagemChat = z.infer<typeof mensagemChatSchema>;

export const chatRequisicaoSchema = z.object({
  contexto: analiseIASchema.nullable(),
  historico: z.array(mensagemChatSchema).max(20),
  pergunta: z.string().trim().min(1).max(1000),
});

export type ChatRequisicao = z.infer<typeof chatRequisicaoSchema>;

/* ---------- Admin ---------- */

export const PROVEDORES = ["groq", "gemini", "openai", "anthropic"] as const;
export type Provedor = (typeof PROVEDORES)[number];

export const MODELOS_SUGERIDOS: Record<Provedor, string[]> = {
  groq: [
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
  ],
  gemini: [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.5-pro",
  ],
  openai: ["gpt-4o", "gpt-4.1-mini", "gpt-4.1"],
  anthropic: ["claude-sonnet-4-5", "claude-haiku-4-5", "claude-opus-4-1"],
};

export const loginSchema = z.object({
  usuario: z.string().min(1).max(100),
  senha: z.string().min(1).max(200),
  rota: z.string().min(1).max(100),
});

export type LoginRequisicao = z.infer<typeof loginSchema>;

export const outraConfigSchema = z.object({
  chave: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_]+$/, "Use só letras minúsculas, números e _"),
  valor: z.string().max(4000),
});

export type OutraConfig = z.infer<typeof outraConfigSchema>;

export const configAtualizarSchema = z.object({
  provedor: z.enum(PROVEDORES),
  modelo: z.string().trim().min(1).max(100),
  /** Só enviada quando o admin digita uma chave nova. */
  chave: z.string().trim().min(8).max(400).optional(),
  temperatura: z.number().min(0).max(1),
  system_prompt: z.string().trim().min(20).max(12000),
  /** Chave opcional da YouTube Data API. "" apaga. */
  youtube_chave: z.string().trim().max(200).optional(),
  outras: z.array(outraConfigSchema).max(50).default([]),
});

export type ConfigAtualizar = z.infer<typeof configAtualizarSchema>;

export interface ConfigPublicaAdmin {
  provedor: Provedor;
  modelo: string;
  temperatura: number;
  system_prompt: string;
  system_prompt_padrao: string;
  /** Últimos 4 caracteres da chave, ou null se não houver. */
  chave_final: string | null;
  youtube_chave_final: string | null;
  outras: OutraConfig[];
  atualizado_em: string | null;
}

export const videoSchema = z.object({
  material: z.enum(CATEGORIAS),
  titulo: z.string().trim().min(2).max(200),
  url: z
    .string()
    .trim()
    .url()
    .refine((u) => extrairYoutubeId(u) !== null, "Cole um link válido do YouTube"),
  idioma: z.string().trim().min(2).max(10).default("pt-BR"),
  ativo: z.boolean().default(true),
});

export type VideoEntrada = z.infer<typeof videoSchema>;

export interface VideoAdmin extends VideoEntrada {
  id: string;
}

export interface MetricasResposta {
  porDia: { data: string; total: number }[];
  porMaterial: { material: string; total: number }[];
  total: number;
  dias: number;
}

/** Extrai o ID de 11 caracteres de qualquer formato comum de link do YouTube. */
export function extrairYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").replace(/^m\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0] ?? null;
    else if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "music.youtube.com") {
      if (u.pathname === "/watch") id = u.searchParams.get("v");
      else {
        const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
        id = m?.[1] ?? null;
      }
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
