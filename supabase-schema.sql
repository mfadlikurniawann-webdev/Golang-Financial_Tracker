-- ============================================================
-- FINTRACK — Supabase SQL Schema
-- Jalankan di Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. CATEGORIES ────────────────────────────────────────────
create table if not exists categories (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  type       text not null check (type in ('income', 'expense')),
  icon       text default '📦',
  color      text default '#6b7280',
  created_at timestamptz default now()
);

-- RLS
alter table categories enable row level security;

create policy "Users manage own categories"
  on categories for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index
create index on categories(user_id);


-- ── 2. TRANSACTIONS ──────────────────────────────────────────
create table if not exists transactions (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  amount      numeric(15, 2) not null check (amount > 0),
  type        text not null check (type in ('income', 'expense')),
  description text,
  date        date not null default current_date,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- RLS
alter table transactions enable row level security;

create policy "Users manage own transactions"
  on transactions for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Indexes
create index on transactions(user_id, date desc);
create index on transactions(user_id, type);
create index on transactions(category_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger transactions_updated_at
  before update on transactions
  for each row execute procedure update_updated_at();


-- ── 3. BUDGETS ───────────────────────────────────────────────
create table if not exists budgets (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  category_id  uuid references categories(id) on delete cascade not null,
  limit_amount numeric(15, 2) not null check (limit_amount > 0),
  month        text not null,   -- format: 'YYYY-MM'
  created_at   timestamptz default now(),

  -- One budget per category per month per user
  unique (user_id, category_id, month)
);

-- RLS
alter table budgets enable row level security;

create policy "Users manage own budgets"
  on budgets for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index
create index on budgets(user_id, month);


-- ── 4. (OPTIONAL) ACCOUNTS ───────────────────────────────────
-- Untuk fitur multi-rekening (bisa ditambahkan nanti)
-- create table if not exists accounts (
--   id         uuid default gen_random_uuid() primary key,
--   user_id    uuid references auth.users(id) on delete cascade not null,
--   name       text not null,
--   type       text not null check (type in ('cash','bank','ewallet','investment')),
--   balance    numeric(15,2) default 0,
--   color      text default '#22c55e',
--   icon       text default '🏦',
--   created_at timestamptz default now()
-- );


-- ── 5. VERIFY ────────────────────────────────────────────────
-- Cek hasilnya:
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
