import { INITIAL_BRANCH_FORM } from '../../lib/constants'
import { printBarcodeCard } from '../ui/BarcodePreview'

export function CabangTab({ branchForm, setBranchForm, branches, onSubmit, onReset, onEdit, onDelete }) {
  return (
    <div className="grid grid-2">
      {/* KOTAK KIRI: FORM CABANG */}
      <div className="glass-card">
        <h2 className="section-title">Pengaturan cabang</h2>
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <label>Nama cabang</label>
            <input value={branchForm.nama} onChange={(e) => setBranchForm({ ...branchForm, nama: e.target.value })} required />
          </div>
          
          <div className="form-row">
            <label>Kode cabang</label>
            <input value={branchForm.kode} onChange={(e) => setBranchForm({ ...branchForm, kode: e.target.value.toUpperCase() })} placeholder="CBG-01" required />
          </div>
          
          <div className="form-row">
            <label>Alamat</label>
            <textarea value={branchForm.alamat} onChange={(e) => setBranchForm({ ...branchForm, alamat: e.target.value })} />
          </div>

          {/* === TAMBAHAN BARU: LINK GRUP WA === */}
          <div className="form-row" style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '16px' }}>
            <label style={{ color: '#60a5fa' }}>🔗 Link Grup WA (Otomatis)</label>
            <input 
              type="url" 
              placeholder="Cth: https://chat.whatsapp.com/xxx" 
              value={branchForm.link_grup || ''} 
              onChange={(e) => setBranchForm({ ...branchForm, link_grup: e.target.value })} 
              style={{ marginTop: '4px' }}
            />
            <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', display: 'block', lineHeight: '1.4' }}>
              Link ini akan otomatis dikirimkan via WA ke setiap siswa baru yang mendaftar di cabang ini.
            </span>
          </div>
          {/* ================================= */}

          <div className="form-row">
            <label>Barcode pintu masuk karyawan</label>
            <input value={branchForm.employee_barcode_in} onChange={(e) => setBranchForm({ ...branchForm, employee_barcode_in: e.target.value })} />
          </div>
          
          <div className="form-row">
            <label>Barcode pintu pulang karyawan</label>
            <input value={branchForm.employee_barcode_out} onChange={(e) => setBranchForm({ ...branchForm, employee_barcode_out: e.target.value })} />
          </div>
          
          <div className="btn-row">
            <button className="btn btn-primary" type="submit">{branchForm.id ? '💾 Update cabang' : '💾 Simpan cabang'}</button>
            <button className="btn btn-secondary" type="button" onClick={() => onReset(INITIAL_BRANCH_FORM)}>Reset</button>
          </div>
        </form>
      </div>

      {/* KOTAK KANAN: DAFTAR CABANG */}
      <div className="glass-card">
        <h2 className="section-title">Daftar cabang</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cabang</th>
                <th>Kode</th>
                <th>Barcode pintu</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((item) => (
                <tr key={item.id}>
                  <td>
                    <b>{item.nama}</b>
                    <div className="text-muted" style={{ fontSize: '12px' }}>{item.alamat || '-'}</div>
                    {/* Tampilkan indikator jika link grup sudah diisi */}
                    {item.link_grup && (
                      <div style={{ fontSize: '10px', color: '#10b981', marginTop: '4px' }}>
                        ✓ Link WA Aktif
                      </div>
                    )}
                  </td>
                  <td>{item.kode}</td>
                  <td>
                    <div className="text-muted" style={{ fontSize: '11px' }}>IN: {item.employee_barcode_in || '-'}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>OUT: {item.employee_barcode_out || '-'}</div>
                  </td>
                  <td>
                    <div className="btn-row" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <button className="btn btn-secondary btn-small" type="button" onClick={() => onEdit(item)}>Edit</button>
                      <button className="btn btn-secondary btn-small" type="button" onClick={() => printBarcodeCard({ title: `Barcode Pintu ${item.nama}`, subtitle: `IN: ${item.employee_barcode_in} | OUT: ${item.employee_barcode_out}`, value: `${item.employee_barcode_in} / ${item.employee_barcode_out}` })}>Print</button>
                      {/* Bug fix: sebelumnya actions.deleteBranch, diganti jadi onDelete */}
                      <button className="btn btn-danger btn-small" type="button" onClick={() => onDelete(item.id, item.nama)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
