-- ============================================================================
--  CASA DAS ESTRELAS — 0004 — Pagamentos, webhooks, transacções e reembolsos
-- ============================================================================

create table if not exists payment_providers (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,                 -- mpesa | emola | mkesh | card
  name text not null,
  region text,
  is_active boolean not null default false, -- só true após homologação
  supports_refund boolean not null default false,
  config jsonb not null default '{}'::jsonb, -- NUNCA guardar segredos aqui
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payment_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,           -- ex.: CDE-2026-8F3K2A
  user_id uuid not null references users(id) on delete restrict,
  participant_id uuid not null references participants(id) on delete restrict,
  package_id uuid not null references vote_packages(id) on delete restrict,
  provider text not null,
  amount numeric(12,2) not null check (amount >= 0),
  currency char(3) not null default 'MZN',
  votes int not null check (votes > 0),
  status order_status not null default 'pendente',
  votes_consumed boolean not null default false,
  provider_order_id text,
  checkout_url text,
  expires_at timestamptz default (now() + interval '30 minutes'),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_user on payment_orders(user_id, created_at desc);
create index if not exists idx_orders_status on payment_orders(status, created_at desc);
create index if not exists idx_orders_reference_trgm on payment_orders using gin (reference gin_trgm_ops);
-- Evita ordens pendentes duplicadas para o mesmo pedido (idempotência de criação)
create unique index if not exists uq_orders_pending
  on payment_orders(user_id, package_id, participant_id)
  where status = 'pendente';

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references payment_orders(id) on delete restrict,
  user_id uuid not null references users(id) on delete restrict,
  provider text not null,
  provider_transaction_id text,
  amount numeric(12,2) not null,
  currency char(3) not null default 'MZN',
  status order_status not null default 'pendente',
  paid_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint payments_provider_tx_unique unique (provider, provider_transaction_id)
);
create index if not exists idx_payments_order on payments(order_id);
create index if not exists idx_payments_status on payments(status, created_at desc);

create table if not exists payment_webhooks (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  signature_valid boolean not null default false,
  payload jsonb not null,
  processed_at timestamptz,
  error text,
  received_at timestamptz not null default now(),
  -- idempotência: o mesmo evento nunca é processado duas vezes
  constraint webhook_event_unique unique (provider, event_id)
);
create index if not exists idx_webhooks_received on payment_webhooks(received_at desc);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references payment_orders(id) on delete restrict,
  payment_id uuid references payments(id) on delete restrict,
  type text not null check (type in ('credito', 'debito', 'reembolso', 'ajuste')),
  amount numeric(12,2) not null,
  currency char(3) not null default 'MZN',
  description text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_transactions_order on transactions(order_id, created_at desc);

create table if not exists refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references payment_orders(id) on delete restrict,
  payment_id uuid references payments(id),
  amount numeric(12,2) not null check (amount > 0),
  currency char(3) not null default 'MZN',
  reason text not null,
  status text not null default 'pedido' check (status in ('pedido','aprovado','recusado','processado')),
  requested_by uuid references users(id),
  approved_by uuid references users(id),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_refunds_order on refunds(order_id);

-- Pagamentos e transacções também são imutáveis (correcções = novos registos)
drop trigger if exists trg_payments_no_update on payments;
create trigger trg_payments_no_update before update or delete on payments
for each row execute function fn_block_mutation();

drop trigger if exists trg_transactions_no_mutation on transactions;
create trigger trg_transactions_no_mutation before update or delete on transactions
for each row execute function fn_block_mutation();

drop trigger if exists trg_orders_touch on payment_orders;
create trigger trg_orders_touch before update on payment_orders
for each row execute function fn_touch_updated_at();

-- ---------- Seed dos fornecedores (inactivos até homologação) ---------------
insert into payment_providers(key, name, region, is_active, supports_refund) values
  ('mpesa',  'M-Pesa',  'Moçambique', false, true),
  ('emola',  'e-Mola',  'Moçambique', false, true),
  ('mkesh',  'mKesh',   'Moçambique', false, false),
  ('card',   'Cartão (Visa / Mastercard)', 'Internacional', false, true)
on conflict (key) do nothing;
