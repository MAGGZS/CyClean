import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { carregarConfigIA } from "./config-ia.js";
import { analiseIASchema, type AnaliseIA, type MensagemChat } from "@descarta/shared";

interface AnaliseParams {
  imagemBase64: string;
  mimeType: string;
  onDelta?: (chunk: string) => void;
}

export async function executarAnaliseIA({ imagemBase64, mimeType, onDelta }: AnaliseParams): Promise<AnaliseIA> {
  const cfg = await carregarConfigIA();
  if (!cfg.chave) {
    throw new Error("Chave de API da IA não configurada. Configure no painel admin.");
  }

  let respostaTexto = "";

  if (cfg.provedor === "groq") {
    const groq = new Groq({ apiKey: cfg.chave });
    // Na Groq, o modelo oficial multimodal com suporte a visão é qwen/qwen3.8-27b.
    // Caso o usuário tenha configurado um modelo apenas de texto no painel,
    // usamos qwen/qwen3.8-27b para garantir o processamento da imagem sem falha.
    const modeloVisao =
      cfg.modelo === "openai/gpt-oss-120b" || cfg.modelo === "openai/gpt-oss-20b"
        ? "qwen/qwen3.8-27b"
        : (cfg.modelo || "qwen/qwen3.8-27b");

    const stream = await groq.chat.completions.create({
      model: modeloVisao,
      temperature: cfg.temperatura,
      response_format: { type: "json_object" },
      stream: true,
      messages: [
        { role: "system", content: cfg.system_prompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analise a imagem deste resíduo/objeto e retorne estritamente o JSON com os campos solicitados no system prompt.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imagemBase64}`,
              },
            },
          ],
        },
      ],
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        respostaTexto += text;
        onDelta?.(text);
      }
    }
  } else if (cfg.provedor === "anthropic") {
    const client = new Anthropic({ apiKey: cfg.chave });
    const stream = await client.messages.create({
      model: cfg.modelo || "claude-sonnet-4-5",
      max_tokens: 2048,
      temperature: cfg.temperatura,
      system: cfg.system_prompt,
      stream: true,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as any,
                data: imagemBase64,
              },
            },
            {
              type: "text",
              text: "Analise a imagem deste resíduo/objeto e retorne estritamente o JSON com os campos solicitados no system prompt.",
            },
          ],
        },
      ],
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
        const text = chunk.delta.text;
        respostaTexto += text;
        onDelta?.(text);
      }
    }
  } else if (cfg.provedor === "openai") {
    const client = new OpenAI({ apiKey: cfg.chave });
    const stream = await client.chat.completions.create({
      model: cfg.modelo || "gpt-4o",
      temperature: cfg.temperatura,
      response_format: { type: "json_object" },
      stream: true,
      messages: [
        { role: "system", content: cfg.system_prompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analise a imagem deste resíduo/objeto e retorne estritamente o JSON solicitado.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imagemBase64}`,
              },
            },
          ],
        },
      ],
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        respostaTexto += text;
        onDelta?.(text);
      }
    }
  } else if (cfg.provedor === "gemini") {
    const ai = new GoogleGenAI({ apiKey: cfg.chave });
    const responseStream = await ai.models.generateContentStream({
      model: cfg.modelo || "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: imagemBase64,
              },
            },
            {
              text: `${cfg.system_prompt}\n\nAnalise a imagem acima e retorne estritamente o JSON no formato solicitado.`,
            },
          ],
        },
      ],
    });

    for await (const chunk of responseStream) {
      const text = chunk.text || "";
      if (text) {
        respostaTexto += text;
        onDelta?.(text);
      }
    }
  } else {
    throw new Error(`Provedor de IA desconhecido: ${cfg.provedor}`);
  }

  // Remove eventuais tags de pensamento (<think>...</think>) de modelos de raciocínio
  let jsonString = respostaTexto.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Limpa possíveis blocos ```json ... ``` se o modelo envolver em markdown
  const matchMarkdown = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (matchMarkdown && matchMarkdown[1]) {
    jsonString = matchMarkdown[1].trim();
  } else {
    // Isola o JSON entre o primeiro '{' e o último '}'
    const primeiroBrace = jsonString.indexOf("{");
    const ultimoBrace = jsonString.lastIndexOf("}");
    if (primeiroBrace !== -1 && ultimoBrace > primeiroBrace) {
      jsonString = jsonString.slice(primeiroBrace, ultimoBrace + 1);
    }
  }

  try {
    const parsed = JSON.parse(jsonString);
    const validado = analiseIASchema.parse(parsed);
    return validado;
  } catch (err) {
    console.error("Erro ao fazer parse do JSON retornado pela IA. Resposta bruta:", respostaTexto);
    throw new Error("A IA gerou uma resposta que não pôde ser estruturada corretamente. Tente enviar a foto novamente.");
  }
}

