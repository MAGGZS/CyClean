import type { FastifyPluginAsync } from "fastify";
import {
  autenticarUsuario,
  criarTokenSessao,
  hookExigirAdmin,
  limparTentativas,
  NOME_COOKIE_SESSAO,
  DURACAO_SESSAO_SEGUNDOS,
  registrarFalha,
  verificarBloqueio,
  validarTokenSessao,
} from "../auth.js";
import { obterConfigPublicaAdmin, salvarConfigAdmin } from "../config-ia.js";
import { testarConexaoIA } from "../ai.js";
import {
  criarVideoAdmin,
  atualizarVideoAdmin,
  excluirVideoAdmin,
  listarVideosAdmin,
} from "../videos.js";
import { obterMetricasAdmin } from "../metricas.js";
import { configAtualizarSchema, loginSchema, videoSchema } from "@descarta/shared";
import { emProducao } from "../env.js";

export const adminRoutes: FastifyPluginAsync = async (app) => {
  // Hook de proteção para todas as rotas deste plugin exceto /admin/login
  app.addHook("preHandler", hookExigirAdmin);

  /* ---------- Login / Logout / Sessão ---------- */

  app.post("/api/admin/login", async (req, reply) => {
    const ip = req.ip || "unknown";

    const bloqueio = verificarBloqueio(ip);
    if (bloqueio.bloqueado) {
      return reply.status(429).send({
        erro: `Muitas tentativas incorretas. Tente novamente em ${bloqueio.restanteMinutos} minutos.`,
      });
    }

    const parseBody = loginSchema.safeParse(req.body);
    if (!parseBody.success) {
      return reply.status(400).send({ erro: "Dados de login inválidos." });
    }

    const { usuario, senha, rota } = parseBody.data;
    const ok = await autenticarUsuario(usuario, senha, rota);

    if (!ok) {
      registrarFalha(ip);
      return reply.status(401).send({ erro: "Credenciais inválidas ou acesso não autorizado." });
    }

    limparTentativas(ip);
    const token = criarTokenSessao(usuario);

    reply.setCookie(NOME_COOKIE_SESSAO, token, {
      path: "/",
      httpOnly: true,
      secure: emProducao,
      sameSite: "strict",
      maxAge: DURACAO_SESSAO_SEGUNDOS,
    });

    return { sucesso: true, usuario };
  });

  app.post("/api/admin/logout", async (req, reply) => {
    reply.clearCookie(NOME_COOKIE_SESSAO, {
      path: "/",
      httpOnly: true,
      secure: emProducao,
      sameSite: "strict",
    });
    return { sucesso: true };
  });

  app.get("/api/admin/sessao", async (req, reply) => {
    const cookie = req.cookies[NOME_COOKIE_SESSAO];
    if (!cookie) {
      return reply.status(401).send({ autenticado: false });
    }

    const checagem = validarTokenSessao(cookie);
    if (!checagem.valido) {
      return reply.status(401).send({ autenticado: false });
    }

    return { autenticado: true, usuario: checagem.usuario };
  });

  /* ---------- Configuração da IA ---------- */

  app.get("/api/admin/config", async () => {
    return await obterConfigPublicaAdmin();
  });

  app.put("/api/admin/config", async (req, reply) => {
    const parseBody = configAtualizarSchema.safeParse(req.body);
    if (!parseBody.success) {
      return reply.status(400).send({
        erro: "Dados de configuração inválidos.",
        detalhes: parseBody.error.flatten(),
      });
    }

    await salvarConfigAdmin(parseBody.data);
    return { sucesso: true };
  });

  app.post("/api/admin/testar-ia", async () => {
    return await testarConexaoIA();
  });

  /* ---------- Vídeos de Referência (CRUD) ---------- */

  app.get("/api/admin/videos", async () => {
    return await listarVideosAdmin();
  });

  app.post("/api/admin/videos", async (req, reply) => {
    const parseBody = videoSchema.safeParse(req.body);
    if (!parseBody.success) {
      return reply.status(400).send({
        erro: "Dados de vídeo inválidos.",
        detalhes: parseBody.error.flatten(),
      });
    }
    const novo = await criarVideoAdmin(parseBody.data);
    return reply.status(201).send(novo);
  });

  app.put("/api/admin/videos/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const parseBody = videoSchema.safeParse(req.body);
    if (!parseBody.success) {
      return reply.status(400).send({
        erro: "Dados de vídeo inválidos.",
        detalhes: parseBody.error.flatten(),
      });
    }
    const atualizado = await atualizarVideoAdmin(id, parseBody.data);
    if (!atualizado) {
      return reply.status(404).send({ erro: "Vídeo não encontrado." });
    }
    return atualizado;
  });

  app.delete("/api/admin/videos/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const excluido = await excluirVideoAdmin(id);
    if (!excluido) {
      return reply.status(404).send({ erro: "Vídeo não encontrado." });
    }
    return { sucesso: true };
  });

  /* ---------- Métricas ---------- */

  app.get("/api/admin/metricas", async (req) => {
    const q = req.query as { dias?: string };
    const dias = q.dias ? Math.min(Math.max(parseInt(q.dias, 10) || 30, 1), 365) : 30;
    return await obterMetricasAdmin(dias);
  });
};
