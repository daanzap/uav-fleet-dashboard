--==========================================
-- PRD: risk_level, location, snapshotted_hw_config (additive only)
-- Run after 03_bookings_columns.sql. Safe for existing data.
--==========================================

alter table bookings add column if not exists risk_level text;
alter table bookings add column if not exists location text;
alter table bookings add column if not exists snapshotted_hw_config jsonb;

-- Trigger: on booking INSERT, copy vehicle's hw_config into snapshotted_hw_config
-- (hw_config may be text; we store as jsonb {"raw": "..."} to preserve existing data)
create or replace function public.set_booking_snapshot_hw_config()
returns trigger as $$
declare
  v_hw text;
begin
  select hw_config into v_hw from public.vehicles where id = new.vehicle_id;
  new.snapshotted_hw_config := jsonb_build_object('raw', coalesce(v_hw, ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_set_booking_snapshot on bookings;
create trigger trigger_set_booking_snapshot
  before insert on bookings
  for each row execute procedure public.set_booking_snapshot_hw_config();

select 'Bookings PRD columns and snapshot trigger applied.' as status;
