-- CRUD: savo skelbimą, temą ir atsakymą galima pakeisti ir ištrinti.
-- Autoriaus ir sukūrimo laiko keisti negalima.

create or replace function public.guard_author_update()
returns trigger
language plpgsql
as $$
begin
  if new.author_id is distinct from old.author_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Autoriaus keisti negalima.';
  end if;
  if tg_table_name = 'replies' and new.topic_id is distinct from old.topic_id then
    raise exception 'Temos keisti negalima.';
  end if;
  return new;
end;
$$;

create trigger jobs_guard_update
  before update on public.jobs
  for each row execute function public.guard_author_update();

create trigger topics_guard_update
  before update on public.topics
  for each row execute function public.guard_author_update();

create trigger replies_guard_update
  before update on public.replies
  for each row execute function public.guard_author_update();

grant update, delete on public.jobs to authenticated;
grant update, delete on public.topics to authenticated;
grant update, delete on public.replies to authenticated;

create policy jobs_update_own
  on public.jobs for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy jobs_delete_own
  on public.jobs for delete
  to authenticated
  using (author_id = auth.uid());

create policy topics_update_own
  on public.topics for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy topics_delete_own
  on public.topics for delete
  to authenticated
  using (author_id = auth.uid());

create policy replies_update_own
  on public.replies for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy replies_delete_own
  on public.replies for delete
  to authenticated
  using (author_id = auth.uid());
