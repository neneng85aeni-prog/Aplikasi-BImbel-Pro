import { useState } from 'react'
import { formatRupiah, formatTanggal } from '../../lib/format'
import { PENGELUARAN_KATEGORI_OPTIONS, INITIAL_PENGELUARAN_FORM } from '../../lib/constants'

export function PengeluaranTab({ 
  pengeluaranForm, setPengeluaranForm, pengeluaran, branches, 
  onSubmit, onEdit, onDelete, onReset 
}) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPengeluaran = pengeluaran.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.keterangan?.toLowerCase().includes(q) ||
      item.kategori?.toLowerCase().includes(q) ||
      item.branches?.nama?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="grid gap-lg">
      
      <div className="glass-card">
        <h2 className="section-title">Pencatatan Pengeluaran</h2>
        <form onSubmit={onSubmit}>
          <div className="grid grid-2">
            <div className="form-row">
              <label>Tanggal</label>
              <input type="date" value={pengeluaranForm.tanggal} onChange={(e) => setPengeluaranForm({ ...pengeluaranForm, tanggal: e.target.value })} required />
            </div>
            <div className="form-row">
              <label>Cabang Pengeluaran</label>
              <select value={pengeluaranForm.branch_id} onChange={(e) => setPengeluaranForm({ ...pengeluaranForm, branch_id: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', color: 'inherit' }}>
                <option value="" style={{ color: 'black' }}>Pusat / Semua Cabang</option>
                {branches.map(b => <option key={b.id} value={b.id} style={{ color: 'black' }}>{b.nama}</option>)}
              </select>
            </div>
          </div>
          
          <div className="grid grid-2">
            <div className="form-row">
              <label>Kategori</label>
              <select value={pengeluaranForm.kategori} onChange={(e) => setPengeluaranForm({ ...pengeluaranForm, kategori: e.target.value })} required style={{ background: 'rgba(255,255,255,0.05)', color: 'inherit' }}>
                <option value="" style={{ color: 'black' }}>-- Pilih Kategori --</option>
                {PENGELUARAN_KATEGORI_OPTIONS.map(opt => <option key={opt} value={opt} style={{ color: 'black' }}>{opt}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>Nominal (Rp)</label>
              <input type="number" value={pengeluaranForm.nominal} onChange={(e) => setPengeluaranForm({ ...pengeluaranForm, nominal: e.target.value })} placeholder="Cth: 50000" required />
            </div>
          </div>

          <div className="form-row">
            <label>Keterangan Detail</label>
            <input type="text" value={pengeluaranForm.keterangan} onChange={(e) => setPengeluaranForm({ ...pengeluaranForm, keterangan: e.target.value })} placeholder="Contoh: Beli spidol, tinta printer, dan kertas HVS" required />
          </div>

          <div className="btn-row" style={{ marginTop: '15px' }}>
            <button type="submit" className="btn btn-primary">{pengeluaranForm.id ? '💾 Update Pengeluaran' : '💾 Simpan Pengeluaran'}</button>
            {pengeluaranForm.id && (
              <button type="button" className="btn btn-secondary" onClick={() => onReset(INITIAL_PENGELUARAN_FORM)}>Batal Edit</button>
            )}
          </div>
        </form>
      </div>

      <div className="glass-card">
        <div className="btn-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Riwayat Pengeluaran</h2>
          
          <input 
            type="text" 
            placeholder="🔍 Cari keterangan / kategori / cabang..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              padding: '10px 14px', 
              borderRadius: '8px', 
              width: '100%', 
              maxWidth: '350px',
              border: '1px solid rgba(255,255,255,0.2)', 
              background: 'rgba(255,255,255,0.05)', 
              color: 'inherit',
              fontSize: '14px'
            }}
          />
        </div>
        
        <div className="table-wrap" style={{ overflowX: 'auto', transform: 'scaleY(-1)', paddingBottom: '10px' }}>
          <table style={{ transform: 'scaleY(-1)' }}>
            <thead>
              <tr><th>Tanggal</th><th>Kategori</th><th>Keterangan</th><th>Kasir/Admin</th><th>Cabang</th><th>Nominal</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {filteredPengeluaran.map(item => (
                <tr key={item.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatTanggal(item.tanggal)}</td>
                  <td>
                    <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                      {item.kategori}
                    </span>
                  </td>
                  <td>{item.keterangan}</td>
                  {/* TAMBAHKAN INI */}
                  <td><span style={{ fontSize: '11px', color: '#94a3b8' }}>{item.users?.nama || '-'}</span></td>
                  <td>{item.branches?.nama || 'Pusat'}</td>
                  <td><b style={{ color: '#ef4444' }}>{formatRupiah(item.nominal)}</b></td>
                  <td>
                    <div className="btn-row" style={{ flexWrap: 'nowrap' }}>
                      <button type="button" className="btn btn-secondary btn-small" onClick={() => onEdit(item)}>Edit</button>
                      <button type="button" className="btn btn-danger btn-small" onClick={() => onDelete(item.id, item.keterangan)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPengeluaran.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    {searchQuery ? 'Data pencarian tidak ditemukan.' : 'Belum ada data pengeluaran.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
