-- ============================================================
-- Esquema de base de datos: App de finanzas del hogar
-- Ejecutar en el SQL Editor de Supabase (proyecto nuevo)
-- ============================================================

-- 1. HOGARES
-- Cada familia es un "hogar". Se entra con un código + PIN compartido.
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,      -- ej: "FAMILIA-MOLINA"
  pin text not null,                      -- PIN de 4-6 dígitos, compartido
  created_at timestamptz default now()
);

-- 2. MIEMBROS DEL HOGAR
-- Vincula un usuario de Supabase Auth (anónimo) a un hogar + a un perfil (persona)
create table household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  profile_name text not null,             -- "Papá", "Mamá", "Vos", "Hermano"
  avatar_initials text not null default '',
  created_at timestamptz default now()
);

-- 3. CATEGORÍAS
create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('ingreso', 'egreso')),
  color text not null default 'green',    -- referencia a paleta de la app
  icon text not null default 'ti-tag',    -- nombre de ícono tabler
  sort_order int default 0
);

-- 4. TRANSACCIONES
create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  profile_name text not null,             -- quién lo cargó
  category_id uuid references categories(id) not null,
  type text not null check (type in ('ingreso', 'egreso')),
  amount numeric(12,2) not null check (amount > 0),
  description text default '',
  payment_method text default 'efectivo', -- efectivo / tarjeta / transferencia
  status text not null default 'pagado' check (status in ('pagado', 'pendiente')),
  is_fixed boolean default false,
  occurred_on date not null default current_date,
  created_at timestamptz default now()
);

-- 5. GASTOS/INGRESOS FIJOS (plantillas recurrentes)
create table fixed_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade not null,
  category_id uuid references categories(id) not null,
  name text not null,
  type text not null check (type in ('ingreso', 'egreso')),
  estimated_amount numeric(12,2) not null,
  day_of_month int not null check (day_of_month between 1 and 28),
  active boolean default true
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Regla: un usuario solo puede leer/escribir datos de SU hogar
-- (el hogar al que quedó vinculado en household_members)
-- ============================================================

alter table households enable row level security;
alter table household_members enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table fixed_items enable row level security;

-- ============================================================
-- PERMISOS DE TABLA (GRANTS) para los roles de la Data API
-- Necesario cuando el proyecto se crea con "Automatically expose new
-- tables" DESACTIVADO: las políticas RLS por sí solas no alcanzan, el
-- rol también necesita el privilegio de tabla. Es seguro: RLS sigue
-- filtrando las filas. NO se otorga TRUNCATE (que evitaría RLS).
-- ============================================================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;

-- función helper: hogar del usuario logueado
create or replace function auth_household_id()
returns uuid
language sql stable
as $$
  select household_id from household_members where user_id = auth.uid() limit 1;
$$;

-- households: solo se puede leer el propio (no editar desde el cliente)
create policy "select own household" on households
  for select using (id = auth_household_id());

-- household_members: ver a los demás miembros de tu hogar
create policy "select household members" on household_members
  for select using (household_id = auth_household_id());

create policy "insert self as member" on household_members
  for insert with check (user_id = auth.uid());

-- categories
create policy "select own categories" on categories
  for select using (household_id = auth_household_id());
create policy "manage own categories" on categories
  for all using (household_id = auth_household_id());

-- transactions
create policy "select own transactions" on transactions
  for select using (household_id = auth_household_id());
create policy "manage own transactions" on transactions
  for all using (household_id = auth_household_id());

-- fixed_items
create policy "select own fixed items" on fixed_items
  for select using (household_id = auth_household_id());
create policy "manage own fixed items" on fixed_items
  for all using (household_id = auth_household_id());

-- ============================================================
-- Trigger: completa household_id automáticamente en cada insert
-- (el cliente nunca manda household_id a mano, se resuelve server-side
-- a partir del usuario autenticado -> más simple y más seguro)
-- ============================================================
create or replace function set_household_id()
returns trigger
language plpgsql
as $$
begin
  if new.household_id is null then
    new.household_id := auth_household_id();
  end if;
  return new;
end;
$$;

create trigger trg_transactions_household
  before insert on transactions
  for each row execute function set_household_id();

create trigger trg_categories_household
  before insert on categories
  for each row execute function set_household_id();

create trigger trg_fixed_items_household
  before insert on fixed_items
  for each row execute function set_household_id();

-- ============================================================
-- RPC: validar código + PIN y devolver el household_id
-- (se llama ANTES de vincular al usuario, así no exponemos el PIN real)
-- ============================================================
create or replace function join_household(p_code text, p_pin text)
returns uuid
language plpgsql security definer
as $$
declare
  h_id uuid;
begin
  select id into h_id from households
    where invite_code = p_code and pin = p_pin;
  if h_id is null then
    raise exception 'Código o PIN incorrecto';
  end if;
  return h_id;
end;
$$;

-- ============================================================
-- Automatización de fijos: crea las transacciones "pendientes" del
-- mes actual a partir de fixed_items activos (una vez por hogar/mes).
-- Programar como Cron Job en Supabase (Database > Cron Jobs) para
-- que corra el día 1 de cada mes, ej: select generate_fixed_transactions();
-- ============================================================
create or replace function generate_fixed_transactions()
returns void
language plpgsql security definer
as $$
begin
  insert into transactions (household_id, profile_name, category_id, type, amount, description, status, is_fixed, occurred_on)
  select
    f.household_id,
    'Automático',
    f.category_id,
    f.type,
    f.estimated_amount,
    f.name,
    'pendiente',
    true,
    make_date(extract(year from current_date)::int, extract(month from current_date)::int, f.day_of_month)
  from fixed_items f
  where f.active = true
    and not exists (
      select 1 from transactions t
      where t.is_fixed = true
        and t.household_id = f.household_id
        and t.category_id = f.category_id
        and date_trunc('month', t.occurred_on) = date_trunc('month', current_date)
    );
end;
$$;

-- ============================================================
-- Categorías por defecto sugeridas (ejecutar reemplazando el uuid del hogar)
-- ============================================================
-- insert into categories (household_id, name, type, color, icon) values
--   ('<household_id>', 'Sueldo', 'ingreso', 'green', 'ti-briefcase'),
--   ('<household_id>', 'Otros ingresos', 'ingreso', 'teal', 'ti-cash'),
--   ('<household_id>', 'Vivienda', 'egreso', 'blue', 'ti-home'),
--   ('<household_id>', 'Empleada doméstica', 'egreso', 'purple', 'ti-users'),
--   ('<household_id>', 'Alimentación', 'egreso', 'green', 'ti-shopping-cart'),
--   ('<household_id>', 'Salud', 'egreso', 'pink', 'ti-first-aid-kit'),
--   ('<household_id>', 'Educación', 'egreso', 'teal', 'ti-school'),
--   ('<household_id>', 'Transporte', 'egreso', 'amber', 'ti-car'),
--   ('<household_id>', 'Comunicación', 'egreso', 'gray', 'ti-phone'),
--   ('<household_id>', 'Impuestos/Monotributo', 'egreso', 'coral', 'ti-receipt'),
--   ('<household_id>', 'Ocio/Recreación', 'egreso', 'coral', 'ti-ticket'),
--   ('<household_id>', 'Ropa', 'egreso', 'pink', 'ti-shirt'),
--   ('<household_id>', 'Mascota', 'egreso', 'amber', 'ti-paw'),
--   ('<household_id>', 'Varios/Imprevistos', 'egreso', 'gray', 'ti-dots');
