import { sql } from "./db.js";
import { criptografar, descriptografar, finalDaChave } from "./crypto.js";
import { SYSTEM_PROMPT_PADRAO } from "./system-prompt.js";
import type { ConfigAtualizar, ConfigPublicaAdmin, Provedor, OutraConfig } from "@descarta/shared";

export interface ConfigIAInterna {
  provedor: Provedor;
  modelo: string;
  chave: string;
  temperatura: number;
  system_prompt: string;
  youtube_chave?: string;
  outras: OutraConfig[];
  atualizado_em: string | null;
}

interface CacheConfig {
  dados: ConfigIAInterna;
  timestamp: number;
}

let cache: CacheConfig | null = null;
const CACHE_TTL_MS = 60 * 1000;

export function invalidarCacheConfig(): void {
  cache = null;
}

export async function carregarConfigIA(): Promise<ConfigIAInterna> {
  const agora = Date.now();
  if (cache && agora - cache.timestamp < CACHE_TTL_MS) {
    return cache.dados;
  }

  let linhas: { chave: string; valor: string; criptografado: boolean; atualizado_em: Date }[] = [];
  try {
    linhas = await sql<typeof linhas>`
      SELECT chave, valor, criptografado, atualizado_em
      FROM public.config
    `;
  } catch (err) {
    console.warn("Aviso ao carregar config do Supabase (usando fallback padrão se tabela não estiver pronta):", err);
  }

  const mapa = new Map<string, { valor: string; criptografado: boolean }>();
  let maisRecente: Date | null = null;

  for (const row of linhas) {
    mapa.set(row.chave, { valor: row.valor, criptografado: row.criptografado });
    if (!maisRecente || row.atualizado_em > maisRecente) {
      maisRecente = row.atualizado_em;
    }
  }

  const obterTexto = (chave: string, padrao: string): string => {
    const item = mapa.get(chave);
    if (!item) return padrao;
    try {
      return item.criptografado ? descriptografar(item.valor) : item.valor;
    } catch {
      return padrao;
    }
  };

  const provedor = (mapa.get("ia_provedor")?.valor || "groq") as Provedor;
  const modeloPadrao =
    provedor === "groq"
      ? "qwen/qwen3.8-27b"
      : provedor === "gemini"
        ? "gemini-2.5-flash"
        : provedor === "openai"
          ? "gpt-4o"
          : "claude-sonnet-4-5";
  const modelo = mapa.get("ia_modelo")?.valor || modeloPadrao;

  const chaveEnvPadrao =
    provedor === "groq"
      ? process.env.GROQ_API_KEY
      : provedor === "gemini"
        ? (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)
        : provedor === "openai"
          ? process.env.OPENAI_API_KEY
          : process.env.ANTHROPIC_API_KEY;

  const chave = obterTexto("ia_chave", chaveEnvPadrao || "");
  const temperaturaRaw = Number(mapa.get("ia_temperatura")?.valor);
  const temperatura = !isNaN(temperaturaRaw) && temperaturaRaw >= 0 && temperaturaRaw <= 1 ? temperaturaRaw : 0.2;
  const systemPrompt = mapa.get("ia_system_prompt")?.valor || SYSTEM_PROMPT_PADRAO;
  const youtubeChave = obterTexto("youtube_chave", "");

  const outras: OutraConfig[] = [];
  for (const [chave, item] of mapa.entries()) {
    if (!chave.startsWith("ia_") && chave !== "youtube_chave") {
      outras.push({
        chave,
        valor: item.criptografado ? descriptografar(item.valor) : item.valor,
      });
    }
  }

  const dados: ConfigIAInterna = {
    provedor,
    modelo,
    chave,
    temperatura,
    system_prompt: systemPrompt,
    youtube_chave: youtubeChave || undefined,
    outras,
    atualizado_em: maisRecente ? maisRecente.toISOString() : null,
  };

  cache = { dados, timestamp: agora };
  return dados;
}

export async function obterConfigPublicaAdmin(): Promise<ConfigPublicaAdmin> {
  const cfg = await carregarConfigIA();
  return {
    provedor: cfg.provedor,
    modelo: cfg.modelo,
    temperatura: cfg.temperatura,
    system_prompt: cfg.system_prompt,
    system_prompt_padrao: SYSTEM_PROMPT_PADRAO,
    chave_final: cfg.chave ? finalDaChave(cfg.chave) : null,
    youtube_chave_final: cfg.youtube_chave ? finalDaChave(cfg.youtube_chave) : null,
    outras: cfg.outras,
    atualizado_em: cfg.atualizado_em,
  };
}

export async function salvarConfigAdmin(entrada: ConfigAtualizar): Promise<void> {
  const agora = new Date();

  await sql.begin(async (trx) => {
    // Provedor
    await trx`
      INSERT INTO public.config (chave, valor, criptografado, atualizado_em)
      VALUES ('ia_provedor', ${entrada.provedor}, false, ${agora})
      ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, atualizado_em = EXCLUDED.atualizado_em
    `;

    // Modelo
    await trx`
      INSERT INTO public.config (chave, valor, criptografado, atualizado_em)
      VALUES ('ia_modelo', ${entrada.modelo}, false, ${agora})
      ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, atualizado_em = EXCLUDED.atualizado_em
    `;

    // Temperatura
    await trx`
      INSERT INTO public.config (chave, valor, criptografado, atualizado_em)
      VALUES ('ia_temperatura', ${String(entrada.temperatura)}, false, ${agora})
      ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, atualizado_em = EXCLUDED.atualizado_em
    `;

    // System prompt
    await trx`
      INSERT INTO public.config (chave, valor, criptografado, atualizado_em)
      VALUES ('ia_system_prompt', ${entrada.system_prompt}, false, ${agora})
      ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, atualizado_em = EXCLUDED.atualizado_em
    `;

    // Chave da IA (se fornecida nova)
    if (entrada.chave && entrada.chave.trim().length > 0) {
      const crip = criptografar(entrada.chave.trim());
      await trx`
        INSERT INTO public.config (chave, valor, criptografado, atualizado_em)
        VALUES ('ia_chave', ${crip}, true, ${agora})
        ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, criptografado = true, atualizado_em = EXCLUDED.atualizado_em
      `;
    }

    // Chave do YouTube
    if (entrada.youtube_chave !== undefined) {
      if (entrada.youtube_chave.trim().length > 0) {
        const crip = criptografar(entrada.youtube_chave.trim());
        await trx`
          INSERT INTO public.config (chave, valor, criptografado, atualizado_em)
          VALUES ('youtube_chave', ${crip}, true, ${agora})
          ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, criptografado = true, atualizado_em = EXCLUDED.atualizado_em
        `;
      } else {
        await trx`DELETE FROM public.config WHERE chave = 'youtube_chave'`;
      }
    }

    // Outras configurações livres
    for (const item of entrada.outras) {
      await trx`
        INSERT INTO public.config (chave, valor, criptografado, atualizado_em)
        VALUES (${item.chave}, ${item.valor}, false, ${agora})
        ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, atualizado_em = EXCLUDED.atualizado_em
      `;
    }
  });

  invalidarCacheConfig();
}
