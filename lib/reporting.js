import { startOfDay, startOfMonth, startOfWeek } from './format'

// === FUNGSI BARU UNTUK MEMAKSA TANGGAL LOKAL (WIB) ===
function getWibTodayKey() {
  const wibTime = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
  const year = wibTime.getUTCFullYear();
  const month = String(wibTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(wibTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
// =====================================================
function safeDate(value) {
  return new Date(value || Date.now())
}

export function filterByUserBranch(items, user, branchField = 'branch_id') {
  if (!user || user.akses === 'master' || !user.branch_id) return items
  return items.filter((item) => item?.[branchField] === user.branch_id || item?.siswa?.branch_id === user.branch_id || item?.users?.branch_id === user.branch_id || item?.branch_id === user.branch_id)
}

export function computeOverview({ pembayaran = [], pengeluaran = [], siswa = [], users = [], branches = [], payrollRows = [], targetDate = new Date() }) {
  const now = safeDate(targetDate)
  const monthStart = startOfMonth(now)
  const bulanan = pembayaran.filter((item) => safeDate(item.tanggal) >= monthStart)
  const pengeluaranBulanan = pengeluaran.filter((item) => safeDate(item.tanggal) >= monthStart)
  
  const sum = (rows) => rows.reduce((acc, row) => acc + Number(row.nominal || 0), 0)
  const totalPemasukan = sum(bulanan)
  const totalPengeluaran = sum(pengeluaranBulanan)

  // === TAMBAHAN BARU: Menghitung sebaran program siswa untuk Grafik Donat ===
  const distributionMap = {};
  siswa.forEach(s => {
    // Ambil nama program dari relasi database atau anggap 'Lainnya'
    const progName = s.programs?.nama || s.programNama || 'Lainnya';
    distributionMap[progName] = (distributionMap[progName] || 0) + 1;
  });

  const studentDistribution = Object.keys(distributionMap).map(key => ({
    name: key,
    value: distributionMap[key]
  }));
  // =========================================================================

  return {
    totalSiswa: siswa.length,
    totalKaryawan: users.length,
    totalCabang: branches.length,
    pemasukanBulanan: totalPemasukan,
    pengeluaranBulanan: totalPengeluaran,
    labaBulanan: totalPemasukan - totalPengeluaran,
    
    // Alias untuk dibaca oleh Grafik OverviewTab
    monthlyRevenue: totalPemasukan,
    monthlyExpense: totalPengeluaran,
    studentDistribution: studentDistribution
  }
}

export function buildFinanceSummary(pembayaran = [], pengeluaran = [], payrollRows = [], bonusManual = [], branches = []) {
  const now = new Date()
  const todayKey = getWibTodayKey()
  const weekStart = startOfWeek(now)
  const monthStart = startOfMonth(now)
  
  const summarizeIncome = (rows) => ({
    total: rows.reduce((acc, item) => acc + Number(item.nominal || 0), 0),
    transaksi: rows.length,
    cash: rows.filter((item) => item.metode_bayar === 'cash').reduce((acc, item) => acc + Number(item.nominal || 0), 0),
    qris: rows.filter((item) => item.metode_bayar === 'qris').reduce((acc, item) => acc + Number(item.nominal || 0), 0),
  })

  const summarizeExpense = (rows) => rows.reduce((acc, item) => acc + Number(item.nominal || 0), 0)
  
  const income = {
    harian: summarizeIncome(pembayaran.filter((item) => item.tanggal === todayKey)),
    mingguan: summarizeIncome(pembayaran.filter((item) => safeDate(item.tanggal) >= weekStart)),
    bulanan: summarizeIncome(pembayaran.filter((item) => safeDate(item.tanggal) >= monthStart)),
  }

  const expense = {
    harian: summarizeExpense(pengeluaran.filter((item) => item.tanggal === todayKey)),
    mingguan: summarizeExpense(pengeluaran.filter((item) => safeDate(item.tanggal) >= weekStart)),
    bulanan: summarizeExpense(pengeluaran.filter((item) => safeDate(item.tanggal) >= monthStart)),
  }

  const payrollBulanan = payrollRows.reduce((acc, row) => acc + Number(row.totalGaji || 0), 0)

  const byBranch = branches.map((branch) => {
    const incomeTotal = pembayaran.filter((item) => item.branch_id === branch.id).reduce((acc, item) => acc + Number(item.nominal || 0), 0)
    const expenseTotal = pengeluaran.filter((item) => item.branch_id === branch.id).reduce((acc, item) => acc + Number(item.nominal || 0), 0)
    
    return {
      ...branch,
      pemasukan: incomeTotal,
      pengeluaran: expenseTotal,
      laba: incomeTotal - expenseTotal,
    }
  })

  function buildBucket(incomeBucket, expenseTotal, includePayroll = false) {
    const payroll = includePayroll ? payrollBulanan : 0
    return {
      pemasukan: incomeBucket.total,
      pengeluaran: expenseTotal,
      bonus: 0, 
      payroll: payroll, // Hanya untuk info estimasi di UI
      laba: incomeBucket.total - expenseTotal,
      transaksi: incomeBucket.transaksi,
      cash: incomeBucket.cash,
      qris: incomeBucket.qris,
    }
  }

  // === TAMBAHAN BARU: Membuat data Tren Arus Kas 6 Bulan Terakhir ===
  const monthlyBreakdown = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  
  for (let i = 5; i >= 0; i--) { // Tarik mundur 5 bulan dari sekarang
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthPrefix = d.toISOString().slice(0, 7); // Hasil: "YYYY-MM"
    const label = monthNames[d.getMonth()];
    
    const inTotal = pembayaran
      .filter(p => (p.tanggal || '').startsWith(monthPrefix))
      .reduce((acc, item) => acc + Number(item.nominal || 0), 0);
      
    const outTotal = pengeluaran
      .filter(p => (p.tanggal || '').startsWith(monthPrefix))
      .reduce((acc, item) => acc + Number(item.nominal || 0), 0);
    
    monthlyBreakdown.push({
      month: label,
      pemasukan: inTotal,
      pengeluaran: outTotal
    });
  }
  // ===================================================================

  return {
    harian: buildBucket(income.harian, expense.harian, false),
    mingguan: buildBucket(income.mingguan, expense.mingguan, false),
    bulanan: buildBucket(income.bulanan, expense.bulanan, true),
    byBranch,
    monthlyBreakdown // <--- TAMBAHKAN INI AGAR GRAFIK BISA MEMBACANYA
  }
}

export function computePayroll({ users = [], perkembangan = [], absensiKaryawan = [], bonusManual = [], targetDate = new Date() }) {
  const monthStart = startOfMonth(targetDate)

  return users.map((user) => {
    // A. Hitung Kehadiran Karyawan (Sama seperti sebelumnya)
    const attendance = absensiKaryawan.filter(
      (item) => item.user_id === user.id && new Date(item.tanggal) >= monthStart
    )
    const hadir = attendance.filter(a => a.status === 'hadir').length
    const izin = attendance.filter(a => a.status === 'izin').length
    const alpha = attendance.filter(a => a.status === 'alpha').length

    // B. LOGIKA BARU: Sesi dihitung dari tabel Perkembangan
    const totalSesi = (perkembangan || []).filter(
      (item) =>
        new Date(item.tanggal) >= monthStart &&
        item.guru_id === user.id // Di tabel perkembangan, kolomnya adalah guru_id
    ).length

    // C. Perhitungan Gaji
    const gajiPokok = Number(user.salary_fixed || 0)
    const feeSiswa = user.salary_type === 'guru_hybrid' ? Number(user.student_fee_daily || 0) * totalSesi : 0
    const tunjanganTetap = Number(user.allowance_transport || 0) + Number(user.allowance_meal || 0) + Number(user.allowance_position || 0)
    const tunjanganHadir = Number(user.attendance_allowance_per_day || 0) * hadir
    const potongan = (Number(user.deduction_absent || 0) * alpha) + (Number(user.deduction_izin || 0) * izin)
    const bonusOtomatis = user.monthly_bonus_target && totalSesi >= user.monthly_bonus_target ? Number(user.bonus_amount || 0) : 0
    const bonusManualTotal = bonusManual.filter((b) => b.user_id === user.id).reduce((sum, b) => sum + Number(b.amount || 0), 0)

    const total = gajiPokok + feeSiswa + tunjanganTetap + tunjanganHadir + bonusOtomatis + bonusManualTotal - potongan

    return {
      ...user,
      hadir,
      izin,
      alpha,
      totalSesi, // Sekarang nilainya diambil dari perkembangan
      gajiPokok,
      feeSiswa,
      totalGaji: total,
    }
  })
}
