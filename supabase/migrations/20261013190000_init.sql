-- Cechas: исходное создание базы.
-- Таблицы: profiles, jobs, topics, replies.
-- Пароль здесь не хранится. Его держит auth.users.
-- Повторный запуск на уже созданной базе остановится на create table.

-- ---------------------------------------------------------------------------
-- Профиль создаётся вместе с учётной записью входа.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_name text;
begin
  clean_name = nullif(trim(new.raw_user_meta_data->>'name'), '');

  if clean_name is null or char_length(clean_name) < 2 or char_length(clean_name) > 40 then
    raise exception 'Vardą sudaro 2–40 simbolių.';
  end if;
  if new.email is null or new.email !~* '^\S+@\S+\.\S+$' then
    raise exception 'El. paštas netinka.';
  end if;

  insert into public.profiles (id, name, email)
  values (new.id, clean_name, lower(new.email));

  return new;
end;
$$;

create or replace function public.guard_profile_update()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id
     or new.email is distinct from old.email
     or new.created_at is distinct from old.created_at then
    raise exception 'Galima keisti tik vardą.';
  end if;
  return new;
end;
$$;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Nėra prisijungimo.';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles. Один вход — один профиль.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  constraint profiles_name_check check (char_length(trim(name)) between 2 and 40),
  constraint profiles_email_check check (email = lower(email) and email ~* '^\S+@\S+\.\S+$'),
  constraint profiles_email_key unique (email)
);

create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Имена видны всем. Почта через это представление не отдаётся.
create view public.profile_names
with (security_invoker = false) as
select id, name
from public.profiles;

-- ---------------------------------------------------------------------------
-- jobs. Один участник — много объявлений.
-- ---------------------------------------------------------------------------

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  company text not null,
  place text not null default 'nuotoliniu būdu',
  tag text not null default 'kita',
  description text not null,
  created_at timestamptz not null default now(),
  constraint jobs_title_check check (char_length(trim(title)) between 4 and 120),
  constraint jobs_company_check check (char_length(trim(company)) between 1 and 80),
  constraint jobs_place_check check (char_length(trim(place)) between 1 and 80),
  constraint jobs_tag_check check (tag in ('neuroniniai tinklai', 'administravimas', 'DI produktai', 'kita')),
  constraint jobs_description_check check (char_length(trim(description)) between 10 and 2000)
);

create index jobs_author_id_idx on public.jobs (author_id);

-- ---------------------------------------------------------------------------
-- topics. Один участник — много тем.
-- ---------------------------------------------------------------------------

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint topics_title_check check (char_length(trim(title)) between 4 and 140),
  constraint topics_body_check check (char_length(trim(body)) between 10 and 4000)
);

create index topics_author_id_idx on public.topics (author_id);

-- ---------------------------------------------------------------------------
-- replies. Ответ принадлежит одной теме и одному автору.
-- ---------------------------------------------------------------------------

create table public.replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint replies_body_check check (char_length(trim(body)) between 2 and 4000)
);

create index replies_topic_id_idx on public.replies (topic_id);
create index replies_author_id_idx on public.replies (author_id);

-- ---------------------------------------------------------------------------
-- Доступ
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.topics enable row level security;
alter table public.replies enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.jobs from anon, authenticated;
revoke all on public.topics from anon, authenticated;
revoke all on public.replies from anon, authenticated;
revoke all on public.profile_names from anon, authenticated;

grant select (id, name, email, created_at) on public.profiles to authenticated;
grant update (name) on public.profiles to authenticated;
grant delete on public.profiles to authenticated;

grant select on public.profile_names to anon, authenticated;

grant select on public.jobs to anon, authenticated;
grant insert on public.jobs to authenticated;

grant select on public.topics to anon, authenticated;
grant insert on public.topics to authenticated;

grant select on public.replies to anon, authenticated;
grant insert on public.replies to authenticated;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.guard_profile_update() from public, anon, authenticated;
revoke all on function public.delete_own_account() from public, anon, authenticated;
grant execute on function public.delete_own_account() to authenticated;

create policy profiles_select_own
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_delete_own
  on public.profiles for delete
  to authenticated
  using (id = auth.uid());

create policy jobs_select_all
  on public.jobs for select
  to anon, authenticated
  using (true);

create policy jobs_insert_own
  on public.jobs for insert
  to authenticated
  with check (author_id = auth.uid());

create policy topics_select_all
  on public.topics for select
  to anon, authenticated
  using (true);

create policy topics_insert_own
  on public.topics for insert
  to authenticated
  with check (author_id = auth.uid());

create policy replies_select_all
  on public.replies for select
  to anon, authenticated
  using (true);

create policy replies_insert_own
  on public.replies for insert
  to authenticated
  with check (author_id = auth.uid());
