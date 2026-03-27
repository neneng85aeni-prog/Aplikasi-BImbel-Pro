import { formatRupiah, formatTanggal } from '../../lib/format'

export function LaporanTab({ 
  financeSummary, pembayaran, branches, selectedBranchId, setSelectedBranchId, 
  searchTransaksi, setSearchTransaksi, onDeleteTransaksi,
  editTransaksiForm, setEditTransaksiForm, onSubmitEditTransaksi, onStartEditTransaksi 
}) {
  return (
    <div className="grid gap-lg">
      <div className="grid grid-3 compact-stats">
        <div className="glass-card" style={{ padding: '16px' }}><p className="text-muted" style={{ fontSize: '13px', margin: 0 }}>Pemasukan</p><h3 style={{ fontSize: '22px', margin: '4px 0 0', color: '#10b981' }}>{formatRupiah(financeSummary.pemasukan)}</h3></div>
        <div className="glass-card" style={{ padding: '16px' }}><p className="text-muted" style={{ fontSize: '13px', margin: 0 }}>Pengeluaran</p><h3 style={{ fontSize: '22px', margin: '4px 0 0', color: '#ef4444' }}>{formatRupiah(financeSummary.pengeluaran)}</h3></div>
        <div className="glass-card" style={{ padding: '16px' }}><p className="text-muted" style={{ fontSize: '13px', margin: 0 }}>Net Laba</p><h3 style={{ fontSize: '22px', margin: '4px 0 0', color: financeSummary.laba >= 0 ? '#3b82f6' : '#ef4444' }}>{formatRupiah(financeSummary.laba)}</h3></div>
      </div>

      <div className="glass-card">
        <div className="btn-row" style={{ justifyContent: 'space-between' }}>
          <h2 className="section-title">Riwayat Transaksi</h2>
          <div className="btn-row">
            <input type="text" placeholder="Cari..." value={searchTransaksi} onChange={(e) => setSearchTransaksi(e.target.value)} style={{ padding: '8px', borderRadius: '6px' }} />
            <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} style={{ padding: '8px', borderRadius: '6px' }}>
              <option value="">Semua Cabang</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.nama}</option>)}
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead><tr><th>Tanggal</th><th>Siswa</th><th>Keterangan</th><th>Nominal</th><th>Aksi</th></tr></thead>
            <tbody>
              {pembayaran.map((item) => (
                <tr key={item.id}>
                  <td>{formatTanggal(item.tanggal)}</td>
                  <td><b>{item.siswa?.nama}</b></td>
                  <td>{item.keterangan || item.programs?.nama}</td>
                  <td><b style={{ color: '#10b981' }}>{formatRupiah(item.nominal)}</b></td>
                  <td>
                    <div className="btn-row">
                      <button className="btn btn-secondary btn-small" onClick={() => onStartEditTransaksi(item)}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => onDeleteTransaksi(item.id)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editTransaksiForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <form onSubmit={onSubmitEditTransaksi} className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '25px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <h2 className="section-title">Edit Transaksi</h2>
            <div className="form-row">
              <label>Keterangan</label>
              <input type="text" value={editTransaksiForm.keterangan} onChange={(e) => setEditTransaksiForm({ ...editTransaksiForm, keterangan: e.target.value })} required style={{ background: 'rgba(255,255,255,0.05)', color: 'white', width: '100%' }} />
            </div>
            <div className="form-row">
              <label>Nominal</label>
              <input type="number" value={editTransaksiForm.nominal} onChange={(e) => setEditTransaksiForm({ ...editTransaksiForm, nominal: e.target.value })} required style={{ background: 'rgba(255,255,255,0.05)', color: 'white', width: '100%' }} />
            </div>
            <div className="btn-row">
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Simpan</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditTransaksiForm(null)}>Batal</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
