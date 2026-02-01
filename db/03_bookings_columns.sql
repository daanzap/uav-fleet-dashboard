--==========================================
-- Add columns required by the booking form (BookingModal)
-- Run this after 01_schema_fixes.sql if your bookings table
-- is missing: duration, notes, project_name, status
--==========================================

alter table bookings add column if not exists duration text;
alter table bookings add column if not exists notes text;
alter table bookings add column if not exists project_name text;
alter table bookings add column if not exists status text;

-- Optional: allow NULL on start_time/end_time if you ever want date-only first
-- (current schema has them NOT NULL; frontend sends full-day timestamps)

select 'Bookings columns (duration, notes, project_name, status) added successfully.' as status;
