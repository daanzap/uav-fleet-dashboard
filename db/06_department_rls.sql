--==========================================
-- PRD: Department-based Row Level Security
-- Run after 05_department_and_jsonb.sql
-- Implements: R&D+Training shared pool, Marketing isolated, Admin sees all
--==========================================

-- 1. Drop existing RLS policies (if any)
--==========================================
drop policy if exists "Vehicles are viewable by authorized users" on vehicles;
drop policy if exists "Users can insert vehicles" on vehicles;
drop policy if exists "Users can update vehicles" on vehicles;
drop policy if exists "Users can delete vehicles" on vehicles;

drop policy if exists "Bookings are viewable by authorized users" on bookings;
drop policy if exists "Users can insert bookings" on bookings;
drop policy if exists "Users can update bookings" on bookings;
drop policy if exists "Users can delete bookings" on bookings;

-- 2. Enable RLS on vehicles and bookings
--==========================================
alter table vehicles enable row level security;
alter table bookings enable row level security;

-- 3. Vehicles RLS policies
--==========================================

-- SELECT: Department-based visibility
-- - Admin: sees all
-- - R&D/Training: see R&D + Training vehicles (shared pool)
-- - Marketing: sees only Marketing vehicles
create policy "vehicles_select_by_department"
  on vehicles for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and (
        profiles.role = 'admin'  -- Admin sees all
        or (
          -- R&D and Training share a pool
          profiles.department in ('R&D', 'Training') 
          and vehicles.department in ('R&D', 'Training')
        )
        or (
          -- Marketing sees only Marketing
          profiles.department = 'Marketing' 
          and vehicles.department = 'Marketing'
        )
      )
    )
  );

-- INSERT: Editor or Admin can create vehicles
create policy "vehicles_insert_by_role"
  on vehicles for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('editor', 'admin')
    )
  );

-- UPDATE: Editor or Admin can update vehicles they can see
create policy "vehicles_update_by_role"
  on vehicles for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('editor', 'admin')
      and (
        profiles.role = 'admin'
        or (
          profiles.department in ('R&D', 'Training') 
          and vehicles.department in ('R&D', 'Training')
        )
        or (
          profiles.department = 'Marketing' 
          and vehicles.department = 'Marketing'
        )
      )
    )
  );

-- DELETE: Only admin can delete vehicles
create policy "vehicles_delete_by_admin"
  on vehicles for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- 4. Bookings RLS policies
--==========================================

-- SELECT: See bookings for vehicles you can access
create policy "bookings_select_by_department"
  on bookings for select
  using (
    exists (
      select 1 from profiles
      join vehicles on bookings.vehicle_id = vehicles.id
      where profiles.id = auth.uid()
      and (
        profiles.role = 'admin'
        or (
          profiles.department in ('R&D', 'Training') 
          and vehicles.department in ('R&D', 'Training')
        )
        or (
          profiles.department = 'Marketing' 
          and vehicles.department = 'Marketing'
        )
      )
    )
  );

-- INSERT: Editor or Admin can create bookings for vehicles they can access
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
        or (
          profiles.department in ('R&D', 'Training') 
          and vehicles.department in ('R&D', 'Training')
        )
        or (
          profiles.department = 'Marketing' 
          and vehicles.department = 'Marketing'
        )
      )
    )
  );

-- UPDATE: Editor or Admin can update their own bookings
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

-- DELETE: Admin or booking owner can delete
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

-- 5. Success confirmation
--==========================================
select 'Department-based RLS policies applied successfully!' as status;
