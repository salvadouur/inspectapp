-- INSPECTAPP — schema inicial
-- Seguro de correr más de una vez: usa "if not exists" / "drop ... if exists" en
-- todos lados, así que si un intento anterior se cortó a mitad de camino, correr
-- este script de nuevo entero lo deja consistente sin que haga falta borrar nada a mano.

-- === PERFILES (rol de cada usuario) ===================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null check (role in ('inspector', 'referente')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: lectura autenticada" on public.profiles;
create policy "profiles: lectura autenticada" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles: solo puedo crear/editar el mío" on public.profiles;
create policy "profiles: solo puedo crear/editar el mío" on public.profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Crea automáticamente la fila de profiles cuando alguien se registra.
-- El rol y el nombre vienen del formulario de signup (ver auth metadata).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'inspector')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- === PERMISOS (una fila por tarea/inspección — el "Configuración de Obra"
--     + Momento 1 + Momento 2, todo junto) =============================
create table if not exists public.permisos (
  id uuid primary key default gen_random_uuid(),
  inspector_id uuid not null references public.profiles (id),

  -- Configuración de obra
  obra text not null default 'Medanito',
  tarea text not null default 'Excavación',
  tipo_permiso text check (tipo_permiso in ('Frío', 'Caliente')),
  es_espacio_confinado boolean not null default false,
  solicitante_contratista text not null default '',
  num_permiso text not null default '',
  num_cpt text not null default '',

  -- Sertronic (mock verde/rojo por recurso)
  sertronic_personal text not null default 'Verde' check (sertronic_personal in ('Verde', 'Rojo')),
  sertronic_vehiculos text not null default 'Verde' check (sertronic_vehiculos in ('Verde', 'Rojo')),
  sertronic_maquinaria text not null default 'Verde' check (sertronic_maquinaria in ('Verde', 'Rojo')),

  -- Gases
  gases jsonb not null default '{"lel": 0, "o2": 20.9, "co": 0, "h2s": 0}',
  gases_ultima_verificacion timestamptz,

  -- Momento 1: firmas
  cpt_checked boolean not null default false,
  firma_inspector_m1 boolean not null default false,
  m1_enviado_at timestamptz,
  m1_habilitado_por_referente_at timestamptz,

  -- Momento 2: equipamiento y zanja
  eq_nombre_deteccion text not null default '',
  eq_calibracion_vigente boolean not null default false,
  eq_acopio boolean not null default false,
  eq_clima boolean not null default false,
  cateo_360 boolean not null default false,
  eq_delimitacion boolean not null default false,
  prof_plan numeric not null default 1.0,
  entibado_aplica text check (entibado_aplica in ('Sí', 'No')),
  chk_vigia boolean not null default false,
  chk_escape boolean not null default false,
  chk_no_madera boolean not null default false,
  chk_entibado_instalado boolean not null default false,
  chk_vallas boolean not null default false,
  chk_arnes boolean not null default false,
  maquinaria_paralela boolean not null default false,
  omision_stop_mecanico_autorizada boolean not null default false,

  status text not null default 'en_progreso' check (status in ('en_progreso', 'autorizado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.permisos enable row level security;

drop policy if exists "permisos: lectura autenticada" on public.permisos;
create policy "permisos: lectura autenticada" on public.permisos
  for select to authenticated using (true);

drop policy if exists "permisos: el inspector dueño puede insertar/editar" on public.permisos;
create policy "permisos: el inspector dueño puede insertar/editar" on public.permisos
  for insert to authenticated with check (inspector_id = auth.uid());

drop policy if exists "permisos: inspector dueño o cualquier referente puede editar" on public.permisos;
create policy "permisos: inspector dueño o cualquier referente puede editar" on public.permisos
  for update to authenticated using (
    inspector_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'referente')
  );

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.permisos;
create trigger set_updated_at
  before update on public.permisos
  for each row execute procedure public.set_updated_at();

-- === EVIDENCIAS (fotos obligatorias de Momento 1) ======================
create table if not exists public.evidencias (
  id uuid primary key default gen_random_uuid(),
  permiso_id uuid not null references public.permisos (id) on delete cascade,
  tipo text not null check (tipo in ('charla', 'cpt', 'permiso_frente', 'permiso_dorso')),
  storage_path text not null,
  uploaded_at timestamptz not null default now(),
  unique (permiso_id, tipo)
);

alter table public.evidencias enable row level security;
drop policy if exists "evidencias: lectura/escritura autenticada" on public.evidencias;
create policy "evidencias: lectura/escritura autenticada" on public.evidencias
  for all to authenticated using (true) with check (true);

-- === INTERFERENCIAS (Momento 2, lista con botón +) =====================
create table if not exists public.interferencias (
  id uuid primary key default gen_random_uuid(),
  permiso_id uuid not null references public.permisos (id) on delete cascade,
  tipo text not null,
  profundidad numeric not null,
  created_at timestamptz not null default now()
);

alter table public.interferencias enable row level security;
drop policy if exists "interferencias: lectura/escritura autenticada" on public.interferencias;
create policy "interferencias: lectura/escritura autenticada" on public.interferencias
  for all to authenticated using (true) with check (true);

-- === TOKENS DE OMISIÓN AUTORIZADA =======================================
create table if not exists public.tokens_omision (
  id uuid primary key default gen_random_uuid(),
  permiso_id uuid not null references public.permisos (id) on delete cascade,
  token text not null,
  motivo text not null,
  generado_por uuid not null references public.profiles (id),
  generado_at timestamptz not null default now(),
  usado_at timestamptz,
  usado_por uuid references public.profiles (id)
);

alter table public.tokens_omision enable row level security;
drop policy if exists "tokens: lectura/escritura autenticada" on public.tokens_omision;
create policy "tokens: lectura/escritura autenticada" on public.tokens_omision
  for all to authenticated using (true) with check (true);

-- === NOTIFICACIONES (bandeja del Referente) =============================
create table if not exists public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  permiso_id uuid not null references public.permisos (id) on delete cascade,
  tipo text not null check (tipo in ('momento1', 'desvio', 'reporte')),
  mensaje text not null,
  created_at timestamptz not null default now(),
  leida boolean not null default false
);

alter table public.notificaciones enable row level security;
drop policy if exists "notificaciones: lectura/escritura autenticada" on public.notificaciones;
create policy "notificaciones: lectura/escritura autenticada" on public.notificaciones
  for all to authenticated using (true) with check (true);

-- === REALTIME: el Panel del Referente escucha estos cambios en vivo ====
-- alter publication ... add table falla si la tabla ya está agregada, así que se
-- envuelve en un bloque que ignora ese error puntual y sigue.
do $$
begin
  begin
    alter publication supabase_realtime add table public.permisos;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.notificaciones;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.tokens_omision;
  exception when duplicate_object then null;
  end;
end $$;

-- === STORAGE: bucket para las 4 fotos de evidencia ======================
insert into storage.buckets (id, name, public)
values ('evidencias', 'evidencias', false)
on conflict (id) do nothing;

drop policy if exists "evidencias storage: lectura/escritura autenticada" on storage.objects;
create policy "evidencias storage: lectura/escritura autenticada"
  on storage.objects for all to authenticated
  using (bucket_id = 'evidencias')
  with check (bucket_id = 'evidencias');
