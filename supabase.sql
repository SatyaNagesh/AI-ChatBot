-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/dnstcdkjgcmrhcukrjgw/sql/new)

-- OpenJarvis sessions
create table if not exists openjarvis_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  title text not null default 'New conversation',
  model text not null default ''
);

-- Messages within each session
create table if not exists openjarvis_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  session_id uuid not null references openjarvis_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  model text not null default ''
);

-- Key-value memories per session
create table if not exists openjarvis_memories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  session_id uuid not null references openjarvis_sessions(id) on delete cascade,
  key text not null,
  value text not null,
  context text default ''
);

-- Performance traces per message
create table if not exists openjarvis_traces (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  session_id uuid not null references openjarvis_sessions(id) on delete cascade,
  message_id uuid,
  model text not null default '',
  tokens_in int default 0,
  tokens_out int default 0,
  latency_ms int default 0,
  success boolean default true
);

-- Indexes for performance
create index if not exists idx_messages_session on openjarvis_messages(session_id);
create index if not exists idx_memories_session on openjarvis_memories(session_id);
create index if not exists idx_traces_session on openjarvis_traces(session_id);

-- Enable row-level security (optional — open for anon key)
alter table openjarvis_sessions enable row level security;
alter table openjarvis_messages enable row level security;
alter table openjarvis_memories enable row level security;
alter table openjarvis_traces enable row level security;

-- Allow anon access (since we're using anon key from client)
create policy "anon all sessions" on openjarvis_sessions for all using (true) with check (true);
create policy "anon all messages" on openjarvis_messages for all using (true) with check (true);
create policy "anon all memories" on openjarvis_memories for all using (true) with check (true);
create policy "anon all traces" on openjarvis_traces for all using (true) with check (true);

-- Global memories (shared across all sessions)
create table if not exists openjarvis_global_memories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  key text not null,
  value text not null,
  category text default 'general'
);

-- Prompt templates
create table if not exists openjarvis_templates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  prompt text not null,
  variables text[] default '{}',
  model text default ''
);

create index if not exists idx_global_memories_key on openjarvis_global_memories(key);

alter table openjarvis_global_memories enable row level security;
alter table openjarvis_templates enable row level security;

create policy "anon all global memories" on openjarvis_global_memories for all using (true) with check (true);
create policy "anon all templates" on openjarvis_templates for all using (true) with check (true);
