import { supabase } from './supabase'

// Tambahkan rumus ini untuk menyulap teks kosong ("") menjadi null
const toNull = (val) => (val === '' || val === undefined || val === null) ? null : val;
export async function fetchAllData() {
  const [
    branchesRes,
    programsRes,
    usersRes,
    siswaRes,
    pembayaranRes,
    absensiSiswaRes,
    perkembanganRes,
    absensiKaryawanRes,
    bonusRes,
    reviewRes,
    reviewItemsRes,
    pengeluaranRes,
    inventoryRes
  ] = await Promise.all([
    supabase.from('branches').select('*').order('created_at', { ascending: true }),
    supabase.from('programs').select('*').order('created_at', { ascending: false }),
    supabase.from('users_safe').select('*').order('created_at', { ascending: false }),
    supabase.from('siswa').select('*').order('created_at', { ascending: false }),
    supabase.from('pembayaran').select('*').order('created_at', { ascending: false }),
    supabase.from('absensi_siswa').select('*').order('created_at', { ascending: false }),
    supabase.from('perkembangan').select('*').order('created_at', { ascending: false }),
    supabase.from('absensi_karyawan').select('*').order('created_at', { ascending: false }),
    supabase.from('employee_bonus_safe').select('*').order('bonus_date', { ascending: false }),
    supabase.from('employee_reviews').select('*').order('created_at', { ascending: false }),
    supabase.from('employee_review_items').select('*').order('created_at', { ascending: true }),
    supabase.from('pengeluaran').select('*').order('tanggal', { ascending: false }),
    supabase.from('inventory').select('*').order('nama', { ascending: true }),
  ])

  const firstError =
    branchesRes.error ||
    programsRes.error ||
    usersRes.error ||
    siswaRes.error ||
    pembayaranRes.error ||
    absensiSiswaRes.error ||
    perkembanganRes.error ||
    absensiKaryawanRes.error ||
    bonusRes.error ||
    reviewRes.error ||
    reviewItemsRes.error ||
    pengeluaranRes.error ||
    inventoryRes.error

  if (firstError) throw firstError

  const branches = branchesRes.data || []
  const programs = programsRes.data || []
  const users = usersRes.data || []
  const branchMap = new Map(branches.map((item) => [item.id, item]))
  const programMap = new Map(programs.map((item) => [item.id, item]))
  const userMap = new Map(users.map((item) => [item.id, item]))

  const siswa = (siswaRes.data || []).map((item) => {
    const branch = branchMap.get(item.branch_id) || null
    const program = programMap.get(item.program_id) || null
    const guru = userMap.get(item.guru_id) || null
    return {
      ...item,
      branches: branch,
      programs: program,
      users: guru,
      branch_nama: branch?.nama || '-',
      guru_default_nama: guru?.nama || '-',
    }
  })
  const siswaMap = new Map(siswa.map((item) => [item.id, item]))

  const pembayaran = (pembayaranRes.data || []).map((item) => ({
    ...item,
    siswa: siswaMap.get(item.siswa_id) || null,
    programs: programMap.get(item.program_id) || null,
    users: userMap.get(item.kasir_id) || null,
    branch_id: (siswaMap.get(item.siswa_id) || {}).branch_id || (userMap.get(item.kasir_id) || {}).branch_id || null,
  }))

  const perkembangan = (perkembanganRes.data || []).map((item) => ({
    ...item,
    siswa: siswaMap.get(item.siswa_id) || null,
    users: userMap.get(item.guru_id) || null,
    branch_id: (siswaMap.get(item.siswa_id) || {}).branch_id || null,
  }))

  const absensiSiswa = (absensiSiswaRes.data || []).map((item) => ({
    ...item,
    siswa: siswaMap.get(item.siswa_id) || null,
    branch_id: (siswaMap.get(item.siswa_id) || {}).branch_id || null,
    guru_handle: userMap.get(item.guru_handle_id) || null,
  }))

  const absensiKaryawan = (absensiKaryawanRes.data || []).map((item) => ({
    ...item,
    users: userMap.get(item.user_id) || null,
    branch_id: (userMap.get(item.user_id) || {}).branch_id || null,
  }))

  const reviewItems = reviewItemsRes.data || []
  const reviews = (reviewRes.data || []).map((item) => ({
    ...item,
    user: userMap.get(item.user_id) || null,
    reviewer: userMap.get(item.reviewer_id) || null,
    branch_id: (userMap.get(item.user_id) || {}).branch_id || null,
    items: reviewItems.filter((row) => row.review_id === item.id),
  }))

  const pengeluaran = (pengeluaranRes.data || []).map((item) => ({
    ...item,
    branches: branchMap.get(item.branch_id) || null,
    users: userMap.get(item.user_id) || null,
  }))

  const inventory = (inventoryRes.data || []).map((item) => ({
    ...item,
    branches: branchMap.get(item.branch_id) || null,
  }))

  return {
    branches,
    programs,
    users,
    siswa,
    pembayaran,
    absensiSiswa,
    perkembangan,
    absensiKaryawan,
    bonusManual: bonusRes.data || [],
    reviews,
    pengeluaran,
    inventory,
  }
}

export async function upsertBranch(form, id) {
  const payload = { ...form }
  if (!payload.id) delete payload.id // Hapus string kosong dari ID
  return id ? supabase.from('branches').update(payload).eq('id', id) : supabase.from('branches').insert(payload)
}

