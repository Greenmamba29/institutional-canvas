-- =========================================
-- ElevenLabs Multi-Agent Architecture for TeleBuy
-- Supports dual agents (buyer + supplier) with multi-language support
-- =========================================

-- -----------------------------
-- Enums for Agent System
-- -----------------------------

do $$ begin
  create type public.agent_role as enum ('buyer', 'supplier', 'neutral');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.agent_language as enum ('en', 'es', 'pt', 'zh', 'ja', 'ko', 'de', 'fr', 'it');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.agent_session_status as enum ('initializing', 'active', 'paused', 'ended', 'error');
exception when duplicate_object then null; end $$;

-- -----------------------------
-- Lithium Knowledge Base Table
-- -----------------------------

create table if not exists public.lithium_knowledge_base (
  id uuid primary key default gen_random_uuid(),
  category text not null, -- 'pricing', 'specification', 'market_intelligence', 'compliance', 'supplier_info'
  subcategory text,
  title text not null,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  language text default 'en',
  tags text[],
  source text, -- URL or reference source
  valid_from timestamp with time zone default now(),
  valid_until timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  created_by uuid references auth.users(id),
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) stored
);

-- Indexes for knowledge base
create index if not exists idx_lithium_kb_category on public.lithium_knowledge_base(category);
create index if not exists idx_lithium_kb_language on public.lithium_knowledge_base(language);
create index if not exists idx_lithium_kb_tags on public.lithium_knowledge_base using gin(tags);
create index if not exists idx_lithium_kb_search on public.lithium_knowledge_base using gin(search_vector);
create index if not exists idx_lithium_kb_valid_dates on public.lithium_knowledge_base(valid_from, valid_until);

-- -----------------------------
-- TeleBuy Agent Sessions Table
-- -----------------------------

create table if not exists public.telebuy_agent_sessions (
  id uuid primary key default gen_random_uuid(),
  telebuy_session_id uuid not null references public.telebuy_sessions(id) on delete cascade,

  -- Agent configuration
  agent_role public.agent_role not null,
  agent_id text not null, -- ElevenLabs agent ID
  language public.agent_language default 'en',

  -- User/Organization association
  user_id uuid references auth.users(id),
  org_id uuid references public.organizations(id),

  -- Session metadata
  status public.agent_session_status default 'initializing',
  elevenlabs_conversation_id text, -- ElevenLabs conversation/session ID

  -- Session timing
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  duration_seconds integer,

  -- Conversation metrics
  message_count integer default 0,
  language_detected text,
  languages_used text[],

  -- Agent performance
  avg_response_time_ms integer,
  sentiment_score numeric(3,2), -- -1.0 to 1.0

  -- Context and state
  context jsonb default '{}'::jsonb, -- Session-specific context
  state jsonb default '{}'::jsonb, -- Agent state for persistence

  -- Metadata
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  -- Ensure one agent per role per TeleBuy session
  unique(telebuy_session_id, agent_role)
);

-- Indexes for agent sessions
create index if not exists idx_telebuy_agent_sessions_telebuy_id on public.telebuy_agent_sessions(telebuy_session_id);
create index if not exists idx_telebuy_agent_sessions_user_id on public.telebuy_agent_sessions(user_id);
create index if not exists idx_telebuy_agent_sessions_org_id on public.telebuy_agent_sessions(org_id);
create index if not exists idx_telebuy_agent_sessions_status on public.telebuy_agent_sessions(status);

-- -----------------------------
-- TeleBuy Agent Messages Table
-- -----------------------------

