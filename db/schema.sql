-- Two tables. Safe to run many times: the build runs it on every deploy.

create table if not exists leads (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  form            jsonb not null,          -- the form exactly as the lead typed it
  status          text not null default 'researching',  -- researching | ready | failed | talked
  research_run_id text,                    -- eve session that built the briefing
  briefing        jsonb,
  voice_run_id    text,                    -- ElevenLabs conversation id
  conversation    jsonb,                   -- transcript, summary, SPICED, result
  error           text
);

create table if not exists events (
  id         bigserial primary key,
  created_at timestamptz not null default now(),
  lead_id    uuid references leads(id) on delete cascade,
  run_kind   text not null,                -- research | voice
  run_id     text not null,                -- eve session id or ElevenLabs conversation id
  tool       text not null,
  input      jsonb,
  output     jsonb,
  sources    text[] not null default '{}',
  ok         boolean not null,
  error      text,
  ms         integer not null
);

create index if not exists events_lead_idx on events (lead_id, created_at);
create index if not exists events_run_idx on events (run_id);
