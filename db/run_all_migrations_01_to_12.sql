--==========================================
-- UAV Fleet Dashboard: Run all migrations in one go (01 → 12)
-- Copy this entire file into Supabase SQL Editor, paste, then click Run.
-- Use on: Staging / Production (backup first recommended)
-- Order: 01 → 02 → 03 → 04 → 05 → 06 → 07 → 09 → 10 → 11 → 12 (08 skipped)
--==========================================


-- ========== 01_schema_fixes.sql ==========
-- UAV Fleet Dashboard - Complete Schema Fix
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

select '01_schema_fixes completed.' as status;


-- ========== 02_enhanced_rls.sql ==========
-- Enhanced RLS (activities, profiles, team_members; vehicles/bookings will be replaced by 06)
drop policy if exists "Vehicles are viewable by everyone." on vehicles;
drop policy if exists "Editors can insert vehicles." on vehicles;
drop policy if exists "Editors can update vehicles." on vehicles;
drop policy if exists "Admins can delete vehicles." on vehicles;
drop policy if exists "Authenticated users can view vehicles." on vehicles;

drop policy if exists "Bookings are viewable by everyone." on bookings;
drop policy if exists "Editors can create bookings." on bookings;
drop policy if exists "Editors can update bookings." on bookings;
drop policy if exists "Editors can delete bookings." on bookings;
drop policy if exists "Authenticated users can view bookings." on bookings;

drop policy if exists "Activities are viewable by everyone." on activities;
drop policy if exists "Authenticated users can insert activities." on activities;
drop policy if exists "Authenticated users can view activities." on activities;

drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;
drop policy if exists "Admins can update any profile." on profiles;
drop policy if exists "Authenticated users can view profiles." on profiles;

drop policy if exists "Authenticated users can view team members." on team_members;
drop policy if exists "Editors can insert team members." on team_members;
drop policy if exists "Editors can update team members." on team_members;
drop policy if exists "Admins can delete team members." on team_members;

create policy "Authenticated users can view vehicles." on vehicles
  for select using (auth.role() = 'authenticated');
create policy "Editors can insert vehicles." on vehicles
  for insert with check (exists (select 1 from profiles where id = auth.uid() and role in ('editor', 'admin')));
create policy "Editors can update vehicles." on vehicles
  for update using (exists (select 1 from profiles where id = auth.uid() and role in ('editor', 'admin')));
create policy "Admins can delete vehicles." on vehicles
  for delete using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Authenticated users can view bookings." on bookings
  for select using (auth.role() = 'authenticated');
create policy "Editors can create bookings." on bookings
  for insert with check (exists (select 1 from profiles where id = auth.uid() and role in ('editor', 'admin')));
create policy "Editors can update bookings." on bookings
  for update using (exists (select 1 from profiles where id = auth.uid() and role in ('editor', 'admin')));
create policy "Editors can delete bookings." on bookings
  for delete using (exists (select 1 from profiles where id = auth.uid() and role in ('editor', 'admin')));

create policy "Authenticated users can view activities." on activities
  for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert activities." on activities
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can view profiles." on profiles
  for select using (auth.role() = 'authenticated');
create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);
create policy "Admins can update any profile." on profiles
  for update using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Authenticated users can view team members." on team_members
  for select using (auth.role() = 'authenticated');
create policy "Editors can insert team members." on team_members
  for insert with check (exists (select 1 from profiles where id = auth.uid() and role in ('editor', 'admin')));
create policy "Editors can update team members." on team_members
  for update using (exists (select 1 from profiles where id = auth.uid() and role in ('editor', 'admin')));
create policy "Admins can delete team members." on team_members
  for delete using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

select '02_enhanced_rls completed.' as status;


-- ========== 03_bookings_columns.sql ==========
alter table bookings add column if not exists duration text;
alter table bookings add column if not exists notes text;
alter table bookings add column if not exists project_name text;
alter table bookings add column if not exists status text;

select '03_bookings_columns completed.' as status;


-- ========== 04_bookings_prd_snapshot.sql ==========
alter table bookings add column if not exists risk_level text;
alter table bookings add column if not exists location text;
alter table bookings add column if not exists snapshotted_hw_config jsonb;

create or replace function public.set_booking_snapshot_hw_config()
returns trigger as $$
declare
  v_hw text;
