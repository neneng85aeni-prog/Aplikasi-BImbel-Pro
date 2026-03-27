export function exportRows({ exportType, branches, siswa, users, programs, pembayaran, absensiSiswa, absensiKaryawan, perkembangan, payrollRows, dateFrom, dateTo }) {
  const branchMap = new Map(branches.map((b) => [b.id, b.nama]))
  const programMap = new Map(programs.map((p) => [p.id, p.nama]))
  
  let rows = []
  
  const filterDate = (list, field) => {
    if (!dateFrom && !dateTo) return list
    return list.filter(item => {
      const d = item[field]
      if (!d) return false
      const val = d.slice(0, 10)
      if (dateFrom && val < dateFrom) return false
      if (dateTo && val > dateTo) return false
      return true
    })
  }

  if (exportType === 'siswa') {
    rows = siswa.map(s => ({
      Nama: s.nama,
      Cabang: s.branch_nama,
      Program: s.programs?.nama || '-',
      Kelas: s.kelas,
      Ortu: s.nama_ortu,
      WhatsApp: s.no_hp
    }))
  } else if (exportType === 'pembayaran') {
    const data = filterDate(pembayaran, 'tanggal')
    rows = data.map(p => ({
      Tanggal: p.tanggal,
      Siswa: p.siswa?.nama || '-',
      Item: p.keterangan || p.programs?.nama || '-',
      Nominal: p.nominal,
      Metode: p.metode_bayar,
      Status: p.status
    }))
  } else if (exportType === 'payroll') {
    rows = (payrollRows || []).map(p => ({
      Nama: p.nama,
      Hadir: p.hadir,
      'Gaji Pokok': p.gajiPokok,
      'Fee Mengajar': p.feeSiswa,
      'Total Gaji': p.totalGaji
    }))
  } else if (exportType === 'perkembangan') {
    const data = filterDate(perkembangan, 'tanggal')
    rows = data.map(p => ({
      Tanggal: p.tanggal,
      Siswa: p.siswa?.nama || '-',
      Guru: p.users?.nama || '-',
      Catatan: p.catatan
    }))
  }

  return rows
}

export function downloadCsv(filename, rows) {
  if (!rows.length) return
  const headers = Object.keys(rows[0]).join(',')
  const content = rows.map(r => Object.values(r).map(v => `"${v}"`).join(',')).join('\n')
  const csv = `${headers}\n${content}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}-${new Date().toISOString().slice(0, 10)}.csv`)
  link.click()
}
