-- 1. Update the User Handling Function
-- This function runs automatically whenever a new user signs up via Google.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Security Check: Enforce @deltaquad.com domain
  -- If the email does NOT end with @deltaquad.com, we block the signup immediately.
  if new.email not like '%@deltaquad.com' then
    raise exception 'Access Denied: Only @deltaquad.com emails are allowed.';
  end if;

  -- Auto-Admin Logic: Check for specific emails
  if new.email = 'a.chang@deltaquad.com' or new.email = 'chris@deltaquad.com' then
     insert into public.profiles (id, email, role, avatar_url)
     values (new.id, new.email, 'admin', new.raw_user_meta_data->>'avatar_url');
  else
     -- Default behavior for everyone else
     insert into public.profiles (id, email, role, avatar_url)
     values (new.id, new.email, 'viewer', new.raw_user_meta_data->>'avatar_url');
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- 2. Update Permission Rules (RLS)
-- Allow "Admins" to update OTHER people's profiles (specifically the 'role' column).
create policy "Admins can update any profile." on profiles
  for update
  using (
    exists ( select 1 from profiles where id = auth.uid() and role = 'admin' )
  );
