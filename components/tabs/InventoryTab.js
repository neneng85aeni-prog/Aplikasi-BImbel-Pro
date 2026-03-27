import { formatRupiah } from '../../lib/format'

export function InventoryTab({ inventoryForm, setInventoryForm, inventory, branches, onSubmit, onEdit, onDelete, onReset }) {
  return (
    <div className="grid grid-2">
      <div className="glass-card">
        <h2 className="section-title">Manajemen Stok Barang</h2>
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <label>Cabang</label>
            <select value={inventoryForm.branch_id} onChange={(e) => setInventoryForm({ ...inventoryForm, branch_id: e.target.value })}>
              <option value="">Pusat / Semua Cabang</option>
              {branches.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Nama Barang</label>
            <input type="text" value={inventoryForm.nama} onChange={(e) => setInventoryForm({ ...inventoryForm, nama: e.target.value })} placeholder="Cth: Buku Modul Matematika Kelas 6" required />
          </div>
          <div className="grid grid-2">
            <div className="form-row">
              <label>Harga Jual (Rp)</label>
              <input type="number" value={inventoryForm.harga} onChange={(e) => setInventoryForm({ ...inventoryForm, harga: e.target.value })} placeholder="Cth: 50000" required />
            </div>
            <div className="form-row">
              <label>Jumlah Stok</label>
              <input type="number" value={inventoryForm.stok} onChange={(e) => setInventoryForm({ ...inventoryForm, stok: e.target.value })} placeholder="Cth: 100" required />
            </div>
          </div>
          <div className="btn-row">
            <button className="btn btn-primary" type="submit">{inventoryForm.id ? 'Update Barang' : 'Simpan Barang'}</button>
            <button className="btn btn-secondary" type="button" onClick={onReset}>Reset</button>
          </div>
        </form>
      </div>

      <div className="glass-card">
        <h2 className="section-title">Daftar Barang & Stok</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Cabang</th><th>Nama Barang</th><th>Harga Jual</th><th>Sisa Stok</th><th>Aksi</th></tr></thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id}>
                  <td>{item.branches?.nama || 'Pusat'}</td>
                  <td><b>{item.nama}</b></td>
                  <td>{formatRupiah(item.harga)}</td>
                  <td>
                    <span style={{ fontWeight: 'bold', color: item.stok < 10 ? '#ef4444' : '#10b981' }}>{item.stok} pcs</span>
                  </td>
                  <td>
                    <div className="btn-row">
                      <button className="btn btn-secondary btn-small" onClick={() => onEdit(item)}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => onDelete(item.id)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {inventory.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>Belum ada data barang di inventory.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
