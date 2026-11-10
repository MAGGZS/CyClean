import type { FastifyPluginAsync } from "fastify";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/health", async () => {
    return {
      status: "ok",
      servico: "descarta-api",
      timestamp: new Date().toISOString(),
    };
  });
};
