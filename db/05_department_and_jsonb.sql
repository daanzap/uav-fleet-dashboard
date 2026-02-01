--==========================================
-- PRD: Department columns + hw_config JSONB conversion
-- Run after 04_bookings_prd_snapshot.sql
-- Adds department isolation and flexible hardware config
--==========================================

-- 1. Add department to profiles
--==========================================
alter table profiles add column if not exists department text default 'R&D';

-- Add constraint for valid departments
do $$ 
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'profiles_department_check'
  ) then
    alter table profiles 
      add constraint profiles_department_check 
      check (department in ('R&D', 'Training', 'Marketing'));
  end if;
end $$;

-- 2. Add department to vehicles
--==========================================
alter table vehicles add column if not exists department text default 'R&D';

-- Add constraint for valid departments
do $$ 
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'vehicles_department_check'
  ) then
    alter table vehicles 
      add constraint vehicles_department_check 
      check (department in ('R&D', 'Training', 'Marketing'));
  end if;
end $$;

-- 3. Convert hw_config from text to JSONB
--==========================================
-- First, check if hw_config exists and is text type
do $$ 
begin
  -- If hw_config is text, convert existing data to JSONB
  if exists (
    select 1 from information_schema.columns 
    where table_name = 'vehicles' 
    and column_name = 'hw_config'
    and data_type = 'text'
  ) then
    -- Migrate existing text data to JSONB format {"raw": "..."}
    update vehicles 
    set hw_config = jsonb_build_object('raw', coalesce(hw_config, ''))::text
    where hw_config is not null and hw_config != '';
    
    -- Now alter the column type
    alter table vehicles 
      alter column hw_config type jsonb 
      using case 
        when hw_config is null or hw_config = '' then '{}'::jsonb
        else hw_config::jsonb
      end;
  end if;
  
  -- If hw_config doesn't exist, create it as JSONB
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'vehicles' 
    and column_name = 'hw_config'
  ) then
    alter table vehicles add column hw_config jsonb default '{}'::jsonb;
  end if;
end $$;

-- 4. Add index for department queries
--==========================================
create index if not exists idx_profiles_department on profiles(department);
create index if not exists idx_vehicles_department on vehicles(department);

-- 5. Success confirmation
--==========================================
select 'Department columns and JSONB hw_config applied successfully!' as status;
