import type { FastifyPluginAsync } from "fastify";
import { executarAnaliseIA } from "../ai.js";
import { buscarVideosPorMaterial } from "../videos.js";
import { incrementarMetricaMaterial } from "../metricas.js";
import { LIMITE_UPLOAD_BYTES, type AnaliseCompleta, type FonteReferencia, type VideoReferencia } from "@descarta/shared";

const FONTES_PADRAO: FonteReferencia[] = [
  {
    titulo: "Resolução CONAMA nº 275/2001 (Código de cores da reciclagem)",
    url: "https://conama.mma.gov.br/?option=com_sisconama&task=arquivo.download&id=288",
  },
  {
    titulo: "Política Nacional de Resíduos Sólidos (Lei nº 12.305/2010)",
    url: "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/lei/l12305.htm",
  },
  {
    titulo: "Panorama dos Resíduos Sólidos no Brasil (ABREMA)",
    url: "https://abrema.org.br",
  },
];

export const analisarRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/api/analisar",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "10 minutes",
        },
      },
    },
    async (req, reply) => {
      // Configura cabeçalhos SSE
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
        const parte = await req.file({
          limits: {
            fileSize: LIMITE_UPLOAD_BYTES,
            files: 1,
          },
        });

        if (!parte) {
          enviarEvento("erro", { mensagem: "Nenhuma imagem foi enviada." });
          reply.raw.end();
          return;
        }

        const mime = parte.mimetype.toLowerCase();
        if (!["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(mime)) {
          enviarEvento("erro", { mensagem: "Formato de imagem não suportado. Use JPG, PNG, WEBP ou HEIC." });
          reply.raw.end();
          return;
        }

        // Lê direto para buffer em memória (NUNCA grava em disco)
        const buffer = await parte.toBuffer();
        if (buffer.length === 0) {
          enviarEvento("erro", { mensagem: "Arquivo de imagem vazio." });
          reply.raw.end();
          return;
        }

        const imagemBase64 = buffer.toString("base64");

        // Executa IA com streaming de deltas informativos
        const analise = await executarAnaliseIA({
          imagemBase64,
          mimeType: mime === "image/heic" || mime === "image/heif" ? "image/jpeg" : mime,
          onDelta: (texto) => {
            enviarEvento("delta", { texto });
          },
        });

        // Coleta vídeos e incrementa métricas para cada item identificado
        const videosMap = new Map<string, VideoReferencia>();
        for (const item of analise.itens) {
          // Incrementa métricas de forma assíncrona
          incrementarMetricaMaterial(item.categoria).catch(() => {});

          const videos = await buscarVideosPorMaterial(item.categoria);
          for (const v of videos) {
            videosMap.set(v.youtubeId, v);
          }
        }

        const resultadoFinal: AnaliseCompleta = {
          ...analise,
          videos: Array.from(videosMap.values()),
          fontes: FONTES_PADRAO,
        };

        enviarEvento("resultado", resultadoFinal);
        enviarEvento("fim", {});
      } catch (err: any) {
        req.log.error(err, "Falha na análise da imagem");
        enviarEvento("erro", {
          mensagem: err?.message || "Ocorreu um erro ao processar sua imagem. Tente novamente.",
        });
      } finally {
        reply.raw.end();
      }
    }
  );
};
