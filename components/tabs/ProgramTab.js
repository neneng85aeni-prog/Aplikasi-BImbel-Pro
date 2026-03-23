import { INITIAL_PROGRAM_FORM } from '../../lib/constants'
import { formatRupiah } from '../../lib/format'

export function ProgramTab({ programForm, setProgramForm, programs, onSubmit, onReset, onEdit, onDelete }) {
  return (
    <div className="grid grid-2">
      <div className="glass-card">
        <h2 className="section-title">Program belajar</h2>
        <form onSubmit={onSubmit}>
          <div className="form-row"><label>Nama program</label><input value={programForm.nama} onChange={(e) => setProgramForm({ ...programForm, nama: e.target.value })} /></div>
          <div className="form-row"><label>Deskripsi</label><textarea value={programForm.deskripsi} onChange={(e) => setProgramForm({ ...programForm, deskripsi: e.target.value })} /></div>
          <div className="form-row"><label>Nominal biaya</label><input type="number" value={programForm.nominal} onChange={(e) => setProgramForm({ ...programForm, nominal: e.target.value })} /></div>
          <div className="btn-row"><button className="btn btn-primary" type="submit">{programForm.id ? 'Update program' : 'Simpan program'}</button><button className="btn btn-secondary" type="button" onClick={() => onReset(INITIAL_PROGRAM_FORM)}>Reset</button></div>
        </form>
      </div>
      <div className="glass-card">
        <h2 className="section-title">Daftar program</h2>
        <div className="table-wrap"><table><thead><tr><th>Nama</th><th>Deskripsi</th><th>Biaya</th><th>Aksi</th></tr></thead><tbody>{programs.map((item) => <tr key={item.id}><td>{item.nama}</td><td>{item.deskripsi || '-'}</td><td>{formatRupiah(item.nominal)}</td><td><div className="btn-row"><button className="btn btn-secondary btn-small" type="button" onClick={() => onEdit(item)}>Edit</button><button className="btn btn-danger btn-small" type="button" onClick={() => onDelete(item.id)}>Hapus</button></div></td></tr>)}</tbody></table></div>
      </div>
    </div>
  )
}