begin
  select hw_config::text into v_hw from public.vehicles where id = new.vehicle_id;
  new.snapshotted_hw_config := jsonb_build_object('raw', coalesce(v_hw, ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_set_booking_snapshot on bookings;
create trigger trigger_set_booking_snapshot
  before insert on bookings
  for each row execute procedure public.set_booking_snapshot_hw_config();

select '04_bookings_prd_snapshot completed.' as status;


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
  if exists (select 1 from information_schema.columns where table_name = 'vehicles' and column_name = 'hw_config' and data_type = 'text') then
    update vehicles set hw_config = jsonb_build_object('raw', coalesce(hw_config, ''))::text where hw_config is not null and hw_config != '';
    alter table vehicles
      alter column hw_config type jsonb
      using case when hw_config is null or hw_config = '' then '{}'::jsonb else hw_config::jsonb end;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'vehicles' and column_name = 'hw_config') then
    alter table vehicles add column hw_config jsonb default '{}'::jsonb;
  end if;
end $$;

create index if not exists idx_profiles_department on profiles(department);
create index if not exists idx_vehicles_department on vehicles(department);

select '05_department_and_jsonb completed.' as status;


-- ========== 06_department_rls.sql ==========
-- Drop 02's vehicle/booking policies first, then create department-based RLS
drop policy if exists "Authenticated users can view vehicles." on vehicles;
drop policy if exists "Editors can insert vehicles." on vehicles;
drop policy if exists "Editors can update vehicles." on vehicles;
drop policy if exists "Admins can delete vehicles." on vehicles;
drop policy if exists "Authenticated users can view bookings." on bookings;
drop policy if exists "Editors can create bookings." on bookings;
drop policy if exists "Editors can update bookings." on bookings;
drop policy if exists "Editors can delete bookings." on bookings;

drop policy if exists "Vehicles are viewable by authorized users" on vehicles;
drop policy if exists "Users can insert vehicles" on vehicles;
drop policy if exists "Users can update vehicles" on vehicles;
drop policy if exists "Users can delete vehicles" on vehicles;
drop policy if exists "Bookings are viewable by authorized users" on bookings;
drop policy if exists "Users can insert bookings" on bookings;
drop policy if exists "Users can update bookings" on bookings;
drop policy if exists "Users can delete bookings" on bookings;

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

create policy "vehicles_select_by_department" on vehicles for select
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

create policy "vehicles_insert_by_role" on vehicles for insert
  with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('editor', 'admin'))
  );

create policy "vehicles_update_by_role" on vehicles for update
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

create policy "vehicles_delete_by_admin" on vehicles for delete
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "bookings_select_by_department" on bookings for select
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

create policy "bookings_insert_by_role" on bookings for insert
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

create policy "bookings_update_by_owner_or_admin" on bookings for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and (profiles.role = 'admin' or (bookings.user_id = auth.uid() and profiles.role in ('editor', 'admin')))
    )
  );

create policy "bookings_delete_by_owner_or_admin" on bookings for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and (profiles.role = 'admin' or (bookings.user_id = auth.uid() and profiles.role in ('editor', 'admin')))
    )
  );

select '06_department_rls completed.' as status;


-- ========== 07_profiles_display_name.sql ==========
alter table profiles add column if not exists display_name text;

select '07_profiles_display_name completed.' as status;


-- ========== 09_remove_vehicles_risk_level.sql ==========
ALTER TABLE vehicles DROP COLUMN IF EXISTS risk_level;

select '09_remove_vehicles_risk_level completed.' as status;


-- ========== 10_add_soft_delete.sql ==========
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

DROP POLICY IF EXISTS "Vehicles are viewable by everyone." ON vehicles;
DROP POLICY IF EXISTS "vehicles_select_by_department" ON vehicles;

CREATE POLICY "vehicles_select_by_department" ON vehicles
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR (profiles.department IN ('R&D', 'Training') AND vehicles.department IN ('R&D', 'Training'))
        OR (profiles.department = 'Marketing' AND vehicles.department = 'Marketing')
      )
    )
  );

DROP POLICY IF EXISTS "Bookings are viewable by everyone." ON bookings;
DROP POLICY IF EXISTS "bookings_select_by_department" ON bookings;

