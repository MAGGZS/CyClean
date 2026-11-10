import { hash } from "@node-rs/argon2";

const senha = process.argv[2];

if (!senha) {
  console.error("Uso: pnpm --filter @descarta/api hash-password \"sua-senha-aqui\"");
  process.exit(1);
}

async function run() {
  // 2 = Algorithm.Argon2id
  const h = await hash(senha, {
    algorithm: 2,
    memoryCost: 65536,
    timeCost: 3,
    outputLen: 32,
    parallelism: 4,
  });
  console.log("\nCopie para ADMIN_PASSWORD_HASH:");
  console.log(h);
}

run();