interface ChatParams {
  contexto: AnaliseIA | null;
  historico: MensagemChat[];
  pergunta: string;
  onDelta: (chunk: string) => void;
}

function sanitizarTextoChat(texto: string): string {
  const limpo = texto.trim();
  if (limpo.startsWith("{") && limpo.endsWith("}")) {
    try {
      const obj = JSON.parse(limpo);
      if (typeof obj.mensagem === "string") return obj.mensagem;
    } catch {}
  }
  return texto;
}

export async function executarChatIA({ contexto, historico, pergunta, onDelta }: ChatParams): Promise<void> {
  const cfg = await carregarConfigIA();
  if (!cfg.chave) {
    throw new Error("Chave de IA não configurada.");
  }

  const promptSistemaChat = `Você é o assistente virtual do CYCLEAN, especialista em separação de materiais, reciclagem e descarte sustentável no Brasil (normas CONAMA nº 275/2001 e Política Nacional de Resíduos Sólidos).
Sua missão é conversar diretamente com o usuário com linguagem natural, amigável, clara, concisa e humana.
REGRAS OBRIGATÓRIAS:
- Responda SEMPRE em texto comum corrido em português (linguagem natural).
- NUNCA responda em formato JSON. Jamais use estruturas como {"itens": ...} ou {"mensagem": ...}.
- Responda diretamente à dúvida ou comentário do usuário.`;

  const promptContexto = contexto
    ? `CONTEXTO DA ANÁLISE PRÉVIA DA FOTO:
Itens identificados:
${JSON.stringify(contexto.itens, null, 2)}
Mensagem original da análise: "${contexto.mensagem}"

Instruções para o chat:
Responda às dúvidas do usuário sobre o descarte desse(s) material(is) com precisão técnica e tom humano, direto e amigável. Não invente procedimentos e alerte sobre contaminações comuns (ex.: gordura em papelão impede reciclagem e vai para lixo orgânico/comum; lavar embalagens plásticas e latas para não atrair vetores). Seja conciso e sem floreios.`
    : `O usuário está conversando ou tirando dúvidas gerais sobre reciclagem, descarte de materiais ou sustentabilidade.
Responda de forma prática, prestativa e objetiva. Se for relevante, convide-o a enviar uma foto do objeto para análise detalhada da lixeira correta.`;

  const systemMessage = `${promptSistemaChat}\n\n${promptContexto}`;

  const historicoLimpo = historico.map((m) => ({
    role: (m.papel === "usuario" ? "user" : "assistant") as "user" | "assistant",
    content: sanitizarTextoChat(m.texto),
  }));

  if (cfg.provedor === "groq") {
    const groq = new Groq({ apiKey: cfg.chave });
    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemMessage },
      ...historicoLimpo,
      { role: "user", content: pergunta },
    ];

    const stream = await groq.chat.completions.create({
      model: cfg.modelo || "qwen/qwen3.8-27b",
      temperature: 0.3,
      stream: true,
      messages,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) onDelta(text);
    }
  } else if (cfg.provedor === "anthropic") {
    const client = new Anthropic({ apiKey: cfg.chave });
    const messages: Anthropic.MessageParam[] = historico.map((m) => ({
      role: m.papel === "usuario" ? "user" : "assistant",
      content: sanitizarTextoChat(m.texto),
    }));
    messages.push({ role: "user", content: pergunta });

    const stream = await client.messages.create({
      model: cfg.modelo || "claude-sonnet-4-5",
      max_tokens: 1024,
      temperature: 0.3,
      system: systemMessage,
      stream: true,
      messages,
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
        onDelta(chunk.delta.text);
      }
    }
  } else if (cfg.provedor === "openai") {
    const client = new OpenAI({ apiKey: cfg.chave });
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: systemMessage },
      ...historicoLimpo,
      { role: "user", content: pergunta },
    ];

    const stream = await client.chat.completions.create({
      model: cfg.modelo || "gpt-4o",
      temperature: 0.3,
      stream: true,
      messages,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) onDelta(text);
    }
  } else if (cfg.provedor === "gemini") {
    const ai = new GoogleGenAI({ apiKey: cfg.chave });
    const contents: any[] = [
      {
        role: "user",
        parts: [{ text: `Instruções do Sistema:\n${systemMessage}` }],
      },
      {
        role: "model",
        parts: [{ text: "Entendido. Responderei diretamente em texto humano e natural, sem nenhum formato JSON." }],
      },
      ...historico.map((m) => ({
        role: m.papel === "usuario" ? "user" : "model",
        parts: [{ text: sanitizarTextoChat(m.texto) }],
      })),
      {
        role: "user",
        parts: [{ text: pergunta }],
      },
    ];

    const stream = await ai.models.generateContentStream({
      model: cfg.modelo || "gemini-2.5-flash",
      contents,
    });

    for await (const chunk of stream) {
      const text = chunk.text || "";
      if (text) onDelta(text);
    }
  }
}

