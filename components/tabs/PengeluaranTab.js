import { formatRupiah, formatTanggal } from '../../lib/format'
import { PENGELUARAN_KATEGORI_OPTIONS, INITIAL_PENGELUARAN_FORM } from '../../lib/constants'

export function PengeluaranTab({ pengeluaranForm, setPengeluaranForm, pengeluaran, branches, onSubmit, onEdit, onDelete, onReset }) {
  return (
    <div className="grid grid-2">
      <div className="glass-card">
        <h2 className="section-title">Catat Pengeluaran</h2>
        <form onSubmit={onSubmit}>
          <div className="grid grid-2">
            <div className="form-row"><label>Tanggal</label><input type="date" value={pengeluaranForm.tanggal} onChange={(e) => setPengeluaranForm({ ...pengeluaranForm, tanggal: e.target.value })} required /></div>
            <div className="form-row"><label>Kategori</label><select value={pengeluaranForm.kategori} onChange={(e) => setPengeluaranForm({ ...pengeluaranForm, kategori: e.target.value })}>{PENGELUARAN_KATEGORI_OPTIONS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}</select></div>
          </div>
          <div className="form-row"><label>Cabang</label><select value={pengeluaranForm.branch_id} onChange={(e) => setPengeluaranForm({ ...pengeluaranForm, branch_id: e.target.value })}><option value="">Pusat / Semua Cabang</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select></div>
          <div className="form-row"><label>Keterangan</label><input type="text" value={pengeluaranForm.keterangan} onChange={(e) => setPengeluaranForm({ ...pengeluaranForm, keterangan: e.target.value })} placeholder="Cth: Beli spidol dan kertas HVS" required /></div>
          <div className="form-row"><label>Nominal (Rp)</label><input type="number" value={pengeluaranForm.nominal} onChange={(e) => setPengeluaranForm({ ...pengeluaranForm, nominal: e.target.value })} placeholder="Cth: 50000" required /></div>
          <div className="btn-row"><button className="btn btn-primary" type="submit">{pengeluaranForm.id ? 'Update Pengeluaran' : 'Simpan Pengeluaran'}</button><button className="btn btn-secondary" type="button" onClick={() => onReset(INITIAL_PENGELUARAN_FORM)}>Reset</button></div>
        </form>
      </div>
      <div className="glass-card">
        <h2 className="section-title">Riwayat Pengeluaran</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Tanggal</th><th>Cabang</th><th>Kategori & Keterangan</th><th>Nominal</th><th>Aksi</th></tr></thead>
            <tbody>
              {pengeluaran.map((item) => (
                <tr key={item.id}>
                  <td>{formatTanggal(item.tanggal)}</td>
                  <td>{item.branches?.nama || 'Pusat'}</td>
                  <td><b>{item.kategori}</b><div className="text-muted">{item.keterangan}</div></td>
                  <td>{formatRupiah(item.nominal)}</td>
                  <td><div className="btn-row"><button className="btn btn-secondary btn-small" onClick={() => onEdit(item)}>Edit</button><button className="btn btn-danger btn-small" onClick={() => onDelete(item.id)}>Hapus</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
