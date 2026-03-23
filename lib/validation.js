import { normalizePhone } from './format'

function required(value, label) {
  if (!String(value || '').trim()) throw new Error(`${label} wajib diisi.`)
}

export function validateBranchForm(form) {
  required(form.nama, 'Nama cabang')
  required(form.kode, 'Kode cabang')
  return {
    nama: form.nama.trim(),
    kode: form.kode.trim().toUpperCase(),
    alamat: String(form.alamat || '').trim(),
    employee_barcode_in: String(form.employee_barcode_in || '').trim(),
    employee_barcode_out: String(form.employee_barcode_out || '').trim(),
  }
}

export function validateProgramForm(form) {
  required(form.nama, 'Nama program')
  const nominal = Number(form.nominal || 0)
  if (Number.isNaN(nominal) || nominal < 0) throw new Error('Nominal program tidak valid.')
  return {
    nama: form.nama.trim(),
    deskripsi: String(form.deskripsi || '').trim(),
    nominal,
  }
}

export function validateUserForm(form) {
  required(form.nama, 'Nama user')
  required(form.email, 'Email')
  required(form.branch_id, 'Cabang')
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) throw new Error('Format email tidak valid.')
  if (!form.id && !String(form.password || '').trim()) throw new Error('Password wajib diisi untuk user baru.')
  if (form.password && String(form.password).trim().length < 6) throw new Error('Password minimal 6 karakter.')
  return {
    nama: form.nama.trim(),
    email: form.email.trim().toLowerCase(),
    password: String(form.password || '').trim(),
    akses: form.akses,
    branch_id: form.branch_id,
    no_telepon: normalizePhone(form.no_telepon),
    salary_type: form.salary_type,
    salary_fixed: Number(form.salary_fixed || 0),
    student_fee_daily: Number(form.student_fee_daily || 0),
    monthly_bonus_target: Number(form.monthly_bonus_target || 0),
    bonus_amount: Number(form.bonus_amount || 0),
    menu_permissions: Array.isArray(form.menu_permissions) ? form.menu_permissions : [],
  }
}

export function validateSiswaForm(form) {
  required(form.nama, 'Nama siswa')
  required(form.branch_id, 'Cabang')
  const noHp = normalizePhone(form.no_hp)
  if (noHp && noHp.length < 9) throw new Error('Nomor HP terlalu pendek.')
  return {
    nama: form.nama.trim(),
    branch_id: form.branch_id,
    program_id: form.program_id || null,
    kelas: String(form.kelas || '').trim(),
    nama_ortu: String(form.nama_ortu || '').trim(),
    no_hp: noHp,
    alamat: String(form.alamat || '').trim(),
    kode_qr: String(form.kode_qr || '').trim() || null,
    guru_id: form.guru_id || null,
  }
}

export function validatePerkembanganForm(form) {
  required(form.siswa_id, 'Siswa')
  required(form.catatan, 'Catatan perkembangan')
  required(form.tanggal, 'Tanggal')
  return {
    siswa_id: form.siswa_id,
    catatan: form.catatan.trim(),
    tanggal: form.tanggal,
  }
}

export function validateKasirForm(form, fallbackNominal = 0) {
  const nominal = Number(form.nominal || fallbackNominal || 0)
  if (Number.isNaN(nominal) || nominal < 0) throw new Error('Nominal pembayaran tidak valid.')
  return {
    status: form.status,
    nominal,
    keterangan: String(form.keterangan || '').trim(),
    metode_bayar: form.metode_bayar,
  }
}

export function validateBonusForm(form) {
  required(form.user_id, 'Karyawan')
  const amount = Number(form.amount || 0)
  if (Number.isNaN(amount) || amount <= 0) throw new Error('Nominal bonus tidak valid.')
  return {
    user_id: form.user_id,
    bonus_date: form.bonus_date,
    amount,
    description: String(form.description || '').trim(),
  }
}

export function validateEmployeeManualForm(form) {
  required(form.user_id, 'Karyawan')
  required(form.tanggal, 'Tanggal')
  return {
    user_id: form.user_id,
    tanggal: form.tanggal,
    status: form.status,
    jam_datang: form.jam_datang || null,
    jam_pulang: form.jam_pulang || null,
    catatan: String(form.catatan || '').trim(),
  }
}

export function validateStudentAttendanceForm(form) {
  required(form.siswa_id, 'Siswa')
  required(form.tanggal, 'Tanggal')
  return {
    siswa_id: form.siswa_id,
    guru_handle_id: form.guru_handle_id || null,
    tanggal: form.tanggal,
    mode: form.mode,
    status: form.status,
    catatan: String(form.catatan || '').trim(),
  }
}

export function validateReviewForm(form) {
  required(form.user_id, 'Karyawan')
  required(form.period_month, 'Bulan')
  required(form.period_year, 'Tahun')
  if (!Array.isArray(form.items) || !form.items.length) throw new Error('Tambahkan minimal satu poin penilaian.')
  const items = form.items
    .map((item) => ({
      title: String(item.title || '').trim(),
      score: Number(item.score || 0),
      note: String(item.note || '').trim(),
    }))
    .filter((item) => item.title)
  if (!items.length) throw new Error('Judul poin penilaian wajib diisi.')
  return {
    user_id: form.user_id,
    period_month: Number(form.period_month),
    period_year: Number(form.period_year),
    notes: String(form.notes || '').trim(),
    items,
  }
}
