import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node20",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  // O pacote compartilhado é TypeScript puro: entra no bundle.
  noExternal: ["@descarta/shared"],
});