CREATE POLICY "bookings_select_by_department" ON bookings
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM profiles
      JOIN vehicles ON bookings.vehicle_id = vehicles.id
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR (profiles.department IN ('R&D', 'Training') AND vehicles.department IN ('R&D', 'Training'))
        OR (profiles.department = 'Marketing' AND vehicles.department = 'Marketing')
      )
    )
  );

select '10_add_soft_delete completed.' as status;


-- ========== 11_create_change_logs.sql ==========
CREATE TABLE IF NOT EXISTS change_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  user_display_name text,
  entity_type text NOT NULL CHECK (entity_type IN ('vehicle', 'booking', 'profile')),
  entity_id uuid NOT NULL,
  entity_name text,
  action_type text NOT NULL CHECK (action_type IN ('create', 'update', 'delete')),
  before_snapshot jsonb,
  after_snapshot jsonb,
  changed_fields jsonb,
  notes text,
  ip_address text
);

CREATE INDEX IF NOT EXISTS idx_change_logs_entity ON change_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_change_logs_user ON change_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_change_logs_created ON change_logs(created_at DESC);

ALTER TABLE change_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Change logs are viewable by editors and admins" ON change_logs;
DROP POLICY IF EXISTS "Authenticated users can insert change logs" ON change_logs;

CREATE POLICY "Change logs are viewable by editors and admins" ON change_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('editor', 'admin'))
  );

CREATE POLICY "Authenticated users can insert change logs" ON change_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

select '11_create_change_logs completed.' as status;


-- ========== 12_migrate_hw_config.sql ==========
UPDATE vehicles
SET hw_config = jsonb_build_object(
  'legacy_text', COALESCE(hw_config->>'raw', ''),
  'radio', jsonb_build_object(
    'h30', jsonb_build_object('enabled', false),
    'silvus', jsonb_build_object('enabled', false),
    'radioNor', jsonb_build_object('enabled', false),
    'custom', jsonb_build_object('enabled', false, 'value', '')
  ),
  'frequencyBand', jsonb_build_object('s', false, 'c', false, 'l', false, 'custom', ''),
  'visualNavigation', jsonb_build_object('yes', false, 'no', false, 'boson', false),
  'gps', jsonb_build_object(
    'holyBro', jsonb_build_object('enabled', false),
    'hardenGps', jsonb_build_object('enabled', false),
    'arcXL', jsonb_build_object('enabled', false),
    'custom', jsonb_build_object('enabled', false, 'value', '')
  )
)
WHERE hw_config IS NOT NULL
  AND (hw_config ? 'raw' OR hw_config = '{}'::jsonb OR jsonb_typeof(hw_config) != 'object')
  AND NOT (hw_config ? 'radio' AND hw_config ? 'frequencyBand');

UPDATE vehicles
SET hw_config = jsonb_build_object(
  'radio', jsonb_build_object(
    'h30', jsonb_build_object('enabled', false),
    'silvus', jsonb_build_object('enabled', false),
    'radioNor', jsonb_build_object('enabled', false),
    'custom', jsonb_build_object('enabled', false, 'value', '')
  ),
  'frequencyBand', jsonb_build_object('s', false, 'c', false, 'l', false, 'custom', ''),
  'visualNavigation', jsonb_build_object('yes', false, 'no', false, 'boson', false),
  'gps', jsonb_build_object(
    'holyBro', jsonb_build_object('enabled', false),
    'hardenGps', jsonb_build_object('enabled', false),
    'arcXL', jsonb_build_object('enabled', false),
    'custom', jsonb_build_object('enabled', false, 'value', '')
  )
)
WHERE hw_config IS NULL OR hw_config::text = '{}' OR hw_config = 'null'::jsonb;

CREATE OR REPLACE FUNCTION public.set_booking_snapshot_hw_config()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(v.hw_config, '{}'::jsonb)
  INTO new.snapshotted_hw_config
  FROM public.vehicles v
  WHERE v.id = new.vehicle_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_booking_snapshot ON bookings;
CREATE TRIGGER trigger_set_booking_snapshot
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE PROCEDURE public.set_booking_snapshot_hw_config();

select '12_migrate_hw_config completed.' as status;


-- ========== Done ==========
SELECT '========================================' as msg
UNION ALL SELECT 'All migrations 01–12 completed successfully.'
UNION ALL SELECT '========================================';
