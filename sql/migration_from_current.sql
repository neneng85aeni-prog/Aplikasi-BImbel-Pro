create extension if not exists "pgcrypto";

create table if not exists employee_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  reviewer_id uuid references users(id) on delete set null,
  period_month integer not null,
  period_year integer not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists employee_review_items (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references employee_reviews(id) on delete cascade,
  title text not null,
  score numeric(5,2) not null default 0,
  note text,
  created_at timestamptz not null default now()
);

alter table users add column if not exists no_telepon text;
alter table users add column if not exists menu_permissions jsonb not null default '[]'::jsonb;
alter table siswa add column if not exists alamat text;
alter table absensi_siswa add column if not exists guru_handle_id uuid references users(id) on delete set null;
alter table employee_bonus add column if not exists branch_id uuid references branches(id) on delete set null;
alter table employee_bonus add column if not exists bonus_date date not null default current_date;
alter table employee_bonus add column if not exists amount bigint not null default 0;
alter table employee_bonus add column if not exists description text;
alter table employee_bonus add column if not exists created_by uuid references users(id) on delete set null;

update users set menu_permissions = '["overview"]'::jsonb where menu_permissions = '[]'::jsonb;
update users set menu_permissions = '["overview","cabang","program","users","permissions","siswa","absensi_siswa","kasir","perkembangan","karyawan","review","laporan","payroll","download"]'::jsonb where akses = 'master' and (menu_permissions is null or menu_permissions = '[]'::jsonb);
update users set menu_permissions = '["overview","program","users","permissions","siswa","absensi_siswa","kasir","perkembangan","karyawan","review","laporan","payroll","download"]'::jsonb where akses = 'admin' and (menu_permissions is null or menu_permissions = '[]'::jsonb);
update users set menu_permissions = '["overview","siswa","absensi_siswa","perkembangan","karyawan","laporan","download"]'::jsonb where akses = 'guru' and (menu_permissions is null or menu_permissions = '[]'::jsonb);
update users set menu_permissions = '["overview","kasir","karyawan","laporan","download"]'::jsonb where akses = 'kasir' and (menu_permissions is null or menu_permissions = '[]'::jsonb);
update users set menu_permissions = '["overview","karyawan"]'::jsonb where akses = 'ob' and (menu_permissions is null or menu_permissions = '[]'::jsonb);

update employee_bonus set bonus_date = coalesce(bonus_date, tanggal);
update employee_bonus set amount = coalesce(nullif(amount, 0), nominal);
update employee_bonus set description = coalesce(description, keterangan);

create or replace view users_safe as
select u.id, u.branch_id, b.nama as branch_nama, u.nama, u.email, u.akses, u.no_telepon, u.menu_permissions, u.salary_type, u.salary_fixed, u.student_fee_daily, u.monthly_bonus_target, u.bonus_amount, u.created_at, u.updated_at
from users u
left join branches b on b.id = u.branch_id;

create or replace view employee_bonus_safe as
select eb.id, eb.user_id, u.nama as user_nama, eb.branch_id, b.nama as branch_nama, eb.bonus_date, eb.amount, eb.description, eb.created_by, cu.nama as created_by_nama, eb.created_at
from employee_bonus eb
left join users u on u.id = eb.user_id
left join users cu on cu.id = eb.created_by
left join branches b on b.id = eb.branch_id;

create or replace view users_safe as
select u.id, u.branch_id, b.nama as branch_nama, u.nama, u.email, u.akses, u.no_telepon, u.menu_permissions, u.salary_type, u.salary_fixed, u.student_fee_daily, u.monthly_bonus_target, u.bonus_amount, u.created_at, u.updated_at
from users u
left join branches b on b.id = u.branch_id;

create or replace view employee_bonus_safe as
select eb.id, eb.user_id, u.nama as user_nama, eb.branch_id, b.nama as branch_nama, eb.bonus_date, eb.amount, eb.description, eb.created_by, cu.nama as created_by_nama, eb.created_at
from employee_bonus eb
left join users u on u.id = eb.user_id
left join users cu on cu.id = eb.created_by
left join branches b on b.id = eb.branch_id;

alter table branches enable row level security;
alter table users enable row level security;
alter table programs enable row level security;
alter table siswa enable row level security;
alter table pembayaran enable row level security;
alter table absensi_siswa enable row level security;
alter table perkembangan enable row level security;
alter table absensi_karyawan enable row level security;
alter table employee_bonus enable row level security;
alter table employee_reviews enable row level security;
alter table employee_review_items enable row level security;

