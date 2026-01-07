-- Reset (Caution: Deletes all data)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists activities;
drop table if exists bookings;
drop table if exists vehicles;
drop table if exists profiles;

-- Create Profiles Table (extends auth.users)
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text default 'viewer' check (role in ('viewer', 'editor', 'admin')),
  avatar_url text,
  updated_at timestamp with time zone
);

-- Turn on Row Level Security
alter table profiles enable row level security;

-- Create Policies for Profiles
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create Vehicles Table
create table vehicles (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  status text not null,
  type text check (type in ('uav', 'ugv', 'usv')),
  risk_level text check (risk_level in ('low', 'middle', 'high')),
  hw_config text,
  sw_version text,
  image_url text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on RLS
alter table vehicles enable row level security;

-- Create Policies for Vehicles
create policy "Vehicles are viewable by everyone." on vehicles
  for select using (true);

create policy "Editors can insert vehicles." on vehicles
  for insert with check (
    exists ( select 1 from profiles where id = auth.uid() and role in ('editor', 'admin') )
  );

create policy "Editors can update vehicles." on vehicles
  for update using (
    exists ( select 1 from profiles where id = auth.uid() and role in ('editor', 'admin') )
  );

-- Create Bookings Table
create table bookings (
  id uuid default uuid_generate_v4() primary key,
  vehicle_id uuid references vehicles not null,
  user_id uuid references auth.users not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  pilot_name text,
  mission_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table bookings enable row level security;

create policy "Bookings are viewable by everyone." on bookings
  for select using (true);

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

-- Create Activities / Logs Table
create table activities (
  id uuid default uuid_generate_v4() primary key,
  vehicle_id uuid references vehicles,
  user_id uuid references auth.users,
  action_type text check (action_type in ('status_change', 'comment', 'booking', 'upload')),
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table activities enable row level security;

create policy "Activities are viewable by everyone." on activities
  for select using (true);

create policy "Authenticated users can insert activities." on activities
  for insert with check (auth.role() = 'authenticated');

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, avatar_url)
  values (new.id, new.email, 'viewer', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on new user creation
create Trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
