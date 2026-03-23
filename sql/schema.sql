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

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete set null,
  nama text not null,
  email text unique not null,
  password_hash text not null,
  akses text not null check (akses in ('master','admin','guru','kasir','ob')),
  no_telepon text,
  menu_permissions jsonb not null default '[]'::jsonb,
  salary_type text not null default 'fixed' check (salary_type in ('fixed','guru_hybrid')),
  salary_fixed bigint not null default 0,
  student_fee_daily bigint not null default 0,
  monthly_bonus_target integer not null default 0,
  bonus_amount bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  deskripsi text,
  nominal bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists siswa (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete set null,
  nama text not null,
  program_id uuid references programs(id) on delete set null,
  kelas text,
  nama_ortu text,
  no_hp text,
  alamat text,
  kode_qr text unique,
  guru_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pembayaran (
  id uuid primary key default gen_random_uuid(),
  siswa_id uuid references siswa(id) on delete cascade,
  program_id uuid references programs(id) on delete set null,
  kasir_id uuid references users(id) on delete set null,
  tanggal date not null default current_date,
  nominal bigint not null default 0,
  status text not null default 'belum_lunas' check (status in ('lunas','belum_lunas')),
  metode_bayar text not null default 'cash' check (metode_bayar in ('cash','qris')),
  keterangan text,
  created_at timestamptz not null default now()
);

create table if not exists absensi_siswa (
  id uuid primary key default gen_random_uuid(),
  siswa_id uuid references siswa(id) on delete cascade,
  guru_handle_id uuid references users(id) on delete set null,
  tanggal date not null default current_date,
  status text not null default 'hadir' check (status in ('hadir','izin','sakit','alpha')),
  sumber text default 'manual',
  jam_masuk timestamptz,
  jam_pulang timestamptz,
  catatan text,
  created_at timestamptz not null default now(),
  unique (siswa_id, tanggal)
);

create table if not exists perkembangan (
  id uuid primary key default gen_random_uuid(),
  siswa_id uuid references siswa(id) on delete cascade,
  guru_id uuid references users(id) on delete set null,
  catatan text not null,
  tanggal date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists absensi_karyawan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  tanggal date not null default current_date,
  jam_datang timestamptz,
  jam_pulang timestamptz,
  status text not null default 'hadir' check (status in ('hadir','izin','sakit','alpha')),
  catatan text,
  created_at timestamptz not null default now(),
  unique (user_id, tanggal)
);

create table if not exists employee_bonus (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  bonus_date date not null default current_date,
  amount bigint not null default 0,
  description text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

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

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_branches_updated_at on branches;
create trigger trg_branches_updated_at before update on branches for each row execute function set_updated_at();
drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at before update on users for each row execute function set_updated_at();
drop trigger if exists trg_programs_updated_at on programs;
create trigger trg_programs_updated_at before update on programs for each row execute function set_updated_at();
drop trigger if exists trg_siswa_updated_at on siswa;
create trigger trg_siswa_updated_at before update on siswa for each row execute function set_updated_at();

create index if not exists idx_users_branch on users(branch_id);
create index if not exists idx_siswa_branch on siswa(branch_id);
create index if not exists idx_siswa_program on siswa(program_id);
create index if not exists idx_siswa_guru on siswa(guru_id);
create index if not exists idx_absensi_siswa_guru_handle on absensi_siswa(guru_handle_id);
create index if not exists idx_pembayaran_tanggal on pembayaran(tanggal desc);
create index if not exists idx_absensi_siswa_tanggal on absensi_siswa(tanggal desc);
create index if not exists idx_absensi_karyawan_tanggal on absensi_karyawan(tanggal desc);
create index if not exists idx_perkembangan_tanggal on perkembangan(tanggal desc);
create index if not exists idx_bonus_date on employee_bonus(bonus_date desc);
create index if not exists idx_reviews_period on employee_reviews(period_year desc, period_month desc);

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

insert into branches (nama, kode, alamat, employee_barcode_in, employee_barcode_out)
values
  ('Cabang Pusat', 'PUSAT', 'Jl. Pusat No. 1', 'ABSEN-MASUK', 'ABSEN-PULANG'),
  ('Cabang Timur', 'TIMUR', 'Jl. Timur No. 8', 'ABSEN-MASUK', 'ABSEN-PULANG')
on conflict (kode) do nothing;

insert into programs (nama, deskripsi, nominal)
values
  ('Matematika', 'Program matematika', 150000),
  ('Bahasa Inggris', 'Program speaking dan grammar', 175000),
  ('IPA', 'Program sains', 200000)
on conflict (nama) do nothing;

insert into users (branch_id, nama, email, password_hash, akses, no_telepon, menu_permissions, salary_type, salary_fixed, student_fee_daily, monthly_bonus_target, bonus_amount)
select b.id, 'Master Account', 'master@gmail.com', extensions.crypt('123456', extensions.gen_salt('bf')), 'master', '081234567890', '["overview","cabang","program","users","permissions","siswa","absensi_siswa","kasir","perkembangan","karyawan","review","laporan","payroll","download"]'::jsonb, 'fixed', 4500000, 0, 0, 0 from branches b where b.kode = 'PUSAT'
on conflict (email) do nothing;
insert into users (branch_id, nama, email, password_hash, akses, no_telepon, menu_permissions, salary_type, salary_fixed, student_fee_daily, monthly_bonus_target, bonus_amount)
select b.id, 'Admin Utama', 'admin@gmail.com', extensions.crypt('123456', extensions.gen_salt('bf')), 'admin', '081234567891', '["overview","program","users","permissions","siswa","absensi_siswa","kasir","perkembangan","karyawan","review","laporan","payroll","download"]'::jsonb, 'fixed', 3000000, 0, 0, 0 from branches b where b.kode = 'PUSAT'
on conflict (email) do nothing;
insert into users (branch_id, nama, email, password_hash, akses, no_telepon, menu_permissions, salary_type, salary_fixed, student_fee_daily, monthly_bonus_target, bonus_amount)
select b.id, 'Guru Demo', 'guru@bimbel.com', extensions.crypt('guru123', extensions.gen_salt('bf')), 'guru', '081234567892', '["overview","siswa","absensi_siswa","perkembangan","karyawan","laporan","download"]'::jsonb, 'guru_hybrid', 1500000, 10000, 80, 500000 from branches b where b.kode = 'PUSAT'
on conflict (email) do nothing;
insert into users (branch_id, nama, email, password_hash, akses, no_telepon, menu_permissions, salary_type, salary_fixed, student_fee_daily, monthly_bonus_target, bonus_amount)
select b.id, 'Kasir Demo', 'kasir@bimbel.com', extensions.crypt('kasir123', extensions.gen_salt('bf')), 'kasir', '081234567893', '["overview","kasir","karyawan","laporan","download"]'::jsonb, 'fixed', 2200000, 0, 0, 0 from branches b where b.kode = 'PUSAT'
on conflict (email) do nothing;
insert into users (branch_id, nama, email, password_hash, akses, no_telepon, menu_permissions, salary_type, salary_fixed, student_fee_daily, monthly_bonus_target, bonus_amount)
select b.id, 'OB Demo', 'ob@bimbel.com', extensions.crypt('ob12345', extensions.gen_salt('bf')), 'ob', '081234567894', '["overview","karyawan"]'::jsonb, 'fixed', 1800000, 0, 0, 0 from branches b where b.kode = 'PUSAT'
on conflict (email) do nothing;
