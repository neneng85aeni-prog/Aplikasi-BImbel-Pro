import { useState } from 'react'
import { formatRupiah } from '../../lib/format'

export function InventoryTab({ 
  inventoryForm, setInventoryForm, inventory, branches, 
  onSubmit, onEdit, onDelete 
}) {
  // STATE LOKAL UNTUK PENCARIAN
  const [searchQuery, setSearchQuery] = useState('')

  // LOGIKA PENCARIAN
  const filteredInventory = inventory.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.nama?.toLowerCase().includes(q) ||
      item.branches?.nama?.toLowerCase().includes(q)
    );
  });

  // FUNGSI PINTAR PENENTU WARNA INDIKATOR STOK
  const getStockStyle = (stok) => {
    if (stok < 5) return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' } // MERAH (Kritis)
    if (stok < 10) return { bg: 'rgba(234, 179, 8, 0.1)', text: '#eab308', border: 'rgba(234, 179, 8, 0.3)' } // KUNING (Menipis)
    return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' } // HIJAU (Aman)
  }

  // FUNGSI KHUSUS UNTUK MEMBATALKAN EDIT & MENGOSONGKAN FORM
  const handleBatalEdit = () => {
    setInventoryForm({ id: '', nama: '', harga: '', stok: '', branch_id: '' });
  }

  return (
    <div className="grid gap-lg">
      <div className="glass-card">
        <h2 className="section-title">Form Barang (Inventory)</h2>
        <form onSubmit={onSubmit}>
          <div className="grid grid-2">
            <div className="form-row">
              <label>Nama Barang</label>
              <input type="text" value={inventoryForm.nama} onChange={(e) => setInventoryForm({ ...inventoryForm, nama: e.target.value })} placeholder="Contoh: Buku Modul Matematika" required />
            </div>
            <div className="form-row">
              <label>Cabang</label>
              <select value={inventoryForm.branch_id || ''} onChange={(e) => setInventoryForm({ ...inventoryForm, branch_id: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', color: 'inherit' }}>
                <option value="" style={{ color: 'black' }}>Pusat / Semua Cabang</option>
                {branches.map(b => <option key={b.id} value={b.id} style={{ color: 'black' }}>{b.nama}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-2">
            <div className="form-row">
              <label>Harga Jual (Rp)</label>
              <input type="number" value={inventoryForm.harga} onChange={(e) => setInventoryForm({ ...inventoryForm, harga: e.target.value })} placeholder="Contoh: 50000" required />
            </div>
            <div className="form-row">
              <label>Stok Awal / Tersedia</label>
              <input type="number" value={inventoryForm.stok} onChange={(e) => setInventoryForm({ ...inventoryForm, stok: e.target.value })} placeholder="Contoh: 100" required />
            </div>
          </div>
          <div className="btn-row" style={{ marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary">{inventoryForm.id ? '💾 Update Barang' : '💾 Simpan Barang'}</button>
            
            {/* TOMBOL BATAL EDIT YANG SUDAH DIPERBAIKI */}
            {inventoryForm.id && (
              <button type="button" className="btn btn-secondary" onClick={handleBatalEdit}>Batal Edit</button>
            )}
          </div>
        </form>
      </div>

      <div className="glass-card">
        <div className="btn-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Daftar Barang</h2>
          
          {/* KOTAK PENCARIAN */}
          <input
            type="text"
            placeholder="🔍 Cari nama barang..."
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

        {/* WADAH TABEL BISA DI-SCROLL */}
        <div className="table-wrap" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <table>
            {/* STICKY HEADER: Nempel di atas saat di-scroll */}
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#0f172a' }}>
              <tr>
                <th>NAMA BARANG</th>
                <th>CABANG</th>
                <th>HARGA</th>
                <th>STOK</th>
                <th>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const stockStyle = getStockStyle(item.stok);
                return (
                  <tr key={item.id}>
                    <td><b>{item.nama}</b></td>
                    <td>{item.branches?.nama || 'Pusat'}</td>
                    <td>{formatRupiah(item.harga)}</td>
                    <td>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: stockStyle.bg,
                        color: stockStyle.text,
                        fontWeight: 'bold',
                        fontSize: '13px',
                        border: `1px solid ${stockStyle.border}`
                      }}>
                        {item.stok}
                      </span>
                    </td>
                    <td>
                      <div className="btn-row" style={{ flexWrap: 'nowrap' }}>
                        <button className="btn btn-secondary btn-small" onClick={() => onEdit(item)}>Edit</button>
                        <button className="btn btn-danger btn-small" onClick={() => onDelete(item.id, item.nama)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    {searchQuery ? 'Barang tidak ditemukan.' : 'Belum ada data barang di Gudang.'}
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