export async function upsertProgram(form, id) {
  const payload = { ...form }
  if (!payload.id) delete payload.id // Hapus string kosong dari ID
  return id ? supabase.from('programs').update(payload).eq('id', id) : supabase.from('programs').insert(payload)
}

export async function removeById(table, id) {
  return supabase.from(table).delete().eq('id', id)
}

export async function upsertSiswa(form, id) {
  const payload = { 
    ...form,
    branch_id: toNull(form.branch_id),
    program_id: toNull(form.program_id),
    guru_id: toNull(form.guru_id)
  }
  if (!payload.id) delete payload.id 
  return id ? supabase.from('siswa').update(payload).eq('id', id) : supabase.from('siswa').insert(payload)
}

export async function savePerkembangan(payload) {
  // Bersihkan ID yang kosong
  const safePayload = {
    ...payload,
    siswa_id: toNull(payload.siswa_id),
    guru_id: toNull(payload.guru_id)
  }

  const existingRes = await supabase
    .from('perkembangan')
    .select('id')
    .eq('siswa_id', safePayload.siswa_id)
    .eq('tanggal', safePayload.tanggal)
    .limit(1)

  if (existingRes.error) return { error: existingRes.error }

  const existing = Array.isArray(existingRes.data) ? existingRes.data[0] : null
  if (existing?.id) {
    return supabase
      .from('perkembangan')
      .update({ guru_id: safePayload.guru_id, catatan: safePayload.catatan, tanggal: safePayload.tanggal })
      .eq('id', existing.id)
  }

  return supabase.from('perkembangan').insert(safePayload)
}

export async function saveBonus(payload) {
  return supabase.from('employee_bonus').insert(payload)
}

export async function saveReview(payload) {
  const { data, error } = await supabase.from('employee_reviews').insert({
    user_id: payload.user_id,
    reviewer_id: payload.reviewer_id,
    period_month: payload.period_month,
    period_year: payload.period_year,
    notes: payload.notes,
  }).select('id').single()
  if (error) return { error }
  const itemsPayload = payload.items.map((item) => ({
    review_id: data.id,
    title: item.title,
    score: item.score,
    note: item.note,
  }))
  const itemsRes = await supabase.from('employee_review_items').insert(itemsPayload)
  if (itemsRes.error) return { error: itemsRes.error }
  return { data }
}

export async function saveUserPermissions(userId, menuPermissions) {
  return supabase.from('users').update({ menu_permissions: menuPermissions }).eq('id', userId)
}


export async function upsertUserViaRpc(form, id) {
  // RPC ini sangat ketat, semua parameter harus sesuai tipe data di SQL
  return supabase.rpc('app_upsert_user', {
    p_id: toNull(id),
    p_nama: form.nama,
    p_email: form.email,
    p_password: toNull(form.password),
    p_akses: toNull(form.akses),
    p_branch_id: toNull(form.branch_id),
    p_no_telepon: toNull(form.no_telepon),
    p_salary_type: form.salary_type || 'fixed',
    p_salary_fixed: Number(form.salary_fixed) || 0,
    p_student_fee_daily: Number(form.student_fee_daily) || 0,
    p_monthly_bonus_target: Number(form.monthly_bonus_target) || 0,
    p_bonus_amount: Number(form.bonus_amount) || 0,
    p_menu_permissions: form.menu_permissions || [],
    p_trial_ends_at: toNull(form.trial_ends_at),
    p_batas_jam_masuk: toNull(form.batas_jam_masuk),
    p_batas_jam_pulang: toNull(form.batas_jam_pulang)
  })
}

export async function saveKasirTransaction(payload) {
  return supabase.rpc('app_save_kasir_transaction', payload)
}

export async function saveEmployeeAttendance(payload) {
  return supabase.rpc('app_scan_karyawan', payload)
}

export async function saveEmployeeManualAttendance(payload) {
  return supabase.rpc('app_save_employee_manual', payload)
}

export async function saveStudentAttendance(payload) {
  return supabase.rpc('app_save_student_attendance', payload)
}

export async function saveStudentCheckout(payload) {
  return supabase.rpc('app_save_student_attendance', {
    p_siswa_id: payload.p_siswa_id,
    p_guru_handle_id: payload.p_guru_handle_id || null,
    p_tanggal: payload.p_tanggal,
    p_mode: 'pulang',
    p_status: 'hadir',
    p_catatan: payload.p_catatan,
    p_sumber: 'guru_scan_pulang',
  })
}

export async function updatePembayaran(id, payload) {
  return supabase.from('pembayaran').update(payload).eq('id', id)
}

export async function savePengeluaran(payload) {
  return supabase.from('pengeluaran').insert(payload)
}

export async function updatePengeluaran(id, payload) {
  return supabase.from('pengeluaran').update(payload).eq('id', id)
}

export async function upsertInventory(form, id) {
  const payload = { ...form }
  if (!payload.id) delete payload.id // Hapus string kosong dari ID
  return id ? supabase.from('inventory').update(payload).eq('id', id) : supabase.from('inventory').insert(payload)
}

export async function updateInventoryStock(id, newStock) {
  return supabase.from('inventory').update({ stok: newStock }).eq('id', id)
}
