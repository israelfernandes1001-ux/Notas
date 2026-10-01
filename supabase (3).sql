-- ===== MINHA AULA · ESCOLA SESI =====
-- 1) Na linha "insert into config", troque COLOQUE-SUA-SENHA-AQUI pela sua senha de dono.
--    Mantenha as DUAS aspas simples em volta da senha: 'minha-senha'
-- 2) Cole TUDO no Supabase: SQL Editor > New query > Run.
-- Pode rodar de novo sem erro. A senha so e gravada na primeira vez.
-- Para trocar a senha depois, rode: update config set v='NOVA-SENHA' where k='owner';

create table if not exists members(id uuid primary key, tok text not null, name text, room text, is_mod boolean not null default false, ts timestamptz default now());
create table if not exists avisos(id uuid primary key default gen_random_uuid(), room text not null, t text not null, fixed boolean, d date, exp bigint, "time" text, "by" text, ts timestamptz default now());
create table if not exists config(k text primary key, v text not null);
create table if not exists quiz_rounds(id bigint primary key, room text not null, subj text, qs jsonb not null, ts timestamptz default now());
create table if not exists quiz_scores(room text not null, round bigint not null, pid uuid not null, name text, score int not null default 0, done boolean not null default false, ts timestamptz default now(), primary key(room, round, pid));

insert into config values('owner','COLOQUE-SUA-SENHA-AQUI') on conflict (k) do nothing;

alter table members enable row level security;
alter table config enable row level security;
alter table avisos enable row level security;
alter table quiz_rounds enable row level security;
alter table quiz_scores enable row level security;

drop policy if exists "todos leem avisos" on avisos;
create policy "todos leem avisos" on avisos for select using (true);
drop policy if exists "todos leem rodadas" on quiz_rounds;
create policy "todos leem rodadas" on quiz_rounds for select using (true);
drop policy if exists "todos leem placar" on quiz_scores;
create policy "todos leem placar" on quiz_scores for select using (true);

create or replace view members_public as select id, name, room, is_mod from members;
grant select on avisos to anon;
grant select on quiz_rounds to anon;
grant select on quiz_scores to anon;
grant select on members_public to anon;

create or replace function check_owner(p_code text) returns boolean language sql security definer set search_path = public as $$
  select exists(select 1 from config where k = 'owner' and v = p_code) $$;

create or replace function join_room(p_id uuid, p_tok text, p_name text, p_room text) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_room not in ('2º A','2º B','2º C','2º D') then raise exception 'sala invalida'; end if;
  insert into members(id, tok, name, room) values (p_id, p_tok, left(p_name, 40), p_room)
  on conflict (id) do update set name = left(p_name, 40), room = p_room where members.tok = p_tok;
end $$;

create or replace function add_aviso(p_id uuid, p_tok text, p_code text, p_room text, p_t text, p_fixed boolean, p_d date, p_exp bigint, p_time text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not (check_owner(p_code) or exists(select 1 from members where id = p_id and tok = p_tok and is_mod and room = p_room)) then raise exception 'sem permissao'; end if;
  insert into avisos(room, t, fixed, d, exp, "time", "by") values (p_room, left(p_t, 200), p_fixed, p_d, p_exp, p_time, coalesce((select name from members where id = p_id), 'Dono'));
end $$;

create or replace function del_aviso(p_id uuid, p_tok text, p_code text, p_aviso uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  if not (check_owner(p_code) or exists(select 1 from members m join avisos a on a.room = m.room where m.id = p_id and m.tok = p_tok and m.is_mod and a.id = p_aviso)) then raise exception 'sem permissao'; end if;
  delete from avisos where id = p_aviso;
end $$;

create or replace function set_mod(p_code text, p_member uuid, p_on boolean) returns void language plpgsql security definer set search_path = public as $$
begin
  if not check_owner(p_code) then raise exception 'sem permissao'; end if;
  update members set is_mod = p_on where id = p_member;
end $$;

create or replace function quiz_start(p_room text, p_id bigint, p_subj text, p_qs jsonb) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_room !~ '^[A-Z0-9]{4,6}$' then raise exception 'sala invalida'; end if;
  if jsonb_typeof(p_qs) <> 'array' or jsonb_array_length(p_qs) > 20 then raise exception 'perguntas invalidas'; end if;
  delete from quiz_rounds where ts < now() - interval '1 day';
  delete from quiz_scores where ts < now() - interval '1 day';
  insert into quiz_rounds(id, room, subj, qs) values (p_id, p_room, left(p_subj, 300), p_qs) on conflict do nothing;
end $$;

create or replace function quiz_score(p_room text, p_round bigint, p_pid uuid, p_name text, p_score int, p_done boolean) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_room !~ '^[A-Z0-9]{4,6}$' then raise exception 'sala invalida'; end if;
  if not exists(select 1 from quiz_rounds where id = p_round and room = p_room) then raise exception 'rodada invalida'; end if;
  insert into quiz_scores(room, round, pid, name, score, done) values (p_room, p_round, p_pid, left(p_name, 30), greatest(p_score, 0), p_done)
  on conflict (room, round, pid) do update set name = excluded.name, score = excluded.score, done = excluded.done, ts = now();
end $$;
