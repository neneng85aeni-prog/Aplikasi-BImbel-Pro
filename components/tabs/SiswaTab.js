import { INITIAL_SISWA_FORM } from '../../lib/constants'
import { printBarcodeCard, BarcodePreview } from '../ui/BarcodePreview'

export function SiswaTab({ user, siswaForm, setSiswaForm, siswaTampil, programs, guruOptions, branches, onGenerateBarcode, onSubmit, onReset, onEdit, onDelete, onPrintBarcode, perkembanganForm, setPerkembanganForm, onSubmitPerkembangan }) {
  if (user?.akses === 'guru') {
    return (
      <div className="glass-card">
        <h2 className="section-title">Data siswa</h2>
        <p className="text-muted">Untuk guru, input kehadiran harian dan perkembangan siswa sekarang dipusatkan di menu <b>Perkembangan &amp; Absensi</b> agar cukup sekali scan atau pilih manual dalam sehari.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-2">
      <div className="glass-card">
        <h2 className="section-title">Pendaftaran siswa</h2>
        <form onSubmit={onSubmit}>
          <div className="grid grid-2">
            <div className="form-row"><label>Nama siswa</label><input value={siswaForm.nama} onChange={(e) => setSiswaForm({ ...siswaForm, nama: e.target.value })} /></div>
            <div className="form-row"><label>Cabang</label><select value={siswaForm.branch_id} onChange={(e) => setSiswaForm({ ...siswaForm, branch_id: e.target.value })}><option value="">Pilih cabang</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select></div>
          </div>
          <div className="grid grid-2">
            <div className="form-row"><label>Program</label><select value={siswaForm.program_id} onChange={(e) => setSiswaForm({ ...siswaForm, program_id: e.target.value })}><option value="">Pilih program</option>{programs.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select></div>
            <div className="form-row"><label>Guru default</label><select value={siswaForm.guru_id} onChange={(e) => setSiswaForm({ ...siswaForm, guru_id: e.target.value })}><option value="">Pilih guru</option>{guruOptions.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select></div>
          </div>
          <div className="grid grid-2">
            <div className="form-row"><label>Kelas</label><input value={siswaForm.kelas} onChange={(e) => setSiswaForm({ ...siswaForm, kelas: e.target.value })} /></div>
            <div className="form-row"><label>Nama orang tua</label><input value={siswaForm.nama_ortu} onChange={(e) => setSiswaForm({ ...siswaForm, nama_ortu: e.target.value })} /></div>
          </div>
          <div className="grid grid-2">
            <div className="form-row"><label>No HP</label><input value={siswaForm.no_hp} onChange={(e) => setSiswaForm({ ...siswaForm, no_hp: e.target.value })} /></div>
            <div className="form-row"><label>Alamat</label><input value={siswaForm.alamat} onChange={(e) => setSiswaForm({ ...siswaForm, alamat: e.target.value })} /></div>
          </div>
          <div className="form-row"><label>Barcode siswa otomatis</label><div className="btn-row"><input value={siswaForm.kode_qr} onChange={(e) => setSiswaForm({ ...siswaForm, kode_qr: e.target.value })} placeholder="Klik generate jika ingin otomatis" /><button className="btn btn-secondary" type="button" onClick={onGenerateBarcode}>Generate</button></div></div>
          {siswaForm.kode_qr ? <div className="btn-row"><BarcodePreview value={siswaForm.kode_qr} title="Preview barcode siswa" compact /><button className="btn btn-secondary" type="button" onClick={() => printBarcodeCard({ title: `Barcode ${siswaForm.nama || 'Siswa'}`, subtitle: siswaForm.kelas || '', value: siswaForm.kode_qr })}>Print barcode</button></div> : null}
          <div className="btn-row"><button className="btn btn-primary" type="submit">{siswaForm.id ? 'Update siswa' : 'Simpan siswa'}</button><button className="btn btn-secondary" type="button" onClick={() => onReset(INITIAL_SISWA_FORM)}>Reset</button></div>
        </form>
      </div>
      <div className="glass-card">
        <h2 className="section-title">Daftar siswa</h2>
        <div className="table-wrap"><table><thead><tr><th>Nama</th><th>Cabang</th><th>Program</th><th>Alamat</th><th>Barcode</th><th>Aksi</th></tr></thead><tbody>{siswaTampil.map((item) => <tr key={item.id}><td><b>{item.nama}</b><div className="text-muted">{item.kelas || '-'} • Guru default: {item.users?.nama || '-'}</div></td><td>{item.branches?.nama || '-'}</td><td>{item.programs?.nama || '-'}</td><td>{item.alamat || '-'}</td><td><code>{item.kode_qr || '-'}</code></td><td><div className="btn-row"><button className="btn btn-secondary btn-small" type="button" onClick={() => onEdit(item)}>Edit</button><button className="btn btn-secondary btn-small" type="button" onClick={() => onPrintBarcode(item)}>Print</button><button className="btn btn-danger btn-small" type="button" onClick={() => onDelete(item.id)}>Hapus</button></div></td></tr>)}</tbody></table></div>
      </div>
    </div>
  )
}
