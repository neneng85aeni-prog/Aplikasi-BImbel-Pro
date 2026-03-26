import { buildCsv } from './format'

function getDateField(exportType) {
  return {
    branches: null,
    siswa: 'created_at',
    guru: 'created_at',
    karyawan: 'created_at',
    program: 'created_at',
    pembayaran: 'tanggal',
    absensi_siswa: 'tanggal',
    absensi_karyawan: 'tanggal',
    perkembangan: 'tanggal',
    payroll: null,
  }[exportType] || null
}

function inRange(value, dateFrom, dateTo) {
  if (!value) return true
  const current = String(value).slice(0, 10)
  if (dateFrom && current < dateFrom) return false
  if (dateTo && current > dateTo) return false
  return true
}

export function exportRows({ exportType, branches, siswa, users, programs, pembayaran, absensiSiswa, absensiKaryawan, perkembangan, payrollRows, dateFrom, dateTo }) {
  const map = {
    branches: branches.map((item) => ({ nama: item.nama, kode: item.kode, alamat: item.alamat, barcode_in: item.employee_barcode_in, barcode_out: item.employee_barcode_out, dibuat: item.created_at })),
    siswa: siswa.map((item) => ({ nama: item.nama, cabang: item.branch_nama || item.branches?.nama, program: item.programs?.nama, kelas: item.kelas, orang_tua: item.nama_ortu, no_hp: item.no_hp, alamat: item.alamat, barcode: item.kode_qr, dibuat: item.created_at })),
    guru: users.filter((item) => item.akses === 'guru').map((item) => ({ nama: item.nama, email: item.email, cabang: item.branch_nama, salary_fixed: item.salary_fixed, student_fee_daily: item.student_fee_daily, dibuat: item.created_at })),
    karyawan: users.map((item) => ({ nama: item.nama, email: item.email, akses: item.akses, cabang: item.branch_nama, salary_fixed: item.salary_fixed, student_fee_daily: item.student_fee_daily, bonus_amount: item.bonus_amount, no_telepon: item.no_telepon, dibuat: item.created_at })),
    program: programs.map((item) => ({ nama: item.nama, deskripsi: item.deskripsi, nominal: item.nominal, dibuat: item.created_at })),
    pembayaran: pembayaran.map((item) => {
      // 1. Coba ambil nama program dari transaksi (jika ada)
      let namaProgram = item.programs?.nama;
      
      // 2. Jika tidak ada, ambil dari data siswa
      if (!namaProgram && item.siswa) {
        namaProgram = item.siswa.programs?.nama;
      }
      
      // 3. Jika di siswa juga tidak ada (misal siswa lama), pakai strip
      if (!namaProgram) {
        namaProgram = '-';
      }

      return {
        tanggal: item.tanggal, 
        siswa: item.siswa?.nama || '-', 
        program: namaProgram, // <--- Menggunakan variabel di atas
        nominal: item.nominal, 
        status: item.status, 
        metode: item.metode_bayar, 
        cabang: item.siswa?.branch_nama || item.users?.branch_nama || '-'
      }
    }),
    absensi_siswa: absensiSiswa.map((item) => ({ tanggal: item.tanggal, siswa: item.siswa?.nama, guru_handle: item.guru_handle?.nama, status: item.status, jam_masuk: item.jam_masuk, jam_pulang: item.jam_pulang, cabang: item.siswa?.branch_nama || '-' })),
    absensi_karyawan: absensiKaryawan.map((item) => ({ tanggal: item.tanggal, karyawan: item.users?.nama, akses: item.users?.akses, status: item.status, catatan: item.catatan, jam_datang: item.jam_datang, jam_pulang: item.jam_pulang, cabang: item.users?.branch_nama || '-' })),
    perkembangan: perkembangan.map((item) => ({ tanggal: item.tanggal, siswa: item.siswa?.nama, guru: item.users?.nama, catatan: item.catatan, cabang: item.siswa?.branch_nama || '-' })),
    payroll: payrollRows.map((item) => ({ nama: item.nama, akses: item.akses, siswa_tertangani: item.studentHandled, gaji_pokok: item.gajiPokok, fee_siswa: item.gajiSiswa, bonus_otomatis: item.bonusOtomatis, bonus_manual: item.bonusManual, total_gaji: item.totalGaji })),
  }

  const rows = map[exportType] || []
  const dateField = getDateField(exportType)
  return dateField ? rows.filter((row) => inRange(row[dateField], dateFrom, dateTo)) : rows
}

export function downloadCsv(filename, rows) {
  const csv = buildCsv(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
