import { createHmac, timingSafeEqual } from "node:crypto";
import { verify } from "@node-rs/argon2";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env, emProducao } from "./env.js";

export const NOME_COOKIE_SESSAO = "descarta_admin_session";
export const DURACAO_SESSAO_SEGUNDOS = 8 * 60 * 60; // 8 horas

interface TentativaLogin {
  falhas: number;
  bloqueadoAte: number;
}

const tentativas = new Map<string, TentativaLogin>();
const MAX_TENTATIVAS = 5;
const TEMPO_BLOQUEIO_MS = 15 * 60 * 1000; // 15 minutos

export function verificarBloqueio(ip: string): { bloqueado: boolean; restanteMinutos?: number } {
  const reg = tentativas.get(ip);
  if (!reg) return { bloqueado: false };

  const agora = Date.now();
  if (reg.bloqueadoAte > agora) {
    const restante = Math.ceil((reg.bloqueadoAte - agora) / 60000);
    return { bloqueado: true, restanteMinutos: restante };
  }

  // Se o tempo de bloqueio expirou, limpa
  if (reg.bloqueadoAte > 0 && reg.bloqueadoAte <= agora) {
    tentativas.delete(ip);
  }

  return { bloqueado: false };
}

export function registrarFalha(ip: string): void {
  const agora = Date.now();
  const reg = tentativas.get(ip) || { falhas: 0, bloqueadoAte: 0 };
  reg.falhas += 1;
  if (reg.falhas >= MAX_TENTATIVAS) {
    reg.bloqueadoAte = agora + TEMPO_BLOQUEIO_MS;
  }
  tentativas.set(ip, reg);
}

export function limparTentativas(ip: string): void {
  tentativas.delete(ip);
}

function assinar(dado: string): string {
  const hmac = createHmac("sha256", env.SESSION_SECRET);
  hmac.update(dado);
  return `${dado}.${hmac.digest("base64url")}`;
}

function validarAssinatura(valorComAssinatura: string): string | null {
  const partes = valorComAssinatura.split(".");
  if (partes.length !== 2) return null;
  const [dado, sig] = partes;
  if (!dado || !sig) return null;

  const esperado = createHmac("sha256", env.SESSION_SECRET).update(dado).digest("base64url");
  const bufSig = Buffer.from(sig);
  const bufEsp = Buffer.from(esperado);

  if (bufSig.length !== bufEsp.length) return null;
  if (!timingSafeEqual(bufSig, bufEsp)) return null;

  return dado;
}

export function criarTokenSessao(usuario: string): string {
  const expiraEm = Math.floor(Date.now() / 1000) + DURACAO_SESSAO_SEGUNDOS;
  const payload = Buffer.from(JSON.stringify({ u: usuario, exp: expiraEm })).toString("base64url");
  return assinar(payload);
}

export function validarTokenSessao(token: string): { valido: boolean; usuario?: string } {
  const payloadB64 = validarAssinatura(token);
  if (!payloadB64) return { valido: false };

  try {
    const jsonStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const data = JSON.parse(jsonStr) as { u: string; exp: number };
    const agoraSeg = Math.floor(Date.now() / 1000);
    if (!data.exp || data.exp < agoraSeg) {
      return { valido: false };
    }
    if (data.u !== env.ADMIN_USER) {
      return { valido: false };
    }
    return { valido: true, usuario: data.u };
  } catch {
    return { valido: false };
  }
}

export async function autenticarUsuario(usuario: string, senha: string, rota: string): Promise<boolean> {
  const rotaLimpa = rota.replace(/^\/+|\/+$/g, "");
  if (rotaLimpa !== env.ADMIN_ROUTE) {
    return false;
  }

  if (usuario !== env.ADMIN_USER) {
    return false;
  }

  try {
    // 2 = Algorithm.Argon2id
    const valida = await verify(env.ADMIN_PASSWORD_HASH, senha, {
      algorithm: 2,
    });
    return valida;
  } catch (err) {
    console.error("Erro ao verificar hash de senha argon2:", err);
    return false;
  }
}

/** Hook Fastify para proteger todas as rotas em /api/admin/* (exceto login) */
export async function hookExigirAdmin(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  // Ignora /api/admin/login
  if (req.url.endsWith("/admin/login")) {
    return;
  }

  const cookie = req.cookies[NOME_COOKIE_SESSAO];
  if (!cookie) {
    reply.status(401).send({ erro: "Sessão não informada" });
    return;
  }

  const checagem = validarTokenSessao(cookie);
  if (!checagem.valido) {
    reply.status(401).send({ erro: "Sessão inválida ou expirada" });
    return;
  }
}