export async function testarConexaoIA(): Promise<{ sucesso: boolean; mensagem: string }> {
  const cfg = await carregarConfigIA();
  if (!cfg.chave) {
    return { sucesso: false, mensagem: "Chave de API não informada." };
  }

  try {
    if (cfg.provedor === "groq") {
      const groq = new Groq({ apiKey: cfg.chave });
      await groq.chat.completions.create({
        model: cfg.modelo || "qwen/qwen3.8-27b",
        max_tokens: 10,
        messages: [{ role: "user", content: "Ping" }],
      });
      return { sucesso: true, mensagem: `Conectado com sucesso à Groq (${cfg.modelo || "qwen/qwen3.8-27b"})` };
    } else if (cfg.provedor === "anthropic") {
      const client = new Anthropic({ apiKey: cfg.chave });
      const resp = await client.messages.create({
        model: cfg.modelo || "claude-sonnet-4-5",
        max_tokens: 10,
        messages: [{ role: "user", content: "Ping" }],
      });
      return { sucesso: true, mensagem: `Conectado com sucesso ao Anthropic (${cfg.modelo})` };
    } else if (cfg.provedor === "openai") {
      const client = new OpenAI({ apiKey: cfg.chave });
      await client.chat.completions.create({
        model: cfg.modelo || "gpt-4o",
        max_tokens: 5,
        messages: [{ role: "user", content: "Ping" }],
      });
      return { sucesso: true, mensagem: `Conectado com sucesso à OpenAI (${cfg.modelo})` };
    } else if (cfg.provedor === "gemini") {
      const ai = new GoogleGenAI({ apiKey: cfg.chave });
      await ai.models.generateContent({
        model: cfg.modelo || "gemini-2.5-flash",
        contents: "Ping",
      });
      return { sucesso: true, mensagem: `Conectado com sucesso ao Google Gemini (${cfg.modelo})` };
    }
    return { sucesso: false, mensagem: `Provedor desconhecido: ${cfg.provedor}` };
  } catch (err: any) {
    return { sucesso: false, mensagem: err?.message || "Falha na comunicação com a API de IA" };
  }
}
