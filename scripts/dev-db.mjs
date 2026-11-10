import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, ".dev", "pgdata");
const migrationsDir = path.join(rootDir, "supabase", "migrations");

const HOST = "127.0.0.1";
const PORT = 5433;
const DATABASE_URL = `postgresql://postgres:postgres@${HOST}:${PORT}/postgres`;

function waitForDb() {
  return new Promise((resolve) => {
    const tryConnect = () => {
      const socket = net.connect(PORT, HOST, () => {
        socket.destroy();
        resolve();
      });
      socket.on("error", () => {
        socket.destroy();
        setTimeout(tryConnect, 250);
      });
    };
    tryConnect();
  });
}

async function main() {
  if (process.argv.includes("--wait")) {
    await waitForDb();
    return;
  }

  mkdirSync(dataDir, { recursive: true });

  console.log(`[dev:db] Abrindo PGlite em ${dataDir}...`);
  const db = await PGlite.create(dataDir);

  await db.exec(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
      END IF;
    END
    $$;

    CREATE TABLE IF NOT EXISTS public._dev_migrations (
      nome TEXT PRIMARY KEY,
      aplicado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const check = await db.query(
      "SELECT 1 FROM public._dev_migrations WHERE nome = $1",
      [file]
    );
    const sqlContent = readFileSync(path.join(migrationsDir, file), "utf8");
    await db.exec(sqlContent);
    if (check.rows.length === 0) {
      await db.query("INSERT INTO public._dev_migrations (nome) VALUES ($1)", [
        file,
      ]);
      console.log(`[dev:db] Migration aplicada: ${file}`);
    } else {
      console.log(`[dev:db] Migration verificada (idempotente): ${file}`);
    }
  }

  const server = new PGLiteSocketServer({
    db,
    host: HOST,
    port: PORT,
    maxConnections: 1,
  });

  await server.start();
  console.log(`[dev:db] Servidor PGlite TCP escutando em ${HOST}:${PORT}`);
  console.log(`[dev:db] DATABASE_URL=${DATABASE_URL}`);

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n[dev:db] Recebido ${signal}. Encerrando banco local...`);
    try {
      await server.stop();
      await db.close();
      console.log("[dev:db] Banco local encerrado com sucesso.");
      process.exit(0);
    } catch (err) {
      console.error("[dev:db] Erro ao encerrar:", err);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("[dev:db] Falha ao iniciar banco local:", err);
  process.exit(1);
});
