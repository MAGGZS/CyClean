import postgres from "postgres";
import { env } from "./env.js";

const isLocal =
  env.DATABASE_URL.includes("localhost") || env.DATABASE_URL.includes("127.0.0.1");

/**
 * Conexão com o Postgres do Supabase pelo pooler Supavisor (modo session).
 * O pooler resolve por IPv4, o que evita o problema de IPv6 da conexão direta.
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

/** Data de hoje no fuso de Brasília, no formato YYYY-MM-DD. */
export function hojeEmBrasilia(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
