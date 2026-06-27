create table if not exists sessions (
  id text primary key,
  name text not null default 'New Session',
  preview text not null default '',
  unread integer not null default 0,
  agent text not null,
  created_at text not null default (datetime('now'))
);

create table if not exists messages (
  id integer primary key autoincrement,
  session_id text not null,
  role text not null,
  content text not null,
  created_at text not null default (datetime('now')),
  foreign key (session_id) references sessions(id) on delete cascade
);

create index if not exists idx_messages_session on messages(session_id, created_at);
