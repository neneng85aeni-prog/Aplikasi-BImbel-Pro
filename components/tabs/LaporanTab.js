import { formatRupiah, formatTanggal } from '../../lib/format'

export function LaporanTab({ 
  financeSummary, pembayaran, branches, selectedBranchId, setSelectedBranchId, 
  payrollRows, bonusManual, searchTransaksi, setSearchTransaksi, onDeleteTransaksi,
  editTransaksiForm, setEditTransaksiForm, onSubmitEditTransaksi, onStartEditTransaksi 
}) {
  return (
    <div className="grid gap-lg">
      <div className="grid grid-3 compact-stats">
        <div className="glass-card" style={{ padding: '16px' }}><p className="text-muted" style={{ fontSize: '13px', margin: 0 }}>Pemasukan Total</p><h3 style={{ fontSize: '22px', margin: '4px 0 0', color: '#10b981' }}>{formatRupiah(financeSummary.pemasukan)}</h3></div>
        <div className="glass-card" style={{ padding: '16px' }}><p className="text-muted" style={{ fontSize: '13px', margin: 0 }}>Pengeluaran Total</p><h3 style={{ fontSize: '22px', margin: '4px 0 0', color: '#ef4444' }}>{formatRupiah(financeSummary.pengeluaran)}</h3></div>
        <div className="glass-card" style={{ padding: '16px' }}><p className="text-muted" style={{ fontSize: '13px', margin: 0 }}>Laba Bersih</p><h3 style={{ fontSize: '22px', margin: '4px 0 0', color: financeSummary.laba >= 0 ? '#3b82f6' : '#ef4444' }}>{formatRupiah(financeSummary.laba)}</h3></div>
      </div>

      <div className="glass-card">
        <div className="btn-row" style={{ justifyContent: 'space-between' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Riwayat Transaksi Pemasukan</h2>
          <div className="btn-row">
            <input type="text" placeholder="Cari nama / keterangan..." value={searchTransaksi} onChange={(e) => setSearchTransaksi(e.target.value)} style={{ padding: '8px 12px', width: '200px', borderRadius: '6px' }} />
            <div className="form-row slim" style={{ margin: 0 }}><select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}><option value="">Semua cabang</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select></div>
          </div>
        </div>

        <div className="table-wrap" style={{ marginTop: '15px' }}>
          <table>
            <thead><tr><th>Tanggal</th><th>Siswa</th><th>Item / Program</th><th>Cabang</th><th>Kasir</th><th>Status</th><th>Metode</th><th>Nominal</th><th>Aksi</th></tr></thead>
            <tbody>
              {pembayaran.map((item) => (
                <tr key={item.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatTanggal(item.tanggal)}</td>
                  <td><b>{item.siswa?.nama || '-'}</b></td>
                  <td>{item.keterangan || item.programs?.nama || '-'}</td>
                  <td>{item.siswa?.branch_nama || '-'}</td>
                  <td>{item.users?.nama || '-'}</td>
                  <td>
                    <span style={{ fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', background: item.status === 'lunas' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: item.status === 'lunas' ? '#10b981' : '#ef4444', textTransform: 'uppercase' }}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td><span style={{ textTransform: 'uppercase', fontSize: '12px', color: '#94a3b8', border: '1px solid #94a3b8', padding: '2px 6px', borderRadius: '4px' }}>{item.metode_bayar}</span></td>
                  <td><b style={{ color: '#10b981' }}>{formatRupiah(item.nominal)}</b></td>
                  <td>
                    <div className="btn-row">
                      <button className="btn btn-secondary btn-small" onClick={() => onStartEditTransaksi(item)}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => onDeleteTransaksi(item.id)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {pembayaran.length === 0 && <tr><td colSpan="9" style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>Belum ada riwayat transaksi.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP EDIT TRANSAKSI */}
      {editTransaksiForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <form onSubmit={onSubmitEditTransaksi} className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '25px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <h2 className="section-title">Edit Transaksi</h2>
            <div className="form-row">
              <label>Keterangan / Jenis Transaksi</label>
              <input type="text" value={editTransaksiForm.keterangan} onChange={(e) => setEditTransaksiForm({ ...editTransaksiForm, keterangan: e.target.value })} placeholder="Cth: Pembayaran SPP" required style={{ width: '100%' }} />
            </div>
            <div className="form-row">
              <label>Nominal (Rp)</label>
              <input type="number" value={editTransaksiForm.nominal} onChange={(e) => setEditTransaksiForm({ ...editTransaksiForm, nominal: e.target.value })} required style={{ width: '100%' }} />
            </div>
            <div className="btn-row" style={{ marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Simpan Perubahan</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditTransaksiForm(null)}>Batal</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