drop policy if exists branches_all on branches;
create policy branches_all on branches for all to anon, authenticated using (true) with check (true);
drop policy if exists users_all on users;
create policy users_all on users for all to anon, authenticated using (true) with check (true);
drop policy if exists programs_all on programs;
create policy programs_all on programs for all to anon, authenticated using (true) with check (true);
drop policy if exists siswa_all on siswa;
create policy siswa_all on siswa for all to anon, authenticated using (true) with check (true);
drop policy if exists pembayaran_all on pembayaran;
create policy pembayaran_all on pembayaran for all to anon, authenticated using (true) with check (true);
drop policy if exists absensi_siswa_all on absensi_siswa;
create policy absensi_siswa_all on absensi_siswa for all to anon, authenticated using (true) with check (true);
drop policy if exists perkembangan_all on perkembangan;
create policy perkembangan_all on perkembangan for all to anon, authenticated using (true) with check (true);
drop policy if exists absensi_karyawan_all on absensi_karyawan;
create policy absensi_karyawan_all on absensi_karyawan for all to anon, authenticated using (true) with check (true);
drop policy if exists employee_bonus_all on employee_bonus;
create policy employee_bonus_all on employee_bonus for all to anon, authenticated using (true) with check (true);
drop policy if exists employee_reviews_all on employee_reviews;
create policy employee_reviews_all on employee_reviews for all to anon, authenticated using (true) with check (true);
drop policy if exists employee_review_items_all on employee_review_items;
create policy employee_review_items_all on employee_review_items for all to anon, authenticated using (true) with check (true);

grant select on users_safe to anon, authenticated;
grant select on employee_bonus_safe to anon, authenticated;

create or replace function app_login(p_email text, p_password text)
returns table(id uuid, branch_id uuid, nama text, email text, akses text, no_telepon text, menu_permissions jsonb, salary_type text, salary_fixed bigint, student_fee_daily bigint, monthly_bonus_target integer, bonus_amount bigint)
language sql
security definer
set search_path = public
as $$
  select u.id, u.branch_id, u.nama, u.email, u.akses, u.no_telepon, u.menu_permissions, u.salary_type, u.salary_fixed, u.student_fee_daily, u.monthly_bonus_target, u.bonus_amount
  from users u
  where lower(u.email) = lower(trim(p_email))
    and u.password_hash = extensions.crypt(trim(p_password), u.password_hash)
  limit 1;
$$;

grant execute on function app_login(text, text) to anon, authenticated;

