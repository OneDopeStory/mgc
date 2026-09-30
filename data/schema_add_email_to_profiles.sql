-- MGC Global Consulting - Add email to client profiles
-- Run in Supabase Dashboard: SQL Editor > New Query > paste > Run

-- Add email column
alter table mgc_client_profiles
  add column if not exists email text;

-- Update trigger to capture email on signup
create or replace function mgc_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.mgc_client_profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, mgc_client_profiles.full_name);
  return new;
end;
$$;
