export function DownloadTab({ 
  exportType, setExportType, exportDateFrom, exportDateTo, 
  setExportDateFrom, setExportDateTo, onQuickRange, onDownload, selectedBranch 
}) {
  return (
    <div className="glass-card">
      <h2 className="section-title">📥 Pusat Download Data</h2>
      <p className="text-muted">
        Filter cabang mengikuti cabang aktif: <b>{selectedBranch?.nama || 'Semua cabang'}</b>
      </p>
      
      <div className="grid grid-2 gap-lg">
        <div className="form-row">
          <label>Jenis Data yang Diunduh</label>
          <select value={exportType} onChange={(e) => setExportType(e.target.value)}>
            <option value="siswa">👥 Data Siswa</option>
            <option value="pembayaran">💰 Data Pembayaran (Pemasukan)</option>
            <option value="pengeluaran">💸 Data Pengeluaran</option>
            <option value="inventory">📦 Inventory Barang</option>
            <option value="perkembangan">📝 Laporan Perkembangan</option>
            <option value="absensi_siswa">📅 Absensi Siswa</option>
            <option value="absensi_karyawan">⏰ Absensi Karyawan</option>
            <option value="payroll">🧾 Payroll / Slip Gaji</option>
            <option value="guru">👨‍🏫 Data Guru</option>
            <option value="karyawan">👥 Semua Karyawan</option>
            <option value="branches">🏢 Data Cabang</option>
            <option value="program">📚 Data Program</option>
          </select>
        </div>

        <div className="form-row">
          <label>Shortcut Periode</label>
          <div className="btn-row" style={{ marginTop: '4px' }}>
            <button className="btn btn-secondary btn-small" type="button" onClick={() => onQuickRange('today')}>Hari ini</button>
            <button className="btn btn-secondary btn-small" type="button" onClick={() => onQuickRange('week')}>Minggu ini</button>
            <button className="btn btn-secondary btn-small" type="button" onClick={() => onQuickRange('month')}>Bulan ini</button>
            <button className="btn btn-danger btn-small" type="button" onClick={() => onQuickRange('reset')}>Clear</button>
          </div>
        </div>
      </div>

      <div className="grid grid-2 gap-lg" style={{ marginTop: '10px' }}>
        <div className="form-row">
          <label>Mulai Tanggal</label>
          <input type="date" value={exportDateFrom} onChange={(e) => setExportDateFrom(e.target.value)} />
        </div>
        <div className="form-row">
          <label>Sampai Tanggal</label>
          <input type="date" value={exportDateTo} onChange={(e) => setExportDateTo(e.target.value)} />
        </div>
      </div>

      <div className="btn-row align-end" style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
        <button 
          className="btn btn-primary" 
          type="button" 
          onClick={onDownload}
          style={{ background: '#059669', width: '200px' }}
        >
          🚀 Download (.CSV)
        </button>
      </div>
    </div>
  )
}
