import { INITIAL_BRANCH_FORM } from '../../lib/constants'
import { printBarcodeCard } from '../ui/BarcodePreview'

export function CabangTab({ branchForm, setBranchForm, branches, onSubmit, onReset, onEdit, onDelete }) {
  return (
    <div className="grid grid-2">
      <div className="glass-card">
        <h2 className="section-title">Pengaturan cabang</h2>
        <form onSubmit={onSubmit}>
          <div className="form-row"><label>Nama cabang</label><input value={branchForm.nama} onChange={(e) => setBranchForm({ ...branchForm, nama: e.target.value })} /></div>
          <div className="form-row"><label>Kode cabang</label><input value={branchForm.kode} onChange={(e) => setBranchForm({ ...branchForm, kode: e.target.value.toUpperCase() })} placeholder="CBG-01" /></div>
          <div className="form-row"><label>Alamat</label><textarea value={branchForm.alamat} onChange={(e) => setBranchForm({ ...branchForm, alamat: e.target.value })} /></div>
          <div className="form-row"><label>Barcode pintu masuk karyawan</label><input value={branchForm.employee_barcode_in} onChange={(e) => setBranchForm({ ...branchForm, employee_barcode_in: e.target.value })} /></div>
          <div className="form-row"><label>Barcode pintu pulang karyawan</label><input value={branchForm.employee_barcode_out} onChange={(e) => setBranchForm({ ...branchForm, employee_barcode_out: e.target.value })} /></div>
          <div className="btn-row"><button className="btn btn-primary" type="submit">{branchForm.id ? 'Update cabang' : 'Simpan cabang'}</button><button className="btn btn-secondary" type="button" onClick={() => onReset(INITIAL_BRANCH_FORM)}>Reset</button></div>
        </form>
      </div>
      <div className="glass-card">
        <h2 className="section-title">Daftar cabang</h2>
        <div className="table-wrap"><table><thead><tr><th>Cabang</th><th>Kode</th><th>Barcode pintu</th><th>Aksi</th></tr></thead><tbody>{branches.map((item) => <tr key={item.id}><td><b>{item.nama}</b><div className="text-muted">{item.alamat || '-'}</div></td><td>{item.kode}</td><td><div className="text-muted">IN: {item.employee_barcode_in || '-'}</div><div className="text-muted">OUT: {item.employee_barcode_out || '-'}</div></td><td><div className="btn-row"><button className="btn btn-secondary btn-small" type="button" onClick={() => onEdit(item)}>Edit</button><button className="btn btn-secondary btn-small" type="button" onClick={() => printBarcodeCard({ title: `Barcode Pintu ${item.nama}`, subtitle: `IN: ${item.employee_barcode_in} | OUT: ${item.employee_barcode_out}`, value: `${item.employee_barcode_in} / ${item.employee_barcode_out}` })}>Print</button><button className="btn btn-danger btn-small" type="button" onClick={() => actions.deleteBranch(item.id, item.nama)}>Hapus</button></div></td></tr>)}</tbody></table></div>
      </div>
    </div>
  )
}
