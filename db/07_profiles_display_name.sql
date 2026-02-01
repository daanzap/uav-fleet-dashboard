-- Add display_name to profiles for user nickname (default: email local part)
alter table profiles add column if not exists display_name text;
