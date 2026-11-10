/** Lê uma resposta Server-Sent Events vinda de fetch e entrega evento a evento. */
export async function lerSSE(
  resposta: Response,
  aoEvento: (evento: string, dados: Record<string, unknown>) => void,
): Promise<void> {
  if (!resposta.body) return;
  const leitor = resposta.body.getReader();
  const decodificador = new TextDecoder("utf-8");
  let buffer = "";

  for (;;) {
    const { value, done } = await leitor.read();
    if (done) break;
    buffer += decodificador.decode(value, { stream: true });

    const blocos = buffer.split("\n\n");
    buffer = blocos.pop() ?? "";

    for (const bloco of blocos) {
      const evento = bloco.match(/^event:\s*(\S+)/m)?.[1] ?? "message";
      const dados = bloco.match(/^data:\s*(.*)$/m)?.[1];
      if (!dados) continue;
      try {
        aoEvento(evento, JSON.parse(dados));
      } catch {
        // bloco incompleto ou inválido: ignora e segue lendo
      }
    }
  }
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * fetch que insiste enquanto o serviço do Render está acordando
 * (falha de rede ou 502/503/504). Quem chama mostra a mensagem amigável.
 */
export async function fetchAcordando(
  url: string,
  init: () => RequestInit,
  aoAguardar: () => void,
  tentativas = 4,
): Promise<Response> {
  let ultimoErro: unknown;
  for (let i = 0; i < tentativas; i++) {
    try {
      const resposta = await fetch(url, init());
      if (![502, 503, 504].includes(resposta.status)) return resposta;
      ultimoErro = new Error(String(resposta.status));
    } catch (erro) {
      if ((erro as Error)?.name === "AbortError") throw erro;
      ultimoErro = erro;
    }
    if (i < tentativas - 1) {
      aoAguardar();
      await esperar(4000);
    }
  }
  throw ultimoErro;
}
