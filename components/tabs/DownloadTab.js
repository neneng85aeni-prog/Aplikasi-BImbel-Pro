export function DownloadTab({ exportType, setExportType, exportDateFrom, exportDateTo, setExportDateFrom, setExportDateTo, onQuickRange, onDownload, selectedBranch }) {
  return (
    <div className="glass-card">
      <h2 className="section-title">Download data operasional</h2>
      <p className="text-muted">Filter cabang mengikuti cabang aktif di dashboard: <b>{selectedBranch?.nama || 'Semua cabang'}</b></p>
      <div className="grid grid-2 gap-lg">
        <div className="form-row">
          <label>Pilih data</label>
          <select value={exportType} onChange={(e) => setExportType(e.target.value)}>
            <option value="branches">Cabang</option>
            <option value="siswa">Data siswa</option>
            <option value="guru">Data guru</option>
            <option value="karyawan">Data semua karyawan</option>
            <option value="program">Data program</option>
            <option value="pembayaran">Data pembayaran</option>
            <option value="absensi_siswa">Absensi siswa</option>
            <option value="absensi_karyawan">Absensi karyawan</option>
            <option value="perkembangan">Perkembangan siswa</option>
            <option value="payroll">Payroll ringkas</option>
          </select>
        </div>
        <div className="form-row">
          <label>Quick filter periode</label>
          <div className="btn-row">
            <button className="btn btn-secondary btn-small" type="button" onClick={() => onQuickRange('today')}>Hari ini</button>
            <button className="btn btn-secondary btn-small" type="button" onClick={() => onQuickRange('week')}>Minggu ini</button>
            <button className="btn btn-secondary btn-small" type="button" onClick={() => onQuickRange('month')}>Bulan ini</button>
            <button className="btn btn-secondary btn-small" type="button" onClick={() => onQuickRange('reset')}>Reset</button>
          </div>
        </div>
      </div>
      <div className="grid grid-2 gap-lg">
        <div className="form-row">
          <label>Tanggal mulai</label>
          <input type="date" value={exportDateFrom} onChange={(e) => setExportDateFrom(e.target.value)} />
        </div>
        <div className="form-row">
          <label>Tanggal akhir</label>
          <input type="date" value={exportDateTo} onChange={(e) => setExportDateTo(e.target.value)} />
        </div>
      </div>
      <div className="btn-row align-end">
        <button className="btn btn-primary" type="button" onClick={onDownload}>Download CSV</button>
      </div>
    </div>
  )
}
