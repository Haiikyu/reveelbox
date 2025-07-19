-- supabase/migrations/000_init.sql
-- ------------------------------------------------------------------
-- Baseline ReveelBox : profiles + trigger inscription
---------------------------------------------------------------------

/* 1. Table profiles ------------------------------------------------*/
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text,
  avatar_url      text,
  virtual_currency integer default 100 not null,
  loyalty_points   integer default 0   not null,
  created_at      timestamptz default timezone('utc', now())
);

/* 2–3. Fonction + trigger -----------------------------------------*/
drop trigger  if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user;

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();