import { formatRupiah, formatTanggal } from '../../lib/format'

export function LaporanTab({ financeSummary, pembayaran, branches, selectedBranchId, setSelectedBranchId, payrollRows, bonusManual, searchTransaksi, setSearchTransaksi, onEditTransaksi, onDeleteTransaksi }) {
  return (
    <div className="grid gap-lg">
      <div className="glass-card">
        <div className="btn-row" style={{ justifyContent: 'space-between' }}>
          <h2 className="section-title">Laporan keuangan pemasukan & pengeluaran</h2>
          <div className="form-row slim"><label>Cabang</label><select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}><option value="">Semua cabang</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select></div>
        </div>
        <div className="grid grid-3">
          <div className="stat-card"><div className="stat-label">Harian</div><div className="stat-value">{formatRupiah(financeSummary.harian.pemasukan)}</div><div className="stat-meta">Pengeluaran {formatRupiah(financeSummary.harian.pengeluaran)} • Laba {formatRupiah(financeSummary.harian.laba)}</div></div>
          <div className="stat-card"><div className="stat-label">Mingguan</div><div className="stat-value">{formatRupiah(financeSummary.mingguan.pemasukan)}</div><div className="stat-meta">Pengeluaran {formatRupiah(financeSummary.mingguan.pengeluaran)} • Laba {formatRupiah(financeSummary.mingguan.laba)}</div></div>
          <div className="stat-card"><div className="stat-label">Bulanan</div><div className="stat-value">{formatRupiah(financeSummary.bulanan.pemasukan)}</div><div className="stat-meta">Payroll {formatRupiah(financeSummary.bulanan.payroll)} • Bonus {formatRupiah(financeSummary.bulanan.bonus)} • Laba {formatRupiah(financeSummary.bulanan.laba)}</div></div>
        </div>
      </div>
      <div className="grid grid-2">
        <div className="glass-card">
          <h2 className="section-title">Rekap cabang</h2>
          <div className="table-wrap"><table><thead><tr><th>Cabang</th><th>Pemasukan</th><th>Pengeluaran</th><th>Laba</th></tr></thead><tbody>{financeSummary.byBranch.map((item) => <tr key={item.id}><td>{item.nama}</td><td>{formatRupiah(item.pemasukan)}</td><td>{formatRupiah(item.pengeluaran)}</td><td>{formatRupiah(item.laba)}</td></tr>)}</tbody></table></div>
        </div>
        <div className="glass-card">
          <h2 className="section-title">Daftar Transaksi</h2>
          <div style={{ marginBottom: '16px' }}>
            <input 
              type="text" 
              placeholder="🔍 Cari nama siswa atau nama program..." 
              value={searchTransaksi || ''} 
              onChange={(e) => setSearchTransaksi && setSearchTransaksi(e.target.value)} 
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d7dfef', fontSize: '14px' }}
            />
          </div>
          <div className="table-wrap"><table><thead><tr><th>Tanggal</th><th>Siswa</th><th>Metode</th><th>Nominal</th><th>Aksi</th></tr></thead><tbody>{(searchTransaksi ? pembayaran : pembayaran.slice(0, 10)).map((item) => <tr key={item.id}><td>{formatTanggal(item.tanggal)}</td><td><b>{item.siswa?.nama || '-'}</b><br/><span style={{fontSize: '12px', color: '#64748b'}}>{item.programs?.nama || item.siswa?.programs?.nama || '-'}</span></td><td>{item.metode_bayar}</td><td>{formatRupiah(item.nominal)}</td><td><div className="btn-row"><button className="btn btn-secondary btn-small" onClick={() => onEditTransaksi(item)}>Edit</button><button className="btn btn-danger btn-small" onClick={() => onDeleteTransaksi(item.id)}>Hapus</button></div></td></tr>)}</tbody></table></div>
        </div>
      </div>
      <div className="grid grid-2">
        <div className="glass-card">
          <h2 className="section-title">Ringkasan payroll bulan berjalan</h2>
          <div className="table-wrap"><table><thead><tr><th>Karyawan</th><th>Total</th></tr></thead><tbody>{payrollRows.map((item) => <tr key={item.id}><td>{item.nama}</td><td>{formatRupiah(item.totalGaji)}</td></tr>)}</tbody></table></div>
        </div>
        <div className="glass-card">
          <h2 className="section-title">Bonus karyawan</h2>
          <div className="table-wrap"><table><thead><tr><th>Tanggal</th><th>Karyawan</th><th>Nominal</th><th>Keterangan</th></tr></thead><tbody>{bonusManual.slice(0, 10).map((item) => <tr key={item.id}><td>{formatTanggal(item.bonus_date)}</td><td>{item.user_nama || '-'}</td><td>{formatRupiah(item.amount)}</td><td>{item.description || '-'}</td></tr>)}</tbody></table></div>
        </div>
      </div>
    </div>
  )
}
