// === MENGAMBIL TANGGAL ASLI DARI HP/LAPTOP KASIR ===
export const TODAY = () => {
  const d = new Date();
  const year = d.getFullYear(); // Mengambil tahun lokal
  const month = String(d.getMonth() + 1).padStart(2, '0'); // Mengambil bulan lokal
  const day = String(d.getDate()).padStart(2, '0'); // Mengambil tanggal lokal
  return `${year}-${month}-${day}`;
}

export const NOW_ISO = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`; 
}
}
export const EMPLOYEE_GLOBAL_IN = 'ABSEN-MASUK'
export const EMPLOYEE_GLOBAL_OUT = 'ABSEN-PULANG'

export const TAB_LABELS = {
  overview: 'Overview',
  cabang: 'Cabang',
  program: 'Program',
  users: 'Karyawan',
  permissions: 'Hak Akses',
  siswa: 'Siswa',
  kasir: 'Kasir',
  perkembangan: 'Perkembangan Siswa',
  karyawan: 'Absensi Karyawan',
  review: 'Penilaian Karyawan',
  inventory: 'Inventory Barang',
  pengeluaran: 'Pengeluaran',
  laporan: 'Keuangan',
  payroll: 'Payroll',
  laporan_guru: 'Performa Guru',
  download: 'Download',
  maintenance: '⚙️ Maintenance',
}

export const ALL_MENU_KEYS = Object.keys(TAB_LABELS)
export const ACCESS_OPTIONS = ['master', 'admin', 'guru', 'kasir', 'ob']
export const PAYMENT_STATUS_OPTIONS = ['lunas', 'belum_lunas']
export const PAYMENT_METHOD_OPTIONS = ['cash', 'qris']
export const EMPLOYEE_SCAN_MODES = ['datang', 'pulang']
export const SALARY_TYPE_OPTIONS = ['fixed', 'guru_hybrid']
export const REPORT_RANGE_OPTIONS = ['harian', 'mingguan', 'bulanan']
export const EMPLOYEE_STATUS_OPTIONS = ['hadir', 'izin', 'sakit', 'alpha']
export const STUDENT_ATTENDANCE_MODES = ['masuk', 'pulang']

export const PENGELUARAN_KATEGORI_OPTIONS = ['Gaji Karyawan', 'Operasional', 'Listrik/Air', 'ATK', 'Lainnya']

export const INITIAL_BRANCH_FORM = { id: '', nama: '', kode: '', alamat: '', employee_barcode_in: EMPLOYEE_GLOBAL_IN, employee_barcode_out: EMPLOYEE_GLOBAL_OUT }
export const INITIAL_PROGRAM_FORM = { id: '', nama: '', deskripsi: '', nominal: '' }
export const INITIAL_USER_FORM = { id: '', nama: '', email: '', password: '', akses: 'GURU', branch_id: '', no_telepon: '', salary_type: 'fixed', salary_fixed: '', student_fee_daily: '', monthly_bonus_target: '', bonus_amount: '', menu_permissions: [], trial_ends_at: '', batas_jam_masuk: '08:00', batas_jam_pulang: '17:00' }
export const INITIAL_SISWA_FORM = { id: '', nama: '', branch_id: '', program_id: '', kelas: '', nama_ortu: '', no_hp: '', alamat: '', kode_qr: '', guru_id: '' }
export const INITIAL_PERKEMBANGAN_FORM = { siswa_id: '', guru_handle_id: '', catatan: '', tanggal: TODAY() }
export const INITIAL_KASIR_FORM = { status: 'lunas', nominal: '', diskon: '', diskon_tipe: 'nominal', nominal_bayar: '', keterangan: '', metode_bayar: 'cash', program_id: '', jenis_transaksi: 'program', inventory_id: '', cart: [] }
export const INITIAL_BONUS_FORM = { user_id: '', bonus_date: TODAY(), amount: '', description: '' }
export const INITIAL_EMPLOYEE_MANUAL_FORM = { user_id: '', tanggal: TODAY(), status: 'hadir', jam_datang: '', jam_pulang: '', catatan: '' }
export const INITIAL_STUDENT_ATTENDANCE_FORM = { siswa_id: '', guru_handle_id: '', tanggal: TODAY(), mode: 'masuk', status: 'hadir', catatan: '' }
export const INITIAL_REVIEW_FORM = { id: '', user_id: '', period_month: String(new Date().getMonth() + 1), period_year: String(new Date().getFullYear()), notes: '', items: [ { title: 'Disiplin', score: '8', note: '' }, { title: 'Kehadiran', score: '8', note: '' }, { title: 'Kinerja', score: '8', note: '' } ] }
export const INITIAL_PENGELUARAN_FORM = { id: '', tanggal: TODAY(), kategori: 'Operasional', keterangan: '', nominal: '', branch_id: '' }
export const INITIAL_INVENTORY_FORM = { id: '', nama: '', harga: '', stok: '', branch_id: '' }

export function defaultPermissionsByRole(akses) {
  const map = {
    master: ALL_MENU_KEYS,
    admin: ['overview', 'program', 'users', 'permissions', 'siswa', 'kasir', 'perkembangan', 'karyawan', 'review', 'inventory', 'pengeluaran', 'laporan', 'payroll', 'download'],
    guru: ['overview', 'siswa', 'perkembangan', 'karyawan', 'laporan', 'download'],
    kasir: ['overview', 'kasir', 'karyawan', 'inventory', 'pengeluaran', 'laporan', 'download'],
    ob: ['overview', 'karyawan'],
  }
  return [...(map[akses] || ['overview'])]
}

export function normalizePermissions(value, akses = 'admin') {
  if (Array.isArray(value) && value.length) return value
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed) && parsed.length) return parsed
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean)
    }
  }
  return defaultPermissionsByRole(akses)
}

export function allowedTabs(akses, menuPermissions) {
  const perms = normalizePermissions(menuPermissions, akses)
  return ALL_MENU_KEYS.filter((item) => perms.includes(item))
}
