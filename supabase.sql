-- Cole TUDO isto no Supabase: SQL Editor > New query > Run
-- Antes de rodar, troque TROQUE-ESTE-CODIGO pelo seu código secreto de dono.

create table members(id uuid primary key, tok text not null, name text, room text, is_mod boolean not null default false, ts timestamptz default now());
create table avisos(id uuid primary key default gen_random_uuid(), room text not null, t text not null, fixed boolean, d date, exp bigint, "time" text, "by" text, ts timestamptz default now());
create table config(k text primary key, v text not null);
insert into config values('owner','Sesi#Dono2026);

alter table members enable row level security;
alter table config enable row level security;
alter table avisos enable row level security;
create policy "todos leem avisos" on avisos for select using (true);
create view members_public as select id, name, room, is_mod from members;
grant select on avisos to anon;
grant select on members_public to anon;

create function check_owner(p_code text) returns boolean language sql security definer as $$
  select exists(select 1 from config where k='owner' and v=p_code) $$;

create function join_room(p_id uuid, p_tok text, p_name text, p_room text) returns void language plpgsql security definer as $$
begin
  if p_room not in ('2º A','2º B','2º C','2º D') then raise exception 'sala invalida'; end if;
  insert into members(id,tok,name,room) values(p_id,p_tok,left(p_name,40),p_room)
  on conflict(id) do update set name=left(p_name,40), room=p_room where members.tok=p_tok;
end $$;

create function add_aviso(p_id uuid, p_tok text, p_code text, p_room text, p_t text, p_fixed boolean, p_d date, p_exp bigint, p_time text) returns void language plpgsql security definer as $$
begin
  if not (check_owner(p_code) or exists(select 1 from members where id=p_id and tok=p_tok and is_mod and room=p_room)) then raise exception 'sem permissao'; end if;
  insert into avisos(room,t,fixed,d,exp,"time","by") values(p_room,left(p_t,200),p_fixed,p_d,p_exp,p_time,coalesce((select name from members where id=p_id),'Dono'));
end $$;

create function del_aviso(p_id uuid, p_tok text, p_code text, p_aviso uuid) returns void language plpgsql security definer as $$
begin
  if not (check_owner(p_code) or exists(select 1 from members m join avisos a on a.room=m.room where m.id=p_id and m.tok=p_tok and m.is_mod and a.id=p_aviso)) then raise exception 'sem permissao'; end if;
  delete from avisos where id=p_aviso;
end $$;

create function set_mod(p_code text, p_member uuid, p_on boolean) returns void language plpgsql security definer as $$
begin
  if not check_owner(p_code) then raise exception 'sem permissao'; end if;
  update members set is_mod=p_on where id=p_member;
end $$;
