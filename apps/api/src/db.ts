import postgres from "postgres";
import { env } from "./env.js";

const isLocal =
  env.DATABASE_URL.includes("localhost") || env.DATABASE_URL.includes("127.0.0.1");

/**
 * Conexão com o Postgres (Render / Supabase / local).
 */
export const sql = postgres(env.DATABASE_URL, {
  max: isLocal ? 1 : 5,
  idle_timeout: 30,
  connect_timeout: 15,
  ssl: isLocal ? false : "require",
  // Sem logs de query: nada de conteúdo de requisição vai para o log.
  debug: false,
  onnotice: () => {},
});

/** Cria automaticamente as tabelas necessárias caso ainda não existam. */
export async function initDb(): Promise<void> {
  await sql`
    create table if not exists public.config (
      chave          text primary key,
      valor          text not null,
      criptografado  boolean not null default false,
      atualizado_em  timestamptz not null default now()
    );
  `;
  await sql`
    create table if not exists public.videos (
      id        uuid primary key default gen_random_uuid(),
      material  text not null,
      titulo    text not null,
      url       text not null,
      idioma    text not null default 'pt-BR',
      ativo     boolean not null default true
    );
  `;
  await sql`
    create index if not exists videos_material_ativo_idx
      on public.videos (material)
      where ativo;
  `;
  await sql`
    create table if not exists public.metricas_diarias (
      data      date not null,
      material  text not null,
      total     integer not null default 0 check (total >= 0),
      primary key (data, material)
    );
  `;
}

/** Data de hoje no fuso de Brasília, no formato YYYY-MM-DD. */
export function hojeEmBrasilia(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
