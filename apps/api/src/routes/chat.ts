import type { FastifyPluginAsync } from "fastify";
import { executarChatIA } from "../ai.js";
import { chatRequisicaoSchema } from "@descarta/shared";

export const chatRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/api/chat",
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: "10 minutes",
        },
      },
    },
    async (req, reply) => {
      reply.raw.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      reply.raw.setHeader("Cache-Control", "no-cache, no-transform");
      reply.raw.setHeader("Connection", "keep-alive");
      reply.raw.setHeader("X-Accel-Buffering", "no");

      const enviarEvento = (evento: string, dados: unknown) => {
        if (!reply.raw.writableEnded) {
          reply.raw.write(`event: ${evento}\ndata: ${JSON.stringify(dados)}\n\n`);
        }
      };

      try {
        const bodyParse = chatRequisicaoSchema.safeParse(req.body);
        if (!bodyParse.success) {
          enviarEvento("erro", { mensagem: "Dados da conversa inválidos." });
          reply.raw.end();
          return;
        }

        const { contexto, historico, pergunta } = bodyParse.data;

        await executarChatIA({
          contexto,
          historico,
          pergunta,
          onDelta: (texto) => {
            enviarEvento("delta", { texto });
          },
        });

        enviarEvento("fim", {});
      } catch (err: any) {
        req.log.error(err, "Falha no chat da IA");
        enviarEvento("erro", {
          mensagem: err?.message || "Não foi possível obter a resposta no momento.",
        });
      } finally {
        reply.raw.end();
      }
    }
  );
};
