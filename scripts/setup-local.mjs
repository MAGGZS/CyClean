import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const require = createRequire(import.meta.url);
const argonPath = require.resolve("@node-rs/argon2", {
  paths: [path.join(rootDir, "apps/api"), rootDir],
});
const { argon2id, hash } = require(argonPath);

async function main() {
  const apiEnvPath = path.join(rootDir, "apps/api/.env");
  const webEnvPath = path.join(rootDir, "apps/web/.env.local");

  if (existsSync(apiEnvPath)) {
    console.log("[setup:local] apps/api/.env já existe — mantendo arquivo atual.");
  } else {
    const encryptionKey = randomBytes(32).toString("base64");
    const sessionSecret = randomBytes(32).toString("base64");
    const adminPasswordHash = await hash("admin", {
      algorithm: argon2id,
      memoryCost: 65536,
      timeCost: 3,
      outputLen: 32,
      parallelism: 4,
    });

    const apiEnvContent = [
      "NODE_ENV=development",
      "PORT=4000",
      "DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/postgres",
      `ENCRYPTION_KEY=${encryptionKey}`,
      `SESSION_SECRET=${sessionSecret}`,
      "ADMIN_USER=admin",
      `ADMIN_PASSWORD_HASH='${adminPasswordHash}'`,
      "ADMIN_ROUTE=painel-x7",
      "ALLOWED_ORIGIN=http://localhost:3000",
      "",
    ].join("\n");

    writeFileSync(apiEnvPath, apiEnvContent, "utf8");
    console.log("[setup:local] apps/api/.env criado com sucesso (admin / admin).");
  }

  if (existsSync(webEnvPath)) {
    console.log("[setup:local] apps/web/.env.local já existe — mantendo arquivo atual.");
  } else {
    const webEnvContent = [
      "API_URL=http://localhost:4000",
      "NEXT_PUBLIC_SITE_URL=http://localhost:3000",
      "",
    ].join("\n");

    writeFileSync(webEnvPath, webEnvContent, "utf8");
    console.log("[setup:local] apps/web/.env.local criado com sucesso.");
  }
}

main().catch((err) => {
  console.error("[setup:local] Erro:", err);
  process.exit(1);
});
