import { sql, hojeEmBrasilia } from "./db.js";
import type { MetricasResposta } from "@descarta/shared";

export async function incrementarMetricaMaterial(material: string): Promise<void> {
  const dataHoje = hojeEmBrasilia();
  try {
    await sql`
      INSERT INTO public.metricas_diarias (data, material, total)
      VALUES (${dataHoje}, ${material}, 1)
      ON CONFLICT (data, material)
      DO UPDATE SET total = public.metricas_diarias.total + 1
    `;
  } catch (err) {
    console.error("Falha ao registrar métrica no banco:", err);
  }
}

export async function obterMetricasAdmin(dias = 30): Promise<MetricasResposta> {
  try {
    const porDiaRaw = await sql<{ data: string; total: number }[]>`
      SELECT data::text as data, SUM(total)::int as total
      FROM public.metricas_diarias
      WHERE data >= CURRENT_DATE - ${dias}::int
      GROUP BY data
      ORDER BY data ASC
    `;

    const porMaterialRaw = await sql<{ material: string; total: number }[]>`
      SELECT material, SUM(total)::int as total
      FROM public.metricas_diarias
      GROUP BY material
      ORDER BY total DESC
      LIMIT 15
    `;

    const totalLinhas = await sql<{ total: number }[]>`
      SELECT COALESCE(SUM(total), 0)::int as total
      FROM public.metricas_diarias
    `;

    return {
      porDia: porDiaRaw,
      porMaterial: porMaterialRaw,
      total: totalLinhas[0]?.total ?? 0,
      dias,
    };
  } catch (err) {
    console.error("Erro ao buscar métricas:", err);
    return {
      porDia: [],
      porMaterial: [],
      total: 0,
      dias,
    };
  }
}
