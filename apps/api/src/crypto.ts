import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "./env.js";

/**
 * AES-256-GCM com a ENCRYPTION_KEY (32 bytes, em base64 ou hex).
 * Formato salvo no banco: "v1:<iv base64>:<tag base64>:<cifra base64>".
 */
function carregarChave(): Buffer {
  const bruto = env.ENCRYPTION_KEY.trim();
  const chave = /^[0-9a-fA-F]{64}$/.test(bruto) ? Buffer.from(bruto, "hex") : Buffer.from(bruto, "base64");
  if (chave.length !== 32) {
    console.error("ENCRYPTION_KEY precisa ter exatamente 32 bytes (base64 de 44 caracteres ou hex de 64).");
    process.exit(1);
  }
  return chave;
}

const CHAVE = carregarChave();

export function criptografar(texto: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", CHAVE, iv);
  const cifra = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64"), tag.toString("base64"), cifra.toString("base64")].join(":");
}

export function descriptografar(valor: string): string {
  const [versao, ivB64, tagB64, cifraB64] = valor.split(":");
  if (versao !== "v1" || !ivB64 || !tagB64 || !cifraB64) {
    throw new Error("Valor criptografado em formato desconhecido");
  }
  const decipher = createDecipheriv("aes-256-gcm", CHAVE, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(cifraB64, "base64")), decipher.final()]).toString("utf8");
}

/** Últimos 4 caracteres, a única parte da chave que volta ao navegador. */
export function finalDaChave(chave: string): string {
  return chave.slice(-4);
}
