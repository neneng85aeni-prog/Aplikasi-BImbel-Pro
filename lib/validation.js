export function validateBranchForm(form) {
  if (!form.nama || !form.kode) throw new Error('Nama dan Kode cabang wajib diisi.')
  return form
}

export function validateProgramForm(form) {
  if (!form.nama || !form.nominal) throw new Error('Nama program dan nominal wajib diisi.')
  return form
}

export function validateUserForm(form) {
  if (!form.nama || !form.email) throw new Error('Nama dan Email wajib diisi.')
  if (!form.id && !form.password) throw new Error('Password wajib diisi untuk karyawan baru.')
  return form
}

export function validateSiswaForm(form) {
  if (!form.nama || !form.branch_id) throw new Error('Nama siswa dan Cabang wajib diisi.')
  return form
}

export function validateKasirForm(form, suggestion) {
  if (!form.nominal || Number(form.nominal) <= 0) {
    throw new Error(`Nominal harus diisi (Saran: ${suggestion || 0})`)
  }
  return { ...form, nominal: Number(form.nominal) }
}

export function validatePerkembanganForm(form) {
  if (!form.siswa_id || !form.catatan) throw new Error('Pilih siswa dan isi catatan perkembangan.')
  return form
}

export function validateStudentAttendanceForm(form) {
  if (!form.siswa_id || !form.tanggal) throw new Error('Data absensi siswa tidak lengkap.')
  return form
}

export function validateEmployeeManualForm(form) {
  if (!form.user_id || !form.tanggal || !form.status) throw new Error('Data absensi manual tidak lengkap.')
  return form
}

export function validateBonusForm(form) {
  if (!form.user_id || !form.amount) throw new Error('Pilih karyawan dan isi nominal bonus.')
  return form
}

export function validateReviewForm(form) {
  if (!form.user_id || form.items.length === 0) throw new Error('Pilih karyawan dan isi minimal satu poin penilaian.')
  return form
}
