import { LADO_MAXIMO_IMAGEM, LIMITE_UPLOAD_BYTES, QUALIDADE_JPEG } from "@descarta/shared";

const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const ALVO_BYTES = 2 * 1024 * 1024;

export const ACEITA_INPUT = "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";

export interface ImagemPreparada {
  blob: Blob;
  nome: string;
  /** URL de pré-visualização, ou null quando o navegador não decodifica o formato (HEIC). */
  previa: string | null;
}

function ehHeic(arquivo: File) {
  return /hei[cf]$/i.test(arquivo.type) || /\.hei[cf]$/i.test(arquivo.name);
}

/** Devolve a mensagem de erro, ou null se o arquivo pode seguir. */
export function validarArquivo(arquivo: File): string | null {
  const tipoOk = TIPOS_ACEITOS.includes(arquivo.type.toLowerCase()) || ehHeic(arquivo);
  if (!tipoOk) return "Esse arquivo não é uma foto. Envie JPG, PNG, WEBP ou HEIC.";
  if (arquivo.size > LIMITE_UPLOAD_BYTES) return "A foto passa de 8 MB. Escolha uma menor.";
  return null;
}

function paraJpeg(canvas: HTMLCanvasElement, qualidade: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", qualidade));
}

/**
 * Redimensiona para no máximo 1600 px e converte em JPEG 0.85. Se ainda passar
 * de 2 MB, baixa a qualidade aos poucos. HEIC que o navegador não decodifica
 * segue como veio (a API aceita), só sem pré-visualização.
 */
export async function prepararImagem(arquivo: File): Promise<ImagemPreparada> {
  const url = URL.createObjectURL(arquivo);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();

    const escala = Math.min(1, LADO_MAXIMO_IMAGEM / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * escala);
    canvas.height = Math.round(img.naturalHeight * escala);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    let blob: Blob | null = null;
    for (const q of [QUALIDADE_JPEG, 0.75, 0.65, 0.5]) {
      blob = await paraJpeg(canvas, q);
      if (blob && blob.size <= ALVO_BYTES) break;
    }
    if (!blob) throw new Error("jpeg");

    return { blob, nome: "descarte.jpg", previa: URL.createObjectURL(blob) };
  } catch {
    if (ehHeic(arquivo)) return { blob: arquivo, nome: arquivo.name || "descarte.heic", previa: null };
    throw new Error("Não deu para abrir essa foto. Tente outra, de preferência em JPG ou PNG.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
