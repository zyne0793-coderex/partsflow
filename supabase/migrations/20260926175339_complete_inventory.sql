-- Additive upgrade from Phase 1. Existing catalogs become private workspaces.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.workspaces (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(trim(name)) between 1 and 100),
 owner_id uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create table public.memberships (
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 user_id uuid not null references auth.users(id),
 email text not null,
 role text not null check(role in ('owner','admin','member','viewer')),
 primary key(workspace_id,user_id)
);
create index memberships_user_idx on public.memberships(user_id);

-- Definer helper avoids recursive membership RLS. No user-supplied identity.
create function private.team_role(team uuid) returns text
language sql stable security definer set search_path = '' as $$
 select role from public.memberships where workspace_id=team and user_id=(select auth.uid())
$$;
revoke all on function private.team_role(uuid) from public;
grant execute on function private.team_role(uuid) to authenticated;

insert into public.workspaces(name,owner_id)
 select 'My workspace', owner_id from public.parts group by owner_id;
insert into public.memberships(workspace_id,user_id,email,role)
 select w.id,w.owner_id,u.email,'owner' from public.workspaces w join auth.users u on u.id=w.owner_id;
alter table public.parts add column workspace_id uuid references public.workspaces(id);
update public.parts p set workspace_id=w.id from public.workspaces w where w.owner_id=p.owner_id;
alter table public.parts alter column workspace_id set not null;
alter table public.parts add column minimum_stock numeric(14,3) not null default 0 check(minimum_stock>=0 and minimum_stock<=99999999999.999);
alter table public.parts add column archived boolean not null default false;
alter table public.parts add constraint parts_team_id_unique unique(workspace_id,id);
drop index public.parts_owner_number_unique;
create unique index parts_team_number_unique on public.parts(workspace_id,lower(part_number));
create index parts_team_created_idx on public.parts(workspace_id,created_at desc);
drop policy "Read own parts" on public.parts;
drop policy "Add own parts" on public.parts;
drop policy "Edit own parts" on public.parts;
create policy "Team reads parts" on public.parts for select to authenticated using(private.team_role(workspace_id) is not null);
create policy "Team adds parts" on public.parts for insert to authenticated with check(private.team_role(workspace_id) in ('owner','admin','member') and owner_id=auth.uid());
create policy "Team edits parts" on public.parts for update to authenticated using(private.team_role(workspace_id) in ('owner','admin','member')) with check(private.team_role(workspace_id) in ('owner','admin','member'));
revoke update on public.parts from authenticated;
grant update(part_number,name,description,category,manufacturer,storage_location,unit,minimum_stock,archived,updated_at) on public.parts to authenticated;

create table public.work_orders (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id),
 title text not null check(length(trim(title)) between 1 and 160),
 equipment text not null default '' check(length(equipment)<=160),
 description text not null default '' check(length(description)<=4000),
 status text not null default 'open' check(status in ('open','in_progress','completed','cancelled')),
 priority text not null default 'normal' check(priority in ('low','normal','high','urgent')),
 assigned_to uuid,
 due_date date,
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(workspace_id,id),
 foreign key(workspace_id,assigned_to) references public.memberships(workspace_id,user_id) on delete set null (assigned_to)
);
create index work_orders_team_idx on public.work_orders(workspace_id,created_at desc);
create index work_orders_assignee_idx on public.work_orders(workspace_id,assigned_to);
create index work_orders_creator_idx on public.work_orders(created_by);

create table public.stock_movements (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id),
 part_id uuid not null,
 quantity numeric(14,3) not null check(quantity<>0 and abs(quantity)<=99999999999.999),
 note text not null check(length(trim(note)) between 1 and 500),
 work_order_id uuid,
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 foreign key(workspace_id,part_id) references public.parts(workspace_id,id),
 foreign key(workspace_id,work_order_id) references public.work_orders(workspace_id,id)
);
create index movements_part_idx on public.stock_movements(workspace_id,part_id,created_at desc);
create index movements_order_idx on public.stock_movements(workspace_id,work_order_id);
create index movements_creator_idx on public.stock_movements(created_by);

