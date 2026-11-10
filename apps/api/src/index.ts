import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import { env, emProducao } from "./env.js";
import { healthRoutes } from "./routes/health.js";
import { analisarRoutes } from "./routes/analisar.js";
import { chatRoutes } from "./routes/chat.js";
import { adminRoutes } from "./routes/admin.js";
import { LIMITE_UPLOAD_BYTES } from "@descarta/shared";

const app = Fastify({
  trustProxy: true,
  logger: {
    level: emProducao ? "info" : "debug",
    // REDAÇÃO ESTRITA: NUNCA logar corpo da requisição nem cookies/auth
    redact: {
      paths: [
        "req.headers.cookie",
        "req.headers.authorization",
        "req.headers['x-forwarded-for']",
        "req.body",
        "req.body.imagem",
        "req.body.senha",
        "req.body.chave",
      ],
      censor: "[CONFIDENCIAL]",
    },
  },
});

// Cookie
await app.register(cookie, {
  secret: env.SESSION_SECRET,
  parseOptions: {},
});

// CORS restrito ao domínio da Vercel (ALLOWED_ORIGIN), com credenciais
await app.register(cors, {
  origin: (origin, cb) => {
    // Permite chamadas sem origin (ex.: curl, health check do Render, SSR)
    if (!origin) return cb(null, true);

    const permitida = env.ALLOWED_ORIGIN.replace(/\/+$/, "");
    const solicitante = origin.replace(/\/+$/, "");

    if (solicitante === permitida) {
      return cb(null, true);
    }

    // Em desenvolvimento, permite localhost
    if (!emProducao && (solicitante.startsWith("http://localhost:") || solicitante.startsWith("http://127.0.0.1:"))) {
      return cb(null, true);
    }

    cb(new Error(`Origem não permitida pelo CORS: ${origin}`), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With"],
});

// Multipart em memória, limite 8 MB
await app.register(multipart, {
  limits: {
    fileSize: LIMITE_UPLOAD_BYTES,
    files: 1,
  },
  attachFieldsToBody: false,
});

// Rate limit global em memória
await app.register(rateLimit, {
  global: false,
  max: 60,
  timeWindow: "1 minute",
  allowList: (req) => req.url === "/api/health",
  keyGenerator: (req) => req.ip || "unknown",
});

// Registra rotas
await app.register(healthRoutes);
await app.register(analisarRoutes);
await app.register(chatRoutes);
await app.register(adminRoutes);

// Tratamento de erros limpo
app.setErrorHandler((error: any, req, reply) => {
  req.log.error(error);
  const status = error.statusCode || 500;
  reply.status(status).send({
    erro: status === 500 ? "Ocorreu um erro interno no servidor." : error.message,
  });
});

const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    app.log.info(`Servidor Descarta API iniciado na porta ${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
