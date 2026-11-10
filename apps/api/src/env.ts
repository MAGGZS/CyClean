import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  ENCRYPTION_KEY: z.string().min(32),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET precisa de pelo menos 32 caracteres"),
  ADMIN_USER: z.string().min(1),
  ADMIN_PASSWORD_HASH: z.string().startsWith("$argon2", "ADMIN_PASSWORD_HASH deve ser um hash argon2"),
  ADMIN_ROUTE: z
    .string()
    .min(3)
    .transform((v) => v.replace(/^\/+|\/+$/g, "")),
  ALLOWED_ORIGIN: z
    .string()
    .url()
    .transform((v) => v.replace(/\/+$/, "")),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Mostra só os nomes das variáveis com problema, nunca os valores.
  const campos = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n  ");
  console.error(`Variáveis de ambiente inválidas:\n  ${campos}`);
  process.exit(1);
}

export const env = parsed.data;
export const emProducao = env.NODE_ENV === "production";
