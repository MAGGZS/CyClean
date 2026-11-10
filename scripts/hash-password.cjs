const argonPath = require.resolve("@node-rs/argon2", {
  paths: [process.cwd() + "/apps/api", process.cwd()],
});
const { argon2id, hash } = require(argonPath);

const senha = process.argv[2];

if (!senha) {
  console.error("Uso: pnpm hash-password \"sua-senha-aqui\"");
  process.exit(1);
}

hash(senha, {
  algorithm: argon2id,
  memoryCost: 65536,
  timeCost: 3,
  outputLen: 32,
  parallelism: 4,
})
  .then((h) => {
    console.log("\nCopie para ADMIN_PASSWORD_HASH:");
    console.log(h);
  })
  .catch((err) => {
    console.error("Erro ao gerar hash:", err);
    process.exit(1);
  });
