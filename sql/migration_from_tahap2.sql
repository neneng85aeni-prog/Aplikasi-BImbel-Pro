create extension if not exists "pgcrypto";

create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  kode text not null unique,
  alamat text,
  employee_barcode_in text not null default 'ABSEN-MASUK',
  employee_barcode_out text not null default 'ABSEN-PULANG',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into branches (nama, kode, alamat)
values ('Cabang Pusat', 'PUSAT', 'Migrasi default')
on conflict (kode) do nothing;

alter table users add column if not exists branch_id uuid references branches(id) on delete set null;
alter table users add column if not exists salary_type text not null default 'fixed';
alter table users add column if not exists salary_fixed bigint not null default 0;
alter table users add column if not exists student_fee_daily bigint not null default 0;
alter table users add column if not exists monthly_bonus_target integer not null default 0;
alter table users add column if not exists bonus_amount bigint not null default 0;
alter table siswa add column if not exists branch_id uuid references branches(id) on delete set null;

update users set branch_id = (select id from branches where kode = 'PUSAT' limit 1) where branch_id is null;
update siswa set branch_id = (select id from branches where kode = 'PUSAT' limit 1) where branch_id is null;

create table if not exists employee_bonus (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  tanggal date not null default current_date,
  nominal bigint not null default 0,
  keterangan text,
  created_at timestamptz not null default now()
);

drop view if exists users_safe;
create or replace view users_safe as
select u.id, u.branch_id, u.nama, u.email, u.akses, u.salary_type, u.salary_fixed, u.student_fee_daily, u.monthly_bonus_target, u.bonus_amount, u.created_at, u.updated_at
from users u;

create or replace function app_login(p_email text, p_password text)
returns table(id uuid, branch_id uuid, nama text, email text, akses text, salary_type text, salary_fixed bigint, student_fee_daily bigint, monthly_bonus_target integer, bonus_amount bigint)
language sql
security definer
set search_path = public
as $$
  select u.id, u.branch_id, u.nama, u.email, u.akses, u.salary_type, u.salary_fixed, u.student_fee_daily, u.monthly_bonus_target, u.bonus_amount
  from users u
  where lower(u.email) = lower(trim(p_email))
    and u.password_hash = crypt(trim(p_password), u.password_hash)
  limit 1;
$$;

create or replace function app_upsert_user(
  p_id uuid,
  p_nama text,
  p_email text,
  p_password text,
  p_akses text,
  p_branch_id uuid,
  p_salary_type text,
  p_salary_fixed bigint,
  p_student_fee_daily bigint,
  p_monthly_bonus_target integer,
  p_bonus_amount bigint
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_id is null then
    insert into users (branch_id, nama, email, password_hash, akses, salary_type, salary_fixed, student_fee_daily, monthly_bonus_target, bonus_amount)
    values (
      p_branch_id,
      trim(p_nama),
      lower(trim(p_email)),
      crypt(coalesce(nullif(trim(p_password), ''), gen_random_uuid()::text), gen_salt('bf')),
      p_akses,
      coalesce(p_salary_type, 'fixed'),
      coalesce(p_salary_fixed, 0),
      coalesce(p_student_fee_daily, 0),
      coalesce(p_monthly_bonus_target, 0),
      coalesce(p_bonus_amount, 0)
    )
    returning id into v_id;
  else
    update users
    set branch_id = p_branch_id,
        nama = trim(p_nama),
        email = lower(trim(p_email)),
        akses = p_akses,
        salary_type = coalesce(p_salary_type, 'fixed'),
        salary_fixed = coalesce(p_salary_fixed, 0),
        student_fee_daily = coalesce(p_student_fee_daily, 0),
        monthly_bonus_target = coalesce(p_monthly_bonus_target, 0),
        bonus_amount = coalesce(p_bonus_amount, 0),
        password_hash = case when nullif(trim(coalesce(p_password, '')), '') is null then password_hash else crypt(trim(p_password), gen_salt('bf')) end
    where id = p_id
    returning id into v_id;
  end if;
  return v_id;
end;
$$;
