-- Descarta: esquema inicial.
-- O Supabase é usado apenas como Postgres. Nenhuma imagem, usuário ou conversa é guardado.
-- RLS fica ativado em todas as tabelas, sem nenhuma policy: as roles anon e
-- authenticated não leem nem escrevem nada. Só a conexão direta do Render
-- (role postgres, via pooler) acessa os dados.

-- Configurações em formato chave/valor (IA, chaves criptografadas e outras).
create table if not exists public.config (
  chave          text primary key,
  valor          text not null,
  criptografado  boolean not null default false,
  atualizado_em  timestamptz not null default now()
);

-- Biblioteca de vídeos por material, cadastrada no painel.
create table if not exists public.videos (
  id        uuid primary key default gen_random_uuid(),
  material  text not null,
  titulo    text not null,
  url       text not null,
  idioma    text not null default 'pt-BR',
  ativo     boolean not null default true
);

create index if not exists videos_material_ativo_idx
  on public.videos (material)
  where ativo;

-- Contadores agregados: quantas análises por material por dia. Nada mais.
create table if not exists public.metricas_diarias (
  data      date not null,
  material  text not null,
  total     integer not null default 0 check (total >= 0),
  primary key (data, material)
);

alter table public.config            enable row level security;
alter table public.videos            enable row level security;
alter table public.metricas_diarias  enable row level security;

-- Garantia extra: tira qualquer privilégio que o Supabase concede por padrão
-- às roles expostas pela API REST.
revoke all on table public.config, public.videos, public.metricas_diarias from anon, authenticated;