create function private.check_stock() returns trigger language plpgsql security invoker set search_path='' as $$
declare balance numeric; is_archived boolean; order_status text;
begin
 new.created_at:=now();
 select archived into is_archived from public.parts where id=new.part_id and workspace_id=new.workspace_id for update;
 if not found or is_archived then raise exception 'Part is unavailable or archived'; end if;
 if new.work_order_id is not null then
  select status into order_status from public.work_orders where id=new.work_order_id and workspace_id=new.workspace_id for update;
  if not found or order_status in ('completed','cancelled') then raise exception 'Work order is closed or unavailable'; end if;
 end if;
 select coalesce(sum(quantity),0) into balance from public.stock_movements where part_id=new.part_id and workspace_id=new.workspace_id;
 if balance+new.quantity < 0 then raise exception 'Insufficient stock'; end if;
 return new;
end $$;
create trigger check_stock before insert on public.stock_movements for each row execute function private.check_stock();

create function private.keep_stock_unit() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.unit<>old.unit and exists(select 1 from public.stock_movements where part_id=old.id) then
  raise exception 'Cannot change the unit after stock movements exist';
 end if;
 return new;
end $$;
create trigger keep_stock_unit before update on public.parts for each row execute function private.keep_stock_unit();

create table public.team_invitations (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id),
 workspace_name text not null default '',
 email text not null check(email=lower(trim(email)) and length(email)<=254 and email like '%@%'),
 role text not null check(role in ('admin','member','viewer')),
 invited_by uuid not null default auth.uid() references auth.users(id),
 expires_at timestamptz not null default now()+interval '7 days',
 unique(workspace_id,email)
);
create index invitations_inviter_idx on public.team_invitations(invited_by);
create function private.name_invitation() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 select name into new.workspace_name from public.workspaces where id=new.workspace_id;
 return new;
end $$;
create trigger name_invitation before insert on public.team_invitations for each row execute function private.name_invitation();

alter table public.workspaces enable row level security;
alter table public.memberships enable row level security;
alter table public.work_orders enable row level security;
alter table public.stock_movements enable row level security;
alter table public.team_invitations enable row level security;
revoke all on public.workspaces,public.memberships,public.work_orders,public.stock_movements,public.team_invitations from anon,authenticated;
grant select on public.workspaces,public.memberships to authenticated;
grant select,insert on public.work_orders,public.stock_movements to authenticated;
grant update(title,equipment,description,status,priority,assigned_to,due_date,updated_at) on public.work_orders to authenticated;
grant select,insert,delete on public.team_invitations to authenticated;
create policy "Team reads workspace" on public.workspaces for select to authenticated using(private.team_role(id) is not null);
create policy "Team reads memberships" on public.memberships for select to authenticated using(private.team_role(workspace_id) is not null);
create policy "Team reads orders" on public.work_orders for select to authenticated using(private.team_role(workspace_id) is not null);
create policy "Team creates orders" on public.work_orders for insert to authenticated with check(private.team_role(workspace_id) in ('owner','admin','member') and created_by=auth.uid());
create policy "Team edits orders" on public.work_orders for update to authenticated using(private.team_role(workspace_id) in ('owner','admin','member')) with check(private.team_role(workspace_id) in ('owner','admin','member'));
create policy "Team reads movements" on public.stock_movements for select to authenticated using(private.team_role(workspace_id) is not null);
create policy "Team records movements" on public.stock_movements for insert to authenticated with check(private.team_role(workspace_id) in ('owner','admin','member') and created_by=auth.uid());
create policy "Read invitations" on public.team_invitations for select to authenticated using(private.team_role(workspace_id) in ('owner','admin') or email=lower(auth.jwt()->>'email'));
create policy "Invite teammates" on public.team_invitations for insert to authenticated with check(private.team_role(workspace_id) in ('owner','admin') and invited_by=auth.uid());
create policy "Revoke invitations" on public.team_invitations for delete to authenticated using(private.team_role(workspace_id) in ('owner','admin'));

