# CyClean — Assistente de Descarte Correto com IA

Sistema web público que ajuda os cidadãos a descartar resíduos e objetos na lixeira correta, seguindo as diretrizes da **Resolução CONAMA nº 275/2001** e da **Política Nacional de Resíduos Sólidos (Lei nº 12.305/2010)**.

O usuário envia a foto de um resíduo, a inteligência artificial identifica o material, informa a cor e nome da lixeira correta, instruções práticas de preparo (lavagem, separação de rótulos/tampas, redução de volume), erros comuns a evitar, alertas para resíduos especiais (logística reversa) e recomenda vídeos educativos.

O site é 100% público e anônimo: **sem cadastro, sem login, sem cookies de rastreamento e nenhuma imagem é salva em disco ou banco de dados**.

---

## 🌐 URLs de Produção

- **Aplicação Web (Vercel):** [https://cyclean-rho.vercel.app](https://cyclean-rho.vercel.app)
- **Painel Administrativo:** [https://cyclean-rho.vercel.app/painel-x7](https://cyclean-rho.vercel.app/painel-x7)
- **API Backend (Render):** [https://descarta-api-fa7a.onrender.com](https://descarta-api-fa7a.onrender.com)
- **Health Check API:** [https://descarta-api-fa7a.onrender.com/api/health](https://descarta-api-fa7a.onrender.com/api/health)

---

## 🏗️ Arquitetura do Sistema

O sistema é dividido em três camadas hospedadas de forma independente:

| Camada | Hospedagem | Responsabilidade |
| :--- | :--- | :--- |
| **Front-end** | **Vercel** (`apps/web`) | Next.js (App Router), Tailwind CSS, animações com GSAP, painel admin seguro |
| **API** | **Render** (`apps/api`) | Fastify em TypeScript, visão computacional com IA, autenticação argon2id, rate limiting |
| **Banco** | **Render PostgreSQL** (`cyclean-db`) | Postgres gerenciado na mesma região privada (`ohio`) com auto-inicialização de schema |

Fluxo de requisições:
```
Navegador → Vercel (Next.js) ──[rewrite /api/*]──> Render (Fastify) ──> Provedor de IA (Groq / Gemini / OpenAI / Claude)
                                                                 └──> Render Postgres (cyclean-db)
```

### Regras de Segurança e Privacidade
- **Nenhuma imagem é salva:** Nem no banco de dados, nem em storage S3/Blob, nem em disco do servidor. O buffer existe apenas na memória RAM durante a requisição.
- **Isolamento total de credenciais:** O navegador nunca acessa o banco diretamente nem recebe chaves de IA. Apenas a API no Render possui a chave descriptografada em memória volátil.
- **CORS Restrito:** A API no Render aceita requisições apenas da URL configurada em `ALLOWED_ORIGIN` (`https://cyclean-rho.vercel.app`).
- **First-party Cookies:** Graças ao rewrite do Next.js de `/api/*` para o Render, o cookie de sessão do administrador trafega como first-party (`httpOnly`, `secure`, `sameSite=strict`).

---

## 💻 Rodando Localmente (Desenvolvimento)

Este modo é **exclusivo para desenvolvimento local** (usa banco PGlite em `.dev/pgdata`) e **não toca em nenhum serviço de produção** (Supabase, Render ou Vercel).

1. Instale as dependências:
   ```bash
   pnpm install
   ```
2. Gere os arquivos `.env` locais (não sobrescreve se já existirem):
   ```bash
   pnpm setup:local
   ```
3. Inicie o banco local, a API e o front-end juntos:
   ```bash
   pnpm dev
   ```
4. Acesse no navegador:
   - **Aplicação:** [http://localhost:3000](http://localhost:3000)
   - **Painel Admin:** [http://localhost:3000/painel-x7](http://localhost:3000/painel-x7) — usuário `admin` e senha `admin`
5. **Como zerar o banco local:** pare o `pnpm dev` e apague a pasta `.dev/pgdata` (na próxima execução ela será recriada automaticamente com as migrations).

---

## 🚀 Guia Passo a Passo de Deploy

A ordem recomendada de implantação é: **1º Render (Banco e API)** e depois **2º Vercel (Front-end)**.

---

### Passo 1: Render (Banco de Dados PostgreSQL)

1. Crie uma instância de PostgreSQL no [Render](https://render.com) (ex: `cyclean-db`), de preferência na mesma região do Web Service (ex: `ohio`).
2. Copie a **Internal Database URL** fornecida pelo Render.
   - A API inicializa automaticamente o schema do banco (`initDb()`) na primeira execução, criando as tabelas necessárias:
     - `public.config` (chave/valor para provedor de IA, chaves criptografadas e system prompt)
     - `public.videos` (biblioteca de vídeos educativos por material)
     - `public.metricas_diarias` (contadores anônimos de análises por data e material)

---

### Passo 2: Render (API Web Service)

1. Faça fork ou envie este repositório para o seu GitHub / GitLab.
2. No painel do [Render](https://render.com), crie o **Web Service** usando o Blueprint (`render.yaml`) ou configuração manual:
   - **Runtime:** Node
   - **Region:** Ohio (US East)
   - **Root Directory:** `.`
   - **Build Command:** `npm install -g pnpm@9.15.9 && pnpm install --frozen-lockfile --prod=false && pnpm build:api`
   - **Start Command:** `node apps/api/dist/index.js`
   - **Health Check Path:** `/api/health`
3. Configure as seguintes **Environment Variables** no Render:

| Variável | Descrição | Como Obter / Gerar |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Fixo |
| `PORT` | `10000` | Fixo |
| `DATABASE_URL` | URL de conexão interna do Render Postgres | Copiada do banco no Render |
| `ENCRYPTION_KEY` | Chave de 32 bytes para AES-256-GCM | Gerar com: `pnpm gen-key` |
| `SESSION_SECRET` | Chave secreta para assinatura dos cookies | Gerar com: `pnpm gen-key` |
| `ADMIN_USER` | Nome de usuário único do administrador | Ex: `admin` |
| `ADMIN_PASSWORD_HASH` | Hash argon2id da senha de administração | Gerar com: `pnpm hash-password "sua-senha"` |
| `ADMIN_ROUTE` | Rota secreta do painel no front-end | `painel-x7` |
| `ALLOWED_ORIGIN` | URL pública da Vercel (sem barra no final) | `https://cyclean-rho.vercel.app` |

---

### Passo 3: Vercel (Front-end Web)

1. No painel da [Vercel](https://vercel.com), importe o repositório.
2. Defina o **Root Directory** como `apps/web`.
3. A Vercel detectará automaticamente o framework Next.js.
4. Adicione as seguintes **Environment Variables**:

| Variável | Valor |
| :--- | :--- |
| `API_URL` | `https://descarta-api-fa7a.onrender.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://cyclean-rho.vercel.app` |

5. Clique em **Deploy**. O Next.js fará o proxy transparente de `/api/*` diretamente para o Render.

---

## 🛠️ Comandos de Suporte

### Gerar Chave de Criptografia (32 bytes)
```bash
pnpm gen-key
```
Gera uma sequência aleatória segura de 32 bytes codificada em Base64 para a `ENCRYPTION_KEY` (AES-256-GCM) e `SESSION_SECRET`.

### Gerar Hash Argon2id para a Senha Admin
```bash
pnpm hash-password "MinhaSenhaForte123@"
```
Gera o hash criptográfico seguro `argon2id` pronto para colar na variável `ADMIN_PASSWORD_HASH`.

---

## 🔐 Acessando o Painel de Administração

O painel de administrador está protegido e oculto:
1. Rota direta: `/painel-x7`
2. Acesso visual pelo rodapé: clique discretamente no ano `2026` ou no ponto final do copyright no rodapé do site.
3. Insira o usuário configurado em `ADMIN_USER` e a senha definida para o hash.
4. No painel, você pode:
   - Configurar a chave de API da IA (Groq [gratuito e ultrarrápido], Google Gemini, OpenAI ou Anthropic Claude);
   - Testar a conexão em tempo real com a IA;
   - Ajustar o modelo, temperatura e system prompt;
   - Gerenciar a biblioteca de vídeos de apoio por material (CRUD);
   - Acompanhar os números agregados de descartes realizados.

---

## 🎨 Identidade Visual e Tokens (Eco Horizon)

- `--forest-900: #12241A` (Fundo principal)
- `--forest-700: #2F5A45` (Superfícies e cards do painel)
- `--sage-500:   #5F8D6B` (Bordas e detalhes)
- `--mint-300:   #96BCA1` (Acento único de CTA, foco e hover)
- `--sand-200:   #D6D5B0` (Texto secundário)
- `--paper-50:   #F2F3E7` (Texto principal, botões sólidos e a margem clara em volta dos frames)

### Tipografia

- **Display: Archivo** (variável, eixo `wdth`). Em peso 800 e largura 125 é a grotesca larga das palavras gigantes; a mesma família em largura 112 serve os títulos, sem carregar uma segunda fonte.
- **Texto: Manrope.** Neutra e aberta, com boa acentuação em português.
- As duas via `next/font`, com fallback definido em `apps/web/src/app/layout.tsx`.

### Animação

GSAP é a única biblioteca de animação (ScrollTrigger, SplitText e ScrollSmoother), registrada uma vez em `apps/web/src/lib/gsap.ts`. Todo componente animado usa `useGSAP` e `gsap.matchMedia()` para separar desktop, celular e `prefers-reduced-motion`. O ScrollSmoother só liga no desktop.

O hero tem três camadas: foto, palavra e `hero-depth.webp` (troncos e galhos da mesma foto, com alfa) por cima das letras. A camada de profundidade usa o mesmo `data-speed` do fundo (0.8), e não 1.1, porque é um recorte da própria foto: em velocidades diferentes as silhuetas desalinhariam.

### Componentes baseados no React Bits

Nenhum foi copiado com Motion; todos foram reescritos com GSAP e na paleta do projeto.

| Componente | Arquivo | O que mudou |
| --- | --- | --- |
| SplitText | `HeroSection.tsx`, `WhySection.tsx` | Usa o plugin SplitText do GSAP direto (`chars` no hero, `lines` com máscara no título da Seção 2) |
| CountUp | `components/CountUp.tsx` | `motion/useSpring` trocado por tween do GSAP com ScrollTrigger; formata em pt-BR; valor final já vem no HTML |
| Magnet | `components/Magnet.tsx` | Estado do React trocado por `gsap.quickTo`; só em ponteiro fino e com movimento liberado |
| Noise | `components/Noise.tsx` | Canvas animado trocado por SVG estático (`feTurbulence`), sem loop |
| AnimatedContent / FadeContent | entradas das seções | Substituídos por `gsap.from` com ScrollTrigger (`toggleActions`, uma vez) |
| GlassSurface | classe `.glass-surface` | Feito em CSS puro (`backdrop-filter`), sem o filtro SVG do original |
| ScrollStack / Stack | não usado | Os motivos da Seção 2 viraram uma lista com fios; `position: sticky` não funciona dentro do ScrollSmoother |

---

## 📄 Licença e Créditos

Desenvolvido para fins de extensão universitária e utilidade pública comunitária sob licença MIT. Imagens e vídeos sob licenças abertas com referências documentadas em `apps/web/public/images/CREDITS.md`.