create table if not exists public.telebuy_agent_messages (
  id uuid primary key default gen_random_uuid(),
  agent_session_id uuid not null references public.telebuy_agent_sessions(id) on delete cascade,

  -- Message details
  message_type text not null, -- 'user_speech', 'agent_response', 'system_event'
  speaker_role text not null, -- 'user', 'agent', 'system'
  content text not null,
  language text,

  -- Timing
  timestamp timestamp with time zone default now(),
  response_time_ms integer,

  -- Audio/transcript metadata
  audio_url text,
  audio_duration_ms integer,
  confidence_score numeric(3,2), -- Speech recognition confidence

  -- Sentiment and analysis
  sentiment text, -- 'positive', 'neutral', 'negative'
  intent text, -- Detected user intent
  entities jsonb, -- Extracted entities (products, prices, dates, etc.)

  -- Context
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Indexes for agent messages
create index if not exists idx_telebuy_agent_messages_session on public.telebuy_agent_messages(agent_session_id);
create index if not exists idx_telebuy_agent_messages_timestamp on public.telebuy_agent_messages(timestamp desc);
create index if not exists idx_telebuy_agent_messages_type on public.telebuy_agent_messages(message_type);

-- -----------------------------
-- Agent Configuration Table
-- -----------------------------

create table if not exists public.elevenlabs_agent_configs (
  id uuid primary key default gen_random_uuid(),

  -- Agent identity
  agent_name text not null unique,
  agent_role public.agent_role not null,
  elevenlabs_agent_id text not null,

  -- Language support
  primary_language public.agent_language default 'en',
  supported_languages public.agent_language[],

  -- Configuration
  prompt_template text not null,
  voice_id text not null,
  model_id text default 'eleven_turbo_v2_5',

  -- Voice settings
  stability numeric(3,2) default 0.75,
  similarity_boost numeric(3,2) default 0.85,
  optimize_streaming_latency integer default 3,

  -- Features
  enable_language_detection boolean default true,
  enable_knowledge_base boolean default true,
  knowledge_base_categories text[],

  -- Status
  is_active boolean default true,
  version integer default 1,

  -- Metadata
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  created_by uuid references auth.users(id)
);

-- Index for agent configs
create index if not exists idx_elevenlabs_agent_configs_role on public.elevenlabs_agent_configs(agent_role);
create index if not exists idx_elevenlabs_agent_configs_active on public.elevenlabs_agent_configs(is_active);

-- -----------------------------
-- Update TeleBuy Sessions Table
-- -----------------------------

-- Add agent-related columns to existing telebuy_sessions
alter table public.telebuy_sessions
  add column if not exists buyer_agent_session_id uuid references public.telebuy_agent_sessions(id),
  add column if not exists supplier_agent_session_id uuid references public.telebuy_agent_sessions(id),
  add column if not exists agents_enabled boolean default false,
  add column if not exists primary_language text default 'en';

-- -----------------------------
-- Row Level Security (RLS)
-- -----------------------------

alter table public.lithium_knowledge_base enable row level security;
alter table public.telebuy_agent_sessions enable row level security;
alter table public.telebuy_agent_messages enable row level security;
alter table public.elevenlabs_agent_configs enable row level security;

-- Knowledge base: readable by authenticated users
create policy "kb_select_authenticated" on public.lithium_knowledge_base
  for select using (auth.role() = 'authenticated');

-- Knowledge base: writable by admins only (can add policy later)
create policy "kb_insert_admin" on public.lithium_knowledge_base
  for insert with check (
    exists (
      select 1 from public.org_members m
      where m.user_id = auth.uid() and m.role in ('admin', 'owner')
    )
  );

-- Agent sessions: users can view their own sessions
create policy "agent_sessions_select_own" on public.telebuy_agent_sessions
  for select using (
    user_id = auth.uid()
    or public.is_org_member(org_id)
    or exists (
      select 1 from public.telebuy_sessions ts
      where ts.id = telebuy_session_id
      and (ts.user_id = auth.uid() or public.is_org_member(ts.org_id))
    )
  );

-- Agent sessions: users can create their own sessions
create policy "agent_sessions_insert_own" on public.telebuy_agent_sessions
  for insert with check (
    user_id = auth.uid() or public.is_org_member(org_id)
  );

-- Agent sessions: users can update their own sessions
create policy "agent_sessions_update_own" on public.telebuy_agent_sessions
  for update using (
    user_id = auth.uid() or public.is_org_member(org_id)
  );

-- Agent messages: users can view messages from their sessions
create policy "agent_messages_select_own" on public.telebuy_agent_messages
  for select using (
    exists (
      select 1 from public.telebuy_agent_sessions ags
      where ags.id = agent_session_id
      and (ags.user_id = auth.uid() or public.is_org_member(ags.org_id))
    )
  );

-- Agent messages: system can insert messages
create policy "agent_messages_insert_system" on public.telebuy_agent_messages
  for insert with check (
    exists (
      select 1 from public.telebuy_agent_sessions ags
      where ags.id = agent_session_id
      and (ags.user_id = auth.uid() or public.is_org_member(ags.org_id))
    )
  );

-- Agent configs: readable by authenticated users
create policy "agent_configs_select_authenticated" on public.elevenlabs_agent_configs
  for select using (is_active = true and auth.role() = 'authenticated');

-- Agent configs: writable by admins only
create policy "agent_configs_manage_admin" on public.elevenlabs_agent_configs
  for all using (
    exists (
      select 1 from public.org_members m
      where m.user_id = auth.uid() and m.role in ('admin', 'owner')
    )
  );

-- -----------------------------
-- Triggers for updated_at
-- -----------------------------

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_lithium_kb on public.lithium_knowledge_base;
create trigger set_updated_at_lithium_kb
  before update on public.lithium_knowledge_base
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_agent_sessions on public.telebuy_agent_sessions;
create trigger set_updated_at_agent_sessions
  before update on public.telebuy_agent_sessions
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_agent_configs on public.elevenlabs_agent_configs;
create trigger set_updated_at_agent_configs
  before update on public.elevenlabs_agent_configs
  for each row execute function public.set_updated_at();

-- -----------------------------
-- Helper Functions
-- -----------------------------

-- Get active agent configuration by role and language
create or replace function public.get_agent_config(
  p_role public.agent_role,
  p_language public.agent_language default 'en'
)
returns table (
  id uuid,
  agent_name text,
  elevenlabs_agent_id text,
  prompt_template text,
  voice_id text,
  model_id text
) as $$
begin
  return query
  select
    c.id,
    c.agent_name,
    c.elevenlabs_agent_id,
    c.prompt_template,
    c.voice_id,
    c.model_id
  from public.elevenlabs_agent_configs c
  where c.agent_role = p_role
    and c.is_active = true
    and (
      c.primary_language = p_language
      or p_language = any(c.supported_languages)
      or p_language = 'en' -- fallback to English
    )
  order by
    case when c.primary_language = p_language then 1 else 2 end,
    c.version desc
  limit 1;
end;
$$ language plpgsql security definer;

-- Search knowledge base
create or replace function public.search_knowledge_base(
  p_query text,
  p_categories text[] default null,
  p_language text default 'en',
  p_limit integer default 10
)
returns table (
  id uuid,
  title text,
  content text,
  category text,
  relevance real
) as $$
begin
  return query
  select
    kb.id,
    kb.title,
    kb.content,
    kb.category,
    ts_rank(kb.search_vector, websearch_to_tsquery('english', p_query)) as relevance
  from public.lithium_knowledge_base kb
  where
    kb.search_vector @@ websearch_to_tsquery('english', p_query)
    and (p_categories is null or kb.category = any(p_categories))
    and kb.language = p_language
    and (kb.valid_until is null or kb.valid_until > now())
  order by relevance desc
  limit p_limit;
end;
$$ language plpgsql security definer;

-- -----------------------------
-- Comments for Documentation
-- -----------------------------

comment on table public.lithium_knowledge_base is 'Knowledge base for lithium market intelligence, specifications, pricing, and compliance information';
comment on table public.telebuy_agent_sessions is 'Tracks individual agent sessions within TeleBuy video calls - one per participant role';
comment on table public.telebuy_agent_messages is 'Stores conversation history and transcripts from agent sessions';
comment on table public.elevenlabs_agent_configs is 'Configuration for different agent personas (buyer, supplier, neutral) across languages';
