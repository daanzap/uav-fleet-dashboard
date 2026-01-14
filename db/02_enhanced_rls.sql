--==========================================
-- UAV Fleet Dashboard - Enhanced RLS Policies
-- Clean rebuild: Drops ALL existing policies first
-- Then creates new secure policies
--==========================================

-- 1. Drop ALL existing policies on all tables
--==========================================

-- Vehicles policies
drop policy if exists "Vehicles are viewable by everyone." on vehicles;
drop policy if exists "Editors can insert vehicles." on vehicles;
drop policy if exists "Editors can update vehicles." on vehicles;
drop policy if exists "Admins can delete vehicles." on vehicles;
drop policy if exists "Authenticated users can view vehicles." on vehicles;

-- Bookings policies
drop policy if exists "Bookings are viewable by everyone." on bookings;
drop policy if exists "Editors can create bookings." on bookings;
drop policy if exists "Editors can update bookings." on bookings;
drop policy if exists "Editors can delete bookings." on bookings;
drop policy if exists "Authenticated users can view bookings." on bookings;

-- Activities policies
drop policy if exists "Activities are viewable by everyone." on activities;
drop policy if exists "Authenticated users can insert activities." on activities;
drop policy if exists "Authenticated users can view activities." on activities;

-- Profiles policies
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;
drop policy if exists "Admins can update any profile." on profiles;
drop policy if exists "Authenticated users can view profiles." on profiles;

-- Team members policies (clean slate)
drop policy if exists "Authenticated users can view team members." on team_members;
drop policy if exists "Editors can insert team members." on team_members;
drop policy if exists "Editors can update team members." on team_members;
drop policy if exists "Admins can delete team members." on team_members;

-- 2. Create new secure policies for Vehicles
--==========================================

create policy "Authenticated users can view vehicles." on vehicles
  for select using (auth.role() = 'authenticated');

create policy "Editors can insert vehicles." on vehicles
  for insert with check (
    exists ( select 1 from profiles where id = auth.uid() and role in ('editor', 'admin') )
  );

create policy "Editors can update vehicles." on vehicles
  for update using (
    exists ( select 1 from profiles where id = auth.uid() and role in ('editor', 'admin') )
  );

create policy "Admins can delete vehicles." on vehicles
  for delete using (
    exists ( select 1 from profiles where id = auth.uid() and role = 'admin' )
  );

-- 3. Create new secure policies for Bookings
--==========================================

create policy "Authenticated users can view bookings." on bookings
  for select using (auth.role() = 'authenticated');

create policy "Editors can create bookings." on bookings
  for insert with check (
    exists ( select 1 from profiles where id = auth.uid() and role in ('editor', 'admin') )
  );

create policy "Editors can update bookings." on bookings
  for update using (
    exists ( select 1 from profiles where id = auth.uid() and role in ('editor', 'admin') )
  );

create policy "Editors can delete bookings." on bookings
  for delete using (
    exists ( select 1 from profiles where id = auth.uid() and role in ('editor', 'admin') )
  );

-- 4. Create new secure policies for Activities
--==========================================

create policy "Authenticated users can view activities." on activities
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert activities." on activities
  for insert with check (auth.role() = 'authenticated');

-- 5. Create new secure policies for Profiles
--==========================================

create policy "Authenticated users can view profiles." on profiles
  for select using (auth.role() = 'authenticated');

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

create policy "Admins can update any profile." on profiles
  for update using (
    exists ( select 1 from profiles where id = auth.uid() and role = 'admin' )
  );

-- 6. Create policies for Team Members
--==========================================

create policy "Authenticated users can view team members." on team_members
  for select using (auth.role() = 'authenticated');

create policy "Editors can insert team members." on team_members
  for insert with check (
    exists ( select 1 from profiles where id = auth.uid() and role in ('editor', 'admin') )
  );

create policy "Editors can update team members." on team_members
  for update using (
    exists ( select 1 from profiles where id = auth.uid() and role in ('editor', 'admin') )
  );

create policy "Admins can delete team members." on team_members
  for delete using (
    exists ( select 1 from profiles where id = auth.uid() and role = 'admin' )
  );

-- 7. Success confirmation
--==========================================

select 'Enhanced RLS policies applied successfully!' as status;
