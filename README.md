# Bimbel Pro Final Upgrade (Anon Ready)

Versi ini fokus pada operasional stabil dengan anon key + RLS permisif untuk testing/internal.

## Fitur utama
- multi cabang
- UI premium modern SaaS
- hak akses menu per user (checklist)
- absensi siswa terpisah dari kasir
- guru default + guru handle harian dinamis
- absensi karyawan scan + manual + keterangan
- alamat siswa + no telepon karyawan
- payroll + bonus
- penilaian karyawan dinamis + print profesional
- laporan keuangan pemasukan vs pengeluaran
- barcode siswa otomatis + print
- barcode global karyawan per cabang

## Login demo (fresh install)
- master@gmail.com / 123456
- admin@gmail.com / 123456
- guru@bimbel.com / guru123
- kasir@bimbel.com / kasir123
- ob@bimbel.com / ob12345

## SQL
### Fresh install
Jalankan:
- `sql/schema.sql`

### Jika database sudah dari versi sebelumnya
Jalankan:
- `sql/migration_from_current.sql`

> Catatan: untuk environment Supabase tertentu, fungsi hash memakai `extensions.crypt(...)` dan `extensions.gen_salt(...)`.

## Env
Isi `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Catatan jujur
Versi ini disusun agar siap dicopy ke project lama dan lebih dekat ke kebutuhan operasional real. Namun tetap perlu testing lokal dan testing alur database sebelum dipakai penuh di production.
