import { sql } from "./db.js";
import { carregarConfigIA } from "./config-ia.js";
import { extrairYoutubeId, type VideoAdmin, type VideoEntrada, type VideoReferencia } from "@descarta/shared";

export async function buscarVideosPorMaterial(categoria: string): Promise<VideoReferencia[]> {
  try {
    const rows = await sql<{ id: string; material: string; titulo: string; url: string; idioma: string }[]>`
      SELECT id, material, titulo, url, idioma
      FROM public.videos
      WHERE material = ${categoria} AND ativo = true
      ORDER BY id DESC
      LIMIT 3
    `;

    if (rows.length > 0) {
      return rows
        .map((r) => {
          const ytId = extrairYoutubeId(r.url);
          if (!ytId) return null;
          return {
            youtubeId: ytId,
            titulo: r.titulo,
            material: r.material,
            idioma: r.idioma,
          };
        })
        .filter((v): v is VideoReferencia => v !== null);
    }
  } catch (err) {
    console.warn("Erro ao buscar vídeos no banco:", err);
  }

  // Tenta buscar via YouTube Data API se chave configurada
  const cfg = await carregarConfigIA();
  if (cfg.youtube_chave) {
    try {
      const q = encodeURIComponent(`descarte correto reciclagem ${categoria}`);
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=2&q=${q}&type=video&relevanceLanguage=pt&key=${cfg.youtube_chave}`
      );
      if (res.ok) {
        const json = await res.json() as { items?: { id?: { videoId?: string }; snippet?: { title?: string } }[] };
        const itens = json.items || [];
        const resultados: VideoReferencia[] = [];
        for (const item of itens) {
          const vid = item.id?.videoId;
          const tit = item.snippet?.title;
          if (vid && tit) {
            resultados.push({
              youtubeId: vid,
              titulo: tit,
              material: categoria,
              idioma: "pt-BR",
            });
          }
        }
        if (resultados.length > 0) return resultados;
      }
    } catch (err) {
      console.warn("Erro ao buscar vídeos na YouTube Data API:", err);
    }
  }

  return [];
}

export async function listarVideosAdmin(): Promise<VideoAdmin[]> {
  const rows = await sql<{ id: string; material: string; titulo: string; url: string; idioma: string; ativo: boolean }[]>`
    SELECT id, material, titulo, url, idioma, ativo
    FROM public.videos
    ORDER BY material ASC, titulo ASC
  `;
  return rows.map((r) => ({
    id: r.id,
    material: r.material as any,
    titulo: r.titulo,
    url: r.url,
    idioma: r.idioma,
    ativo: r.ativo,
  }));
}

export async function criarVideoAdmin(dados: VideoEntrada): Promise<VideoAdmin> {
  const [novo] = await sql<{ id: string; material: string; titulo: string; url: string; idioma: string; ativo: boolean }[]>`
    INSERT INTO public.videos (material, titulo, url, idioma, ativo)
    VALUES (${dados.material}, ${dados.titulo}, ${dados.url}, ${dados.idioma}, ${dados.ativo})
    RETURNING id, material, titulo, url, idioma, ativo
  `;
  return {
    id: novo.id,
    material: novo.material as any,
    titulo: novo.titulo,
    url: novo.url,
    idioma: novo.idioma,
    ativo: novo.ativo,
  };
}

export async function atualizarVideoAdmin(id: string, dados: VideoEntrada): Promise<VideoAdmin | null> {
  const [atualizado] = await sql<{ id: string; material: string; titulo: string; url: string; idioma: string; ativo: boolean }[]>`
    UPDATE public.videos
    SET material = ${dados.material}, titulo = ${dados.titulo}, url = ${dados.url}, idioma = ${dados.idioma}, ativo = ${dados.ativo}
    WHERE id = ${id}
    RETURNING id, material, titulo, url, idioma, ativo
  `;
  if (!atualizado) return null;
  return {
    id: atualizado.id,
    material: atualizado.material as any,
    titulo: atualizado.titulo,
    url: atualizado.url,
    idioma: atualizado.idioma,
    ativo: atualizado.ativo,
  };
}

export async function excluirVideoAdmin(id: string): Promise<boolean> {
  const res = await sql`
    DELETE FROM public.videos
    WHERE id = ${id}
  `;
  return res.count > 0;
}