create view public.inventory with (security_invoker=true) as
 select p.*,coalesce(s.quantity,0) as quantity,coalesce(s.quantity,0)<=p.minimum_stock as low_stock from public.parts p
 left join (select part_id, sum(quantity) quantity from public.stock_movements group by part_id) s on s.part_id=p.id;
grant select on public.inventory to authenticated;
revoke all on public.inventory from anon;

-- Privileged bootstrap/invitation operations live outside the exposed API schema.
create function private.create_workspace(workspace_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare team uuid; actor uuid:=auth.uid(); actor_email text;
begin
 select email into actor_email from auth.users where id=actor and email_confirmed_at is not null;
 if actor_email is null then raise exception 'Verified sign-in required'; end if;
 if (select count(*) from public.workspaces where owner_id=actor)>=10 then raise exception 'Workspace limit reached'; end if;
 insert into public.workspaces(name,owner_id) values(trim(workspace_name),actor) returning id into team;
 insert into public.memberships values(team,actor,actor_email,'owner');
 return team;
end $$;
create function private.accept_invitation(invitation_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare invitation public.team_invitations; actor_email text;
begin
 select lower(email) into actor_email from auth.users where id=auth.uid() and email_confirmed_at is not null;
 if actor_email is null then raise exception 'Verified sign-in required'; end if;
 select * into invitation from public.team_invitations where id=invitation_id and email=actor_email and expires_at>now() for update;
 if not found then raise exception 'Invitation unavailable or expired'; end if;
 insert into public.memberships values(invitation.workspace_id,auth.uid(),actor_email,invitation.role) on conflict do nothing;
 delete from public.team_invitations where id=invitation_id;
 return invitation.workspace_id;
end $$;
create function private.manage_member(team uuid, member_id uuid, new_role text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or private.team_role(team) is distinct from 'owner' then raise exception 'Only the owner can manage members'; end if;
 if exists(select 1 from public.memberships where workspace_id=team and user_id=member_id and role='owner') then raise exception 'The owner cannot be removed or demoted'; end if;
 if new_role='remove' then delete from public.memberships where workspace_id=team and user_id=member_id;
 elsif new_role in ('admin','member','viewer') then update public.memberships set role=new_role where workspace_id=team and user_id=member_id;
 else raise exception 'Invalid role'; end if;
end $$;
revoke all on function private.create_workspace(text),private.accept_invitation(uuid),private.manage_member(uuid,uuid,text) from public;
grant execute on function private.create_workspace(text),private.accept_invitation(uuid),private.manage_member(uuid,uuid,text) to authenticated;
create function public.create_workspace(workspace_name text) returns uuid language sql security invoker set search_path='' as $$ select private.create_workspace(workspace_name) $$;
create function public.accept_invitation(invitation_id uuid) returns uuid language sql security invoker set search_path='' as $$ select private.accept_invitation(invitation_id) $$;
create function public.manage_member(team uuid, member_id uuid, new_role text) returns void language sql security invoker set search_path='' as $$ select private.manage_member(team,member_id,new_role) $$;
revoke all on function public.create_workspace(text),public.accept_invitation(uuid),public.manage_member(uuid,uuid,text) from public;
grant execute on function public.create_workspace(text),public.accept_invitation(uuid),public.manage_member(uuid,uuid,text) to authenticated;

-- Keep Phase 1 inserts working during rollout or an application rollback.
create function private.legacy_part_workspace() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.workspace_id is null then
  select id into new.workspace_id from public.workspaces where owner_id=auth.uid() order by created_at limit 1;
  if new.workspace_id is null then new.workspace_id:=private.create_workspace('My workspace'); end if;
 end if;
 return new;
end $$;
create trigger legacy_part_workspace before insert on public.parts for each row execute function private.legacy_part_workspace();
