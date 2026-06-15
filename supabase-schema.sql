create table if not exists public.boardly_boards (
  board_id text primary key,
  snapshot jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.boardly_boards enable row level security;

grant usage on schema public to anon;
grant select, insert, update on public.boardly_boards to anon;

drop policy if exists "boardly_boards_public_select" on public.boardly_boards;
drop policy if exists "boardly_boards_public_insert" on public.boardly_boards;
drop policy if exists "boardly_boards_public_update" on public.boardly_boards;

create policy "boardly_boards_public_select"
on public.boardly_boards
for select
to anon
using (true);

create policy "boardly_boards_public_insert"
on public.boardly_boards
for insert
to anon
with check (true);

create policy "boardly_boards_public_update"
on public.boardly_boards
for update
to anon
using (true)
with check (true);

create or replace function public.set_boardly_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_boardly_boards_updated_at on public.boardly_boards;

create trigger set_boardly_boards_updated_at
before update on public.boardly_boards
for each row
execute function public.set_boardly_updated_at();
