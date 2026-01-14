--==========================================
-- UAV Fleet Dashboard - Complete Schema Fix
-- Fixes all missing tables and columns
-- Execution time: ~1-2 minutes
--==========================================

-- 1. Drop and recreate team_members table with correct structure
--==========================================

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

-- Enable Row Level Security
alter table team_members enable row level security;

-- 2. Add missing columns to profiles table
--==========================================

alter table profiles add column if not exists created_at timestamp with time zone default now();

-- Note: display_name already exists based on diagnostic results

-- 3. Add missing columns to bookings table
--==========================================

alter table bookings add column if not exists who_ordered text;
alter table bookings add column if not exists purpose text;

-- 4. Update foreign key constraints to CASCADE on delete
--==========================================

-- Drop existing bookings foreign key constraint if exists
do $$ 
begin
  if exists (
    select 1 from pg_constraint 
    where conname = 'bookings_vehicle_id_fkey'
  ) then
    alter table bookings drop constraint bookings_vehicle_id_fkey;
  end if;
end $$;

-- Recreate with CASCADE delete
alter table bookings 
  add constraint bookings_vehicle_id_fkey 
  foreign key (vehicle_id) 
  references vehicles(id) 
  on delete cascade;

-- Drop existing activities foreign key constraint if exists
do $$ 
begin
  if exists (
    select 1 from pg_constraint 
    where conname = 'activities_vehicle_id_fkey'
  ) then
    alter table activities drop constraint activities_vehicle_id_fkey;
  end if;
end $$;

-- Recreate with CASCADE delete
alter table activities 
  add constraint activities_vehicle_id_fkey 
  foreign key (vehicle_id) 
  references vehicles(id) 
  on delete cascade;

-- 5. Create indexes for query performance optimization
--==========================================

-- Bookings indexes
create index if not exists idx_bookings_vehicle_id on bookings(vehicle_id);
create index if not exists idx_bookings_user_id on bookings(user_id);
create index if not exists idx_bookings_start_time on bookings(start_time);
create index if not exists idx_bookings_end_time on bookings(end_time);

-- Activities indexes
create index if not exists idx_activities_vehicle_id on activities(vehicle_id);
create index if not exists idx_activities_user_id on activities(user_id);
create index if not exists idx_activities_created_at on activities(created_at desc);

-- Team members indexes
create index if not exists idx_team_members_user_id on team_members(user_id);
create index if not exists idx_team_members_is_active on team_members(is_active) where is_active = true;

-- Profiles indexes
create index if not exists idx_profiles_email on profiles(email);
create index if not exists idx_profiles_role on profiles(role);

-- Vehicles indexes (optional but recommended)
create index if not exists idx_vehicles_status on vehicles(status);
create index if not exists idx_vehicles_type on vehicles(type);

-- 6. Success confirmation
--==========================================

select 'Schema fix completed successfully!' as status;