create or replace function app_upsert_user(
  p_id uuid,
  p_nama text,
  p_email text,
  p_password text,
  p_akses text,
  p_branch_id uuid,
  p_no_telepon text,
  p_salary_type text,
  p_salary_fixed bigint,
  p_student_fee_daily bigint,
  p_monthly_bonus_target integer,
  p_bonus_amount bigint,
  p_menu_permissions jsonb
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
    insert into users (branch_id, nama, email, password_hash, akses, no_telepon, menu_permissions, salary_type, salary_fixed, student_fee_daily, monthly_bonus_target, bonus_amount)
    values (
      p_branch_id,
      trim(p_nama),
      lower(trim(p_email)),
      extensions.crypt(coalesce(nullif(trim(p_password), ''), gen_random_uuid()::text), extensions.gen_salt('bf')),
      p_akses,
      nullif(trim(coalesce(p_no_telepon, '')), ''),
      coalesce(p_menu_permissions, '[]'::jsonb),
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
        no_telepon = nullif(trim(coalesce(p_no_telepon, '')), ''),
        menu_permissions = coalesce(p_menu_permissions, menu_permissions),
        salary_type = coalesce(p_salary_type, 'fixed'),
        salary_fixed = coalesce(p_salary_fixed, 0),
        student_fee_daily = coalesce(p_student_fee_daily, 0),
        monthly_bonus_target = coalesce(p_monthly_bonus_target, 0),
        bonus_amount = coalesce(p_bonus_amount, 0),
        password_hash = case when nullif(trim(coalesce(p_password, '')), '') is null then password_hash else extensions.crypt(trim(p_password), extensions.gen_salt('bf')) end
    where id = p_id
    returning id into v_id;
  end if;

  return v_id;
end;
$$;

grant execute on function app_upsert_user(uuid, text, text, text, text, uuid, text, text, bigint, bigint, integer, bigint, jsonb) to anon, authenticated;

create or replace function app_save_kasir_transaction(
  p_siswa_id uuid,
  p_program_id uuid,
  p_kasir_id uuid,
  p_tanggal date,
  p_nominal bigint,
  p_status text,
  p_metode_bayar text,
  p_keterangan text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pembayaran_id uuid;
begin
  insert into pembayaran (siswa_id, program_id, kasir_id, tanggal, nominal, status, metode_bayar, keterangan)
  values (p_siswa_id, p_program_id, p_kasir_id, p_tanggal, p_nominal, p_status, p_metode_bayar, p_keterangan)
  returning id into v_pembayaran_id;

  return v_pembayaran_id;
end;
$$;

grant execute on function app_save_kasir_transaction(uuid, uuid, uuid, date, bigint, text, text, text) to anon, authenticated;

create or replace function app_save_student_attendance(
  p_siswa_id uuid,
  p_guru_handle_id uuid,
  p_tanggal date,
  p_mode text,
  p_status text,
  p_catatan text,
  p_sumber text default 'manual'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into absensi_siswa (siswa_id, guru_handle_id, tanggal, status, sumber, jam_masuk, jam_pulang, catatan)
  values (
    p_siswa_id,
    p_guru_handle_id,
    p_tanggal,
    coalesce(p_status, 'hadir'),
    coalesce(p_sumber, 'manual'),
    case when p_mode = 'masuk' and coalesce(p_status, 'hadir') = 'hadir' then now() else null end,
    case when p_mode = 'pulang' and coalesce(p_status, 'hadir') = 'hadir' then now() else null end,
    p_catatan
  )
  on conflict (siswa_id, tanggal)
  do update set
    guru_handle_id = coalesce(excluded.guru_handle_id, absensi_siswa.guru_handle_id),
    status = excluded.status,
    sumber = excluded.sumber,
    jam_masuk = case when p_mode = 'masuk' and coalesce(p_status, 'hadir') = 'hadir' then coalesce(absensi_siswa.jam_masuk, excluded.jam_masuk) else absensi_siswa.jam_masuk end,
    jam_pulang = case when p_mode = 'pulang' and coalesce(p_status, 'hadir') = 'hadir' then coalesce(absensi_siswa.jam_pulang, excluded.jam_pulang) else absensi_siswa.jam_pulang end,
    catatan = excluded.catatan
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function app_save_student_attendance(uuid, uuid, date, text, text, text, text) to anon, authenticated;

create or replace function app_scan_karyawan(
  p_user_id uuid,
  p_tanggal date,
  p_mode text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into absensi_karyawan (user_id, tanggal, jam_datang, jam_pulang, status, catatan)
  values (
    p_user_id,
    p_tanggal,
    case when p_mode = 'datang' then now() else null end,
    case when p_mode = 'pulang' then now() else null end,
    'hadir',
    case when p_mode = 'datang' then 'Scan datang via barcode global pintu' else 'Scan pulang via barcode global pintu' end
  )
  on conflict (user_id, tanggal)
  do update set
    jam_datang = case when p_mode = 'datang' then coalesce(absensi_karyawan.jam_datang, excluded.jam_datang) else absensi_karyawan.jam_datang end,
    jam_pulang = case when p_mode = 'pulang' then coalesce(absensi_karyawan.jam_pulang, excluded.jam_pulang) else absensi_karyawan.jam_pulang end,
    status = 'hadir',
    catatan = case when p_mode = 'datang' then 'Scan datang via barcode global pintu' else 'Scan pulang via barcode global pintu' end
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function app_scan_karyawan(uuid, date, text) to anon, authenticated;

create or replace function app_save_employee_manual(
  p_user_id uuid,
  p_tanggal date,
  p_status text,
  p_jam_datang timestamptz,
  p_jam_pulang timestamptz,
  p_catatan text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into absensi_karyawan (user_id, tanggal, jam_datang, jam_pulang, status, catatan)
  values (p_user_id, p_tanggal, p_jam_datang, p_jam_pulang, coalesce(p_status, 'hadir'), p_catatan)
  on conflict (user_id, tanggal)
  do update set
    jam_datang = excluded.jam_datang,
    jam_pulang = excluded.jam_pulang,
    status = excluded.status,
    catatan = excluded.catatan
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function app_save_employee_manual(uuid, date, text, timestamptz, timestamptz, text) to anon, authenticated;
