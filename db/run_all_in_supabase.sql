--==========================================
-- Run this entire script in Supabase SQL Editor (one go)
-- Project: https://citoiconzejdfjjefnbi.supabase.co
-- Order: 01 → 03 → 04 → 05 → 06
--==========================================

-- ========== 01_schema_fixes.sql ==========
drop table if exists team_members cascade;

create table team_members (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users,
  name text not null,
  email text,
  department text,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

alter table team_members enable row level security;

alter table profiles add column if not exists created_at timestamp with time zone default now();

alter table bookings add column if not exists who_ordered text;
alter table bookings add column if not exists purpose text;

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'bookings_vehicle_id_fkey') then
    alter table bookings drop constraint bookings_vehicle_id_fkey;
  end if;
end $$;

alter table bookings
  add constraint bookings_vehicle_id_fkey
  foreign key (vehicle_id)
  references vehicles(id)
  on delete cascade;

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'activities_vehicle_id_fkey') then
    alter table activities drop constraint activities_vehicle_id_fkey;
  end if;
end $$;

alter table activities
  add constraint activities_vehicle_id_fkey
  foreign key (vehicle_id)
  references vehicles(id)
  on delete cascade;

create index if not exists idx_bookings_vehicle_id on bookings(vehicle_id);
create index if not exists idx_bookings_user_id on bookings(user_id);
create index if not exists idx_bookings_start_time on bookings(start_time);
create index if not exists idx_bookings_end_time on bookings(end_time);
create index if not exists idx_activities_vehicle_id on activities(vehicle_id);
create index if not exists idx_activities_user_id on activities(user_id);
create index if not exists idx_activities_created_at on activities(created_at desc);
create index if not exists idx_team_members_user_id on team_members(user_id);
create index if not exists idx_team_members_is_active on team_members(is_active) where is_active = true;
create index if not exists idx_profiles_email on profiles(email);
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_vehicles_status on vehicles(status);
create index if not exists idx_vehicles_type on vehicles(type);

-- ========== 03_bookings_columns.sql ==========
alter table bookings add column if not exists duration text;
alter table bookings add column if not exists notes text;
alter table bookings add column if not exists project_name text;
alter table bookings add column if not exists status text;

-- ========== 04_bookings_prd_snapshot.sql ==========
alter table bookings add column if not exists risk_level text;
alter table bookings add column if not exists location text;
alter table bookings add column if not exists snapshotted_hw_config jsonb;

create or replace function public.set_booking_snapshot_hw_config()
returns trigger as $$
declare
  v_hw text;
begin
  select coalesce(vehicles.hw_config::text, '') into v_hw from public.vehicles where id = new.vehicle_id;
  new.snapshotted_hw_config := jsonb_build_object('raw', v_hw);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_set_booking_snapshot on bookings;
create trigger trigger_set_booking_snapshot
  before insert on bookings
  for each row execute procedure public.set_booking_snapshot_hw_config();

-- ========== 05_department_and_jsonb.sql ==========
alter table profiles add column if not exists department text default 'R&D';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_department_check') then
    alter table profiles add constraint profiles_department_check check (department in ('R&D', 'Training', 'Marketing'));
  end if;
end $$;

alter table vehicles add column if not exists department text default 'R&D';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'vehicles_department_check') then
    alter table vehicles add constraint vehicles_department_check check (department in ('R&D', 'Training', 'Marketing'));
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'vehicles' and column_name = 'hw_config' and data_type = 'text'
  ) then
    alter table vehicles
      alter column hw_config type jsonb
      using case
        when hw_config is null or trim(hw_config) = '' then '{}'::jsonb
        when hw_config::text ~ '^\s*\{' then hw_config::jsonb
        else jsonb_build_object('raw', hw_config)
      end;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'vehicles' and column_name = 'hw_config'
  ) then
    alter table vehicles add column hw_config jsonb default '{}'::jsonb;
  end if;
end $$;

create index if not exists idx_profiles_department on profiles(department);
create index if not exists idx_vehicles_department on vehicles(department);

-- ========== 06_department_rls.sql ==========
-- Drop OLD policy names (legacy)
drop policy if exists "Vehicles are viewable by authorized users" on vehicles;
drop policy if exists "Users can insert vehicles" on vehicles;
drop policy if exists "Users can update vehicles" on vehicles;
drop policy if exists "Users can delete vehicles" on vehicles;

drop policy if exists "Bookings are viewable by authorized users" on bookings;
drop policy if exists "Users can insert bookings" on bookings;
drop policy if exists "Users can update bookings" on bookings;
drop policy if exists "Users can delete bookings" on bookings;

-- Drop NEW policy names so script is idempotent (safe to re-run)
drop policy if exists "vehicles_select_by_department" on vehicles;
drop policy if exists "vehicles_insert_by_role" on vehicles;
drop policy if exists "vehicles_update_by_role" on vehicles;
drop policy if exists "vehicles_delete_by_admin" on vehicles;
drop policy if exists "bookings_select_by_department" on bookings;
drop policy if exists "bookings_insert_by_role" on bookings;
drop policy if exists "bookings_update_by_owner_or_admin" on bookings;
drop policy if exists "bookings_delete_by_owner_or_admin" on bookings;

alter table vehicles enable row level security;
alter table bookings enable row level security;

create policy "vehicles_select_by_department"
  on vehicles for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and (
        profiles.role = 'admin'
        or (profiles.department in ('R&D', 'Training') and vehicles.department in ('R&D', 'Training'))
        or (profiles.department = 'Marketing' and vehicles.department = 'Marketing')
      )
    )
  );

create policy "vehicles_insert_by_role"
  on vehicles for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('editor', 'admin')
    )
  );

create policy "vehicles_update_by_role"
  on vehicles for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('editor', 'admin')
      and (
        profiles.role = 'admin'
        or (profiles.department in ('R&D', 'Training') and vehicles.department in ('R&D', 'Training'))
        or (profiles.department = 'Marketing' and vehicles.department = 'Marketing')
      )
    )
  );

create policy "vehicles_delete_by_admin"
  on vehicles for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "bookings_select_by_department"
  on bookings for select
  using (
    exists (
      select 1 from profiles
      join vehicles on bookings.vehicle_id = vehicles.id
      where profiles.id = auth.uid()
      and (
        profiles.role = 'admin'
        or (profiles.department in ('R&D', 'Training') and vehicles.department in ('R&D', 'Training'))
        or (profiles.department = 'Marketing' and vehicles.department = 'Marketing')
      )
    )
  );

create policy "bookings_insert_by_role"
  on bookings for insert
  with check (
    exists (
      select 1 from profiles
      join vehicles on bookings.vehicle_id = vehicles.id
      where profiles.id = auth.uid()
      and profiles.role in ('editor', 'admin')
      and (
        profiles.role = 'admin'
        or (profiles.department in ('R&D', 'Training') and vehicles.department in ('R&D', 'Training'))
        or (profiles.department = 'Marketing' and vehicles.department = 'Marketing')
      )
    )
  );

create policy "bookings_update_by_owner_or_admin"
  on bookings for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and (
        profiles.role = 'admin'
        or (bookings.user_id = auth.uid() and profiles.role in ('editor', 'admin'))
      )
    )
  );

create policy "bookings_delete_by_owner_or_admin"
  on bookings for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and (
        profiles.role = 'admin'
        or (bookings.user_id = auth.uid() and profiles.role in ('editor', 'admin'))
      )
    )
  );

-- ========== Done ==========
select 'All migrations (01–06) completed successfully.' as status;
