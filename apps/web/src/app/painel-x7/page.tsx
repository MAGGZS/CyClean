"use client";

import { useEffect, useState } from "react";
import {
  ShieldAlert,
  Bot,
  Video,
  BarChart3,
  LogOut,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Edit2,
  RotateCcw,
} from "lucide-react";
import {
  CATEGORIAS,
  NOMES_CATEGORIA,
  PROVEDORES,
  MODELOS_SUGERIDOS,
  type Categoria,
  type ConfigPublicaAdmin,
  type MetricasResposta,
  type Provedor,
  type VideoAdmin,
} from "@descarta/shared";

export default function PainelAdminPage() {
  const [autenticado, setAutenticado] = useState<boolean | null>(null);
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erroLogin, setErroLogin] = useState<string | null>(null);
  const [carregandoLogin, setCarregandoLogin] = useState(false);

  // Aba ativa: 'ia' | 'videos' | 'metricas'
  const [abaAtiva, setAbaAtiva] = useState<"ia" | "videos" | "metricas">("ia");

  // Estado da Configuração da IA
  const [configIA, setConfigIA] = useState<ConfigPublicaAdmin | null>(null);
  const [provedor, setProvedor] = useState<Provedor>("groq");
  const [modelo, setModelo] = useState("qwen/qwen3.8-27b");
  const [chaveNova, setChaveNova] = useState("");
  const [temperatura, setTemperatura] = useState(0.2);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [youtubeChaveNova, setYoutubeChaveNova] = useState("");
  const [outrasConfigs, setOutrasConfigs] = useState<{ chave: string; valor: string }[]>([]);
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [msgSucessoConfig, setMsgSucessoConfig] = useState<string | null>(null);
  const [testandoIA, setTestandoIA] = useState(false);
  const [resultadoTesteIA, setResultadoTesteIA] = useState<{ sucesso: boolean; mensagem: string } | null>(null);

  // Estado de Vídeos
  const [videos, setVideos] = useState<VideoAdmin[]>([]);
  const [carregandoVideos, setCarregandoVideos] = useState(false);
  const [editandoVideoId, setEditandoVideoId] = useState<string | null>(null);
  const [formVideo, setFormVideo] = useState({
    material: "plastico" as Categoria,
    titulo: "",
    url: "",
    idioma: "pt-BR",
    ativo: true,
  });
  const [erroVideo, setErroVideo] = useState<string | null>(null);

  // Estado de Métricas
  const [metricas, setMetricas] = useState<MetricasResposta | null>(null);
  const [carregandoMetricas, setCarregandoMetricas] = useState(false);

  // Verifica se já existe sessão válida
  const verificarSessao = async () => {
    try {
      const res = await fetch("/api/admin/sessao");
      if (res.ok) {
        setAutenticado(true);
        carregarTudo();
      } else {
        setAutenticado(false);
      }
    } catch {
      setAutenticado(false);
    }
  };

  useEffect(() => {
    verificarSessao();
  }, []);

  const carregarTudo = () => {
    carregarConfig();
    carregarVideos();
    carregarMetricas();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroLogin(null);
    setCarregandoLogin(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: usuario.trim(),
          senha,
          rota: "painel-x7",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.erro || "Falha ao autenticar.");
      }

      setAutenticado(true);
      carregarTudo();
    } catch (err: any) {
      setErroLogin(err.message || "Erro ao conectar.");
    } finally {
      setCarregandoLogin(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAutenticado(false);
    setUsuario("");
    setSenha("");
  };

  // Carregar Config IA
  const carregarConfig = async () => {
    try {
      const res = await fetch("/api/admin/config");
      if (res.ok) {
        const data: ConfigPublicaAdmin = await res.json();
        setConfigIA(data);
        setProvedor(data.provedor);
        setModelo(data.modelo);
        setTemperatura(data.temperatura);
        setSystemPrompt(data.system_prompt);
        setOutrasConfigs(data.outras || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Salvar Config IA
  const handleSalvarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoConfig(true);
    setMsgSucessoConfig(null);

    try {
      const body: any = {
        provedor,
        modelo,
        temperatura: Number(temperatura),
        system_prompt: systemPrompt,
        outras: outrasConfigs,
      };

      if (chaveNova.trim()) {
        body.chave = chaveNova.trim();
      }
      if (youtubeChaveNova.trim()) {
        body.youtube_chave = youtubeChaveNova.trim();
      }

      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.erro || "Erro ao salvar configuração.");
      }

      setMsgSucessoConfig("Configurações salvas e criptografadas com sucesso!");
      setChaveNova("");
      setYoutubeChaveNova("");
      carregarConfig();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSalvandoConfig(false);
    }
  };

  // Testar Conexão IA
  const handleTestarIA = async () => {
    setTestandoIA(true);
    setResultadoTesteIA(null);
    try {
      const res = await fetch("/api/admin/testar-ia", { method: "POST" });
      const data = await res.json();
      setResultadoTesteIA(data);
    } catch (err: any) {
      setResultadoTesteIA({ sucesso: false, mensagem: err.message || "Erro ao testar conexão." });
    } finally {
      setTestandoIA(false);
    }
  };

  // Vídeos CRUD
  const carregarVideos = async () => {
    setCarregandoVideos(true);
    try {
      const res = await fetch("/api/admin/videos");
      if (res.ok) {
        const list = await res.json();
        setVideos(list);
      }
    } finally {
      setCarregandoVideos(false);
    }
  };

  const handleSalvarVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroVideo(null);

    try {
      const url = editandoVideoId ? `/api/admin/videos/${editandoVideoId}` : "/api/admin/videos";
      const method = editandoVideoId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formVideo),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.erro || "Falha ao salvar vídeo.");
      }

      setFormVideo({
        material: "plastico",
        titulo: "",
        url: "",
        idioma: "pt-BR",
        ativo: true,
      });
      setEditandoVideoId(null);
      carregarVideos();
    } catch (err: any) {
      setErroVideo(err.message);
    }
  };

  const handleExcluirVideo = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este vídeo de referência?")) return;
    try {
      await fetch(`/api/admin/videos/${id}`, { method: "DELETE" });
      carregarVideos();
    } catch (err) {
      console.error(err);
    }
  };

  // Métricas
  const carregarMetricas = async () => {
    setCarregandoMetricas(true);
    try {
      const res = await fetch("/api/admin/metricas?dias=30");
      if (res.ok) {
        const data = await res.json();
        setMetricas(data);
      }
    } finally {
      setCarregandoMetricas(false);
    }
  };

  // Carregando verificação de sessão inicial
  if (autenticado === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#12241A] text-[#F2F3E7]">
        <div className="animate-pulse text-sm text-[#96BCA1]">Verificando acesso...</div>
      </div>
    );
  }

  // Tela de Login
  if (!autenticado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#12241A] p-4 text-[#F2F3E7]">
        <div className="w-full max-w-md rounded-[28px] border border-[rgba(242,243,231,0.12)] bg-[#12241A] p-8 shadow-2xl space-y-6">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#2F5A45] text-[#96BCA1]">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#F2F3E7]">Acesso Restrito</h1>
            <p className="text-xs text-[#D6D5B0]/70">Painel de Administração do CYCLEAN</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#D6D5B0]">Usuário</label>
              <input
                type="text"
                required
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full rounded-[14px] border border-[rgba(242,243,231,0.14)] bg-[#2F5A45]/30 px-4 py-2.5 text-sm text-[#F2F3E7] placeholder-[#D6D5B0]/40 focus:border-[#96BCA1] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#D6D5B0]">Senha</label>
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full rounded-[14px] border border-[rgba(242,243,231,0.14)] bg-[#2F5A45]/30 px-4 py-2.5 text-sm text-[#F2F3E7] focus:border-[#96BCA1] focus:outline-none"
              />
            </div>

            {erroLogin && (
              <div className="rounded-[12px] border border-[#C8312B]/40 bg-[#C8312B]/10 p-3 text-xs text-[#F2F3E7]">
                {erroLogin}
              </div>
            )}

            <button
              type="submit"
              disabled={carregandoLogin}
              className="btn-pill-solid w-full py-3 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
            >
              {carregandoLogin ? "Verificando..." : "Entrar no painel"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Painel Autenticado
  return (
    <div className="min-h-screen bg-[#12241A] text-[#F2F3E7]">
      {/* Topo do Painel */}
      <header className="border-b border-[rgba(242,243,231,0.08)] bg-[#12241A] px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-[#96BCA1]" />
            <h1 className="text-base font-bold text-[#F2F3E7]">CYCLEAN · Painel de Gestão</h1>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/"
              target="_blank"
              className="btn-pill-outline inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
            >
              <span>Ver site público</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs text-[#D6D5B0] hover:text-[#C8312B] transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="mx-auto max-w-6xl p-6 sm:p-8 space-y-8">
        {/* Navegação por Abas */}
        <div className="flex border-b border-[rgba(242,243,231,0.08)] gap-2">
          <button
            type="button"
            onClick={() => setAbaAtiva("ia")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              abaAtiva === "ia"
                ? "border-[#96BCA1] text-[#96BCA1]"
                : "border-transparent text-[#D6D5B0] hover:text-[#F2F3E7]"
            }`}
          >
            <Bot className="h-4 w-4" />
            <span>Configuração da IA</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva("videos")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              abaAtiva === "videos"
                ? "border-[#96BCA1] text-[#96BCA1]"
                : "border-transparent text-[#D6D5B0] hover:text-[#F2F3E7]"
            }`}
          >
            <Video className="h-4 w-4" />
            <span>Biblioteca de Vídeos</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva("metricas")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              abaAtiva === "metricas"
                ? "border-[#96BCA1] text-[#96BCA1]"
                : "border-transparent text-[#D6D5B0] hover:text-[#F2F3E7]"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Métricas e Descartes</span>
          </button>
        </div>

        {/* ================= ABA 1: CONFIGURAÇÃO DA IA ================= */}
        {abaAtiva === "ia" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#F2F3E7]">Provedor e Inteligência</h2>
                <p className="text-xs text-[#D6D5B0]/70">
                  A chave é criptografada com AES-256-GCM antes de ir ao banco e só existe na memória da API durante a requisição.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestarIA}
                disabled={testandoIA}
                className="btn-pill-outline self-start sm:self-auto px-4 py-2 text-xs font-semibold"
              >
                {testandoIA ? "Testando..." : "Testar conexão com a IA"}
              </button>
            </div>

            {/* Resultado do Teste de Conexão */}
            {resultadoTesteIA && (
              <div
                className={`flex items-start gap-3 rounded-[16px] p-4 text-xs ${
                  resultadoTesteIA.sucesso
                    ? "border border-[#96BCA1]/40 bg-[#2F5A45]/30 text-[#F2F3E7]"
                    : "border border-[#C8312B]/40 bg-[#C8312B]/10 text-[#F2F3E7]"
                }`}
              >
                {resultadoTesteIA.sucesso ? (
                  <CheckCircle2 className="h-4 w-4 text-[#96BCA1] shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-[#C8312B] shrink-0" />
                )}
                <span>{resultadoTesteIA.mensagem}</span>
              </div>
            )}

            {msgSucessoConfig && (
              <div className="flex items-center gap-2 rounded-[16px] border border-[#96BCA1]/40 bg-[#2F5A45]/40 p-4 text-xs text-[#F2F3E7]">
                <CheckCircle2 className="h-4 w-4 text-[#96BCA1]" />
                <span>{msgSucessoConfig}</span>
              </div>
            )}

            <form onSubmit={handleSalvarConfig} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 rounded-[24px] border border-[rgba(242,243,231,0.1)] bg-[#2F5A45]/20 p-6">
                {/* Provedor */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#D6D5B0] uppercase tracking-wider">
                    Provedor de IA
                  </label>
                  <select
                    value={provedor}
                    onChange={(e) => {
                      const p = e.target.value as Provedor;
                      setProvedor(p);
                      const modelos = MODELOS_SUGERIDOS[p];
                      if (modelos && modelos[0]) setModelo(modelos[0]);
                    }}
                    className="w-full rounded-[14px] border border-[rgba(242,243,231,0.14)] bg-[#12241A] px-4 py-2.5 text-sm text-[#F2F3E7] focus:border-[#96BCA1] focus:outline-none"
                  >
                    {PROVEDORES.map((p) => (
                      <option key={p} value={p}>
                        {p === "groq"
                          ? "Groq (Gratuito & Ultrarrápido — Recomendado)"
                          : p === "gemini"
                          ? "Google Gemini (Gratuito no AI Studio)"
                          : p === "openai"
                          ? "OpenAI"
                          : "Anthropic (Claude)"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Modelo */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#D6D5B0] uppercase tracking-wider">
                    Modelo com Visão
                  </label>
                  <input
                    type="text"
                    required
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    list="modelos-sugeridos"
                    className="w-full rounded-[14px] border border-[rgba(242,243,231,0.14)] bg-[#12241A] px-4 py-2.5 text-sm text-[#F2F3E7] focus:border-[#96BCA1] focus:outline-none"
                  />
                  <datalist id="modelos-sugeridos">
                    {(MODELOS_SUGERIDOS[provedor] || []).map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                  {provedor === "groq" && (
                    <p className="text-[11px] text-[#96BCA1]">
                      Para análise de imagem com IA, utilize <strong>qwen/qwen3.8-27b</strong> (único modelo com visão ativo na Groq).
                    </p>
                  )}
                </div>

                {/* Chave de API */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#D6D5B0] uppercase tracking-wider">
                      Chave de API
                    </label>
                    {configIA?.chave_final && (
                      <span className="text-[11px] text-[#96BCA1] font-mono">
                        Ativa: ••••{configIA.chave_final}
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    placeholder={
                      configIA?.chave_final
                        ? "Deixe em branco para manter a atual"
                        : provedor === "groq"
                        ? "gsk_..."
                        : "sk-..."
                    }
                    value={chaveNova}
                    onChange={(e) => setChaveNova(e.target.value)}
                    className="w-full rounded-[14px] border border-[rgba(242,243,231,0.14)] bg-[#12241A] px-4 py-2.5 text-sm text-[#F2F3E7] placeholder-[#D6D5B0]/40 focus:border-[#96BCA1] focus:outline-none"
                  />
                  <p className="text-[11px] text-[#D6D5B0]/70">
                    {provedor === "groq" && (
                      <>
                        Chave gratuita em{" "}
                        <a
                          href="https://console.groq.com/keys"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#96BCA1] underline underline-offset-2 hover:text-[#F2F3E7]"
                        >
                          console.groq.com/keys
                        </a>{" "}
                        (inicia com <code className="font-mono text-white">gsk_</code>)
                      </>
                    )}
                    {provedor === "gemini" && (
                      <>
                        Chave gratuita em{" "}
                        <a
                          href="https://aistudio.google.com/apikey"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#96BCA1] underline underline-offset-2 hover:text-[#F2F3E7]"
                        >
                          aistudio.google.com/apikey
                        </a>
                      </>
                    )}
                    {provedor === "openai" && "Chave da OpenAI em platform.openai.com"}
                    {provedor === "anthropic" && "Chave da Anthropic em console.anthropic.com"}
                  </p>
                </div>

                {/* Temperatura */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#D6D5B0] uppercase tracking-wider">
                      Temperatura
                    </label>
                    <span className="text-xs font-mono text-[#96BCA1]">{temperatura}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={temperatura}
                    onChange={(e) => setTemperatura(parseFloat(e.target.value))}
                    className="w-full accent-[#96BCA1] cursor-pointer"
                  />
                  <p className="text-[11px] text-[#D6D5B0]/60">
                    Menor temperatura (0.1 - 0.3) garante respostas mais objetivas e confiáveis.
                  </p>
                </div>

                {/* YouTube Data API Key (Opcional) */}
                <div className="md:col-span-2 space-y-2 pt-2 border-t border-[rgba(242,243,231,0.08)]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#D6D5B0] uppercase tracking-wider">
                      Chave do YouTube Data API (Opcional)
                    </label>
                    {configIA?.youtube_chave_final && (
                      <span className="text-[11px] text-[#96BCA1] font-mono">
                        Ativa: ••••{configIA.youtube_chave_final}
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    placeholder="Se não preenchida, o sistema usa apenas a biblioteca manual abaixo"
                    value={youtubeChaveNova}
                    onChange={(e) => setYoutubeChaveNova(e.target.value)}
                    className="w-full rounded-[14px] border border-[rgba(242,243,231,0.14)] bg-[#12241A] px-4 py-2.5 text-sm text-[#F2F3E7] placeholder-[#D6D5B0]/40 focus:border-[#96BCA1] focus:outline-none"
                  />
                </div>
              </div>

              {/* System Prompt */}
              <div className="space-y-2 rounded-[24px] border border-[rgba(242,243,231,0.1)] bg-[#2F5A45]/20 p-6">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#D6D5B0] uppercase tracking-wider">
                    System Prompt do CYCLEAN
                  </label>
                  {configIA?.system_prompt_padrao && (
                    <button
                      type="button"
                      onClick={() => setSystemPrompt(configIA.system_prompt_padrao)}
                      className="inline-flex items-center gap-1 text-[11px] text-[#96BCA1] hover:underline"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Restaurar padrão</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={10}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full rounded-[14px] border border-[rgba(242,243,231,0.14)] bg-[#12241A] p-4 text-xs font-mono text-[#F2F3E7] focus:border-[#96BCA1] focus:outline-none"
                />
              </div>

              {/* Botão de Salvar */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={salvandoConfig}
                  className="btn-pill-mint inline-flex items-center gap-2 px-6 py-3 text-sm font-bold shadow-md"
                >
                  <Save className="h-4 w-4" />
                  <span>{salvandoConfig ? "Salvando..." : "Salvar Configurações"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= ABA 2: BIBLIOTECA DE VÍDEOS ================= */}
        {abaAtiva === "videos" && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#F2F3E7]">Biblioteca de Vídeos por Material</h2>
                <p className="text-xs text-[#D6D5B0]/70">
                  Os vídeos cadastrados são apresentados pela IA no chat quando o material correspondente for identificado.
                </p>
              </div>
            </div>

            {/* Formulário de Adição/Edição de Vídeo */}
            <form
              onSubmit={handleSalvarVideo}
              className="rounded-[24px] border border-[rgba(242,243,231,0.1)] bg-[#2F5A45]/20 p-6 space-y-4"
            >
              <h3 className="text-sm font-bold text-[#F2F3E7]">
                {editandoVideoId ? "Editar Vídeo" : "Adicionar Novo Vídeo"}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#D6D5B0]">Material</label>
                  <select
                    value={formVideo.material}
                    onChange={(e) => setFormVideo({ ...formVideo, material: e.target.value as Categoria })}
                    className="w-full rounded-[12px] border border-[rgba(242,243,231,0.14)] bg-[#12241A] px-3 py-2 text-xs text-[#F2F3E7] focus:border-[#96BCA1] focus:outline-none"
                  >
                    {CATEGORIAS.map((cat) => (
                      <option key={cat} value={cat}>
                        {NOMES_CATEGORIA[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#D6D5B0]">Título descritivo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Como reciclar garrafas PET"
                    value={formVideo.titulo}
                    onChange={(e) => setFormVideo({ ...formVideo, titulo: e.target.value })}
                    className="w-full rounded-[12px] border border-[rgba(242,243,231,0.14)] bg-[#12241A] px-3 py-2 text-xs text-[#F2F3E7] focus:border-[#96BCA1] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#D6D5B0]">URL do YouTube</label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={formVideo.url}
                    onChange={(e) => setFormVideo({ ...formVideo, url: e.target.value })}
                    className="w-full rounded-[12px] border border-[rgba(242,243,231,0.14)] bg-[#12241A] px-3 py-2 text-xs text-[#F2F3E7] focus:border-[#96BCA1] focus:outline-none"
                  />
                </div>
              </div>

              {erroVideo && (
                <p className="text-xs text-[#C8312B]">{erroVideo}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                {editandoVideoId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditandoVideoId(null);
                      setFormVideo({
                        material: "plastico",
                        titulo: "",
                        url: "",
                        idioma: "pt-BR",
                        ativo: true,
                      });
                    }}
                    className="btn-pill-outline px-4 py-2 text-xs"
                  >
                    Cancelar edição
                  </button>
                )}

                <button
                  type="submit"
                  className="btn-pill-mint inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{editandoVideoId ? "Atualizar Vídeo" : "Adicionar à biblioteca"}</span>
                </button>
              </div>
            </form>

            {/* Tabela de Vídeos Cadastrados */}
            <div className="overflow-hidden rounded-[24px] border border-[rgba(242,243,231,0.1)] bg-[#12241A]">
              <table className="w-full text-left text-xs text-[#F2F3E7]">
                <thead className="bg-[#2F5A45]/30 text-[#D6D5B0] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Material</th>
                    <th className="px-6 py-3.5">Título</th>
                    <th className="px-6 py-3.5">URL</th>
                    <th className="px-6 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(242,243,231,0.06)]">
                  {videos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-[#D6D5B0]/50">
                        Nenhum vídeo cadastrado ainda. Adicione o primeiro no formulário acima.
                      </td>
                    </tr>
                  ) : (
                    videos.map((vid) => (
                      <tr key={vid.id} className="hover:bg-[#2F5A45]/20 transition-colors">
                        <td className="px-6 py-4 font-semibold text-[#96BCA1]">
                          {NOMES_CATEGORIA[vid.material] || vid.material}
                        </td>
                        <td className="px-6 py-4 font-medium text-[#F2F3E7] max-w-xs truncate">
                          {vid.titulo}
                        </td>
                        <td className="px-6 py-4 text-[#D6D5B0]/70 max-w-xs truncate">
                          <a
                            href={vid.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:text-[#96BCA1] underline"
                          >
                            <span>Link</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditandoVideoId(vid.id);
                              setFormVideo({
                                material: vid.material,
                                titulo: vid.titulo,
                                url: vid.url,
                                idioma: vid.idioma,
                                ativo: vid.ativo,
                              });
                            }}
                            className="rounded-full p-1.5 text-[#D6D5B0] hover:bg-[rgba(242,243,231,0.08)] hover:text-[#F2F3E7]"
                            aria-label="Editar vídeo"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluirVideo(vid.id)}
                            className="rounded-full p-1.5 text-[#D6D5B0] hover:bg-[#C8312B]/20 hover:text-[#C8312B]"
                            aria-label="Excluir vídeo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= ABA 3: MÉTRICAS E DESCARTES ================= */}
        {abaAtiva === "metricas" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#F2F3E7]">Métricas Ecológicas Agregadas</h2>
              <p className="text-xs text-[#D6D5B0]/70">
                Contagem anônima de análises por material e por dia. Nenhum dado de visitante ou imagem é salvo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="rounded-[24px] border border-[rgba(242,243,231,0.1)] bg-[#2F5A45]/30 p-6 space-y-1">
                <span className="text-xs text-[#D6D5B0]">Total de Análises Realizadas</span>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#F2F3E7]">
                  {metricas?.total || 0}
                </div>
              </div>

              <div className="rounded-[24px] border border-[rgba(242,243,231,0.1)] bg-[#2F5A45]/30 p-6 space-y-1">
                <span className="text-xs text-[#D6D5B0]">Período Considerado</span>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#F2F3E7]">
                  Últimos {metricas?.dias || 30} dias
                </div>
              </div>

              <div className="rounded-[24px] border border-[rgba(242,243,231,0.1)] bg-[#2F5A45]/30 p-6 space-y-1">
                <span className="text-xs text-[#D6D5B0]">Materiais Distintos</span>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#F2F3E7]">
                  {metricas?.porMaterial?.length || 0}
                </div>
              </div>
            </div>

            {/* Tabela de Materiais Mais Consultados */}
            <div className="rounded-[24px] border border-[rgba(242,243,231,0.1)] bg-[#12241A] p-6 space-y-4">
              <h3 className="text-sm font-bold text-[#F2F3E7]">Descartes por Categoria de Material</h3>

              {metricas?.porMaterial && metricas.porMaterial.length > 0 ? (
                <div className="space-y-3">
                  {metricas.porMaterial.map((m) => {
                    const porcentagem = metricas.total > 0 ? Math.round((m.total / metricas.total) * 100) : 0;
                    return (
                      <div key={m.material} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#F2F3E7]">
                            {NOMES_CATEGORIA[m.material as Categoria] || m.material}
                          </span>
                          <span className="text-[#D6D5B0] font-mono">
                            {m.total} ({porcentagem}%)
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(242,243,231,0.06)]">
                          <div
                            className="h-full bg-[#96BCA1] rounded-full transition-all duration-500"
                            style={{ width: `${porcentagem}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#D6D5B0]/50 py-4 text-center">
                  Nenhuma análise registrada no período ainda. As métricas aparecerão conforme os usuários utilizarem o assistente.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
