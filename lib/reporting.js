import { startOfDay, startOfMonth, startOfWeek } from './format'

function safeDate(value) {
  return new Date(value || Date.now())
}

export function filterByUserBranch(items, user, branchField = 'branch_id') {
  if (!user || user.akses === 'master' || !user.branch_id) return items
  return items.filter((item) => item?.[branchField] === user.branch_id || item?.siswa?.branch_id === user.branch_id || item?.users?.branch_id === user.branch_id || item?.branch_id === user.branch_id)
}

export function computeOverview({ pembayaran = [], siswa = [], users = [], branches = [], payrollRows = [], targetDate = new Date() }) {
  const now = safeDate(targetDate)
  const weekStart = startOfWeek(now)
  const monthStart = startOfMonth(now)
  const harian = pembayaran.filter((item) => new Date(item.tanggal).toISOString().slice(0, 10) === now.toISOString().slice(0, 10))
  const mingguan = pembayaran.filter((item) => safeDate(item.tanggal) >= weekStart)
  const bulanan = pembayaran.filter((item) => safeDate(item.tanggal) >= monthStart)
  const sum = (rows) => rows.reduce((acc, row) => acc + Number(row.nominal || 0), 0)
  const payrollBulanan = payrollRows.reduce((acc, row) => acc + Number(row.totalGaji || 0), 0)
  return {
    totalSiswa: siswa.length,
    totalKaryawan: users.length,
    totalCabang: branches.length,
    pemasukanHarian: sum(harian),
    pemasukanMingguan: sum(mingguan),
    pemasukanBulanan: sum(bulanan),
    pengeluaranBulanan: payrollBulanan,
    labaBulanan: sum(bulanan) - payrollBulanan,
  }
}

export function buildFinanceSummary(pembayaran = [], payrollRows = [], bonusManual = [], branches = []) {
  const now = new Date()
  const todayKey = now.toISOString().slice(0, 10)
  const weekStart = startOfWeek(now)
  const monthStart = startOfMonth(now)
  const summarizeIncome = (rows) => ({
    total: rows.reduce((acc, item) => acc + Number(item.nominal || 0), 0),
    transaksi: rows.length,
    cash: rows.filter((item) => item.metode_bayar === 'cash').reduce((acc, item) => acc + Number(item.nominal || 0), 0),
    qris: rows.filter((item) => item.metode_bayar === 'qris').reduce((acc, item) => acc + Number(item.nominal || 0), 0),
  })
  const summarizeBonus = (rows) => ({
    total: rows.reduce((acc, item) => acc + Number(item.amount || item.nominal || 0), 0),
    transaksi: rows.length,
  })

  const income = {
    harian: summarizeIncome(pembayaran.filter((item) => safeDate(item.tanggal).toISOString().slice(0, 10) === todayKey)),
    mingguan: summarizeIncome(pembayaran.filter((item) => safeDate(item.tanggal) >= weekStart)),
    bulanan: summarizeIncome(pembayaran.filter((item) => safeDate(item.tanggal) >= monthStart)),
  }
  const bonusExpense = {
    harian: summarizeBonus(bonusManual.filter((item) => safeDate(item.bonus_date || item.tanggal) >= startOfDay(now))),
    mingguan: summarizeBonus(bonusManual.filter((item) => safeDate(item.bonus_date || item.tanggal) >= weekStart)),
    bulanan: summarizeBonus(bonusManual.filter((item) => safeDate(item.bonus_date || item.tanggal) >= monthStart)),
  }
  const payrollBulanan = payrollRows.reduce((acc, row) => acc + Number(row.totalGaji || 0), 0)

  const byBranch = branches.map((branch) => {
    const incomeTotal = pembayaran.filter((item) => item.branch_id === branch.id).reduce((acc, item) => acc + Number(item.nominal || 0), 0)
    const payrollTotal = payrollRows.filter((item) => item.branch_id === branch.id).reduce((acc, item) => acc + Number(item.totalGaji || 0), 0)
    const bonusTotal = bonusManual.filter((item) => item.branch_id === branch.id).reduce((acc, item) => acc + Number(item.amount || item.nominal || 0), 0)
    return {
      ...branch,
      pemasukan: incomeTotal,
      pengeluaran: payrollTotal + bonusTotal,
      laba: incomeTotal - payrollTotal - bonusTotal,
    }
  })


  function buildBucket(incomeBucket, bonusBucket, includePayroll = false) {
    const payroll = includePayroll ? payrollBulanan : 0
    const totalExpense = payroll + bonusBucket.total
    return {
      pemasukan: incomeBucket.total,
      pengeluaran: totalExpense,
      bonus: bonusBucket.total,
      payroll,
      laba: incomeBucket.total - totalExpense,
      transaksi: incomeBucket.transaksi,
      cash: incomeBucket.cash,
      qris: incomeBucket.qris,
    }
  }

  return {
    harian: buildBucket(income.harian, bonusExpense.harian, false),
    mingguan: buildBucket(income.mingguan, bonusExpense.mingguan, false),
    bulanan: buildBucket(income.bulanan, bonusExpense.bulanan, true),
    byBranch,
  }
}

export function computePayroll({ users = [], absensiSiswa = [], absensiKaryawan = [], bonusManual = [], targetDate = new Date() }) {
  const monthStart = startOfMonth(targetDate)

  return users.map((user) => {
    const attendance = absensiKaryawan.filter(
      (item) =>
        item.user_id === user.id &&
        new Date(item.tanggal) >= monthStart
    )

    const hadir = attendance.filter(a => a.status === 'hadir').length
    const izin = attendance.filter(a => a.status === 'izin').length
    const sakit = attendance.filter(a => a.status === 'sakit').length
    const alpha = attendance.filter(a => a.status === 'alpha').length

    const studentHandled = absensiSiswa.filter(
      (item) =>
        new Date(item.tanggal) >= monthStart &&
        item.guru_handle_id === user.id
    ).length

    const gajiPokok = Number(user.salary_fixed || 0)

    const feeSiswa =
      user.salary_type === 'guru_hybrid'
        ? Number(user.student_fee_daily || 0) * studentHandled
        : 0

    const tunjanganTetap =
      Number(user.allowance_transport || 0) +
      Number(user.allowance_meal || 0) +
      Number(user.allowance_position || 0)

    const tunjanganHadir =
      Number(user.attendance_allowance_per_day || 0) * hadir

    const potongan =
      (Number(user.deduction_absent || 0) * alpha) +
      (Number(user.deduction_izin || 0) * izin)

    const bonusOtomatis =
      user.monthly_bonus_target && studentHandled >= user.monthly_bonus_target
        ? Number(user.bonus_amount || 0)
        : 0

    const bonusManualTotal = bonusManual
      .filter((b) => b.user_id === user.id)
      .reduce((sum, b) => sum + Number(b.amount || 0), 0)

    const total =
      gajiPokok +
      feeSiswa +
      tunjanganTetap +
      tunjanganHadir +
      bonusOtomatis +
      bonusManualTotal -
      potongan

    return {
      ...user,
      hadir,
      izin,
      sakit,
      alpha,
      gajiPokok,
      feeSiswa,
      tunjanganTetap,
      tunjanganHadir,
      potongan,
      bonusOtomatis,
      bonusManual: bonusManualTotal,
      totalGaji: total,
    }
  })
}
