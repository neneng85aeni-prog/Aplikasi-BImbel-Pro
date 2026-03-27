import { formatRupiah } from '../../lib/format'
import { ACCESS_OPTIONS, SALARY_TYPE_OPTIONS } from '../../lib/constants'

export function UsersTab({ userForm, setUserForm, users, branches, onSubmit, onReset, onEdit, onDelete }) {
  return (
    <div className="grid gap-lg">
      <div className="glass-card">
        <h2 className="section-title">Manajemen Karyawan</h2>
        <form onSubmit={onSubmit}>
          <div className="grid grid-2">
            <div className="form-row"><label>Nama Lengkap</label><input type="text" value={userForm.nama} onChange={(e) => setUserForm({ ...userForm, nama: e.target.value })} required /></div>
            <div className="form-row"><label>Email (Untuk Login)</label><input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required /></div>
          </div>
          
          <div className="grid grid-2">
            <div className="form-row"><label>Password {userForm.id && '(Kosongkan jika tidak diubah)'}</label><input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required={!userForm.id} /></div>
            {/* INI DIA KOLOM NO HP YANG SEMPAT HILANG! */}
            <div className="form-row"><label>No. Telepon / WA</label><input type="text" value={userForm.no_telepon} onChange={(e) => setUserForm({ ...userForm, no_telepon: e.target.value })} placeholder="Cth: 08123456789" required /></div>
          </div>
          
          <div className="grid grid-2">
            <div className="form-row"><label>Akses / Jabatan</label><select value={userForm.akses} onChange={(e) => setUserForm({ ...userForm, akses: e.target.value })}>{ACCESS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}</select></div>
            <div className="form-row"><label>Penempatan Cabang</label><select value={userForm.branch_id} onChange={(e) => setUserForm({ ...userForm, branch_id: e.target.value })}><option value="">Pusat / Semua Cabang</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}</select></div>
          </div>

          <h3 style={{ marginTop: '20px', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Setup Gaji & Tunjangan</h3>
          <div className="form-row"><label>Sistem Gaji</label><select value={userForm.salary_type} onChange={(e) => setUserForm({ ...userForm, salary_type: e.target.value })}>{SALARY_TYPE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt.replace('_', ' ').toUpperCase()}</option>)}</select></div>

          <div className="grid grid-2">
            <div className="form-row"><label>Gaji Pokok (Bulan)</label><input type="number" value={userForm.salary_fixed} onChange={(e) => setUserForm({ ...userForm, salary_fixed: e.target.value })} placeholder="0" /></div>
            <div className="form-row"><label>Tunjangan Hadir (Per Hari)</label><input type="number" value={userForm.student_fee_daily} onChange={(e) => setUserForm({ ...userForm, student_fee_daily: e.target.value })} placeholder="0" /></div>
          </div>

          <div className="grid grid-2">
            <div className="form-row"><label>Target Siswa (Bulan)</label><input type="number" value={userForm.monthly_bonus_target} onChange={(e) => setUserForm({ ...userForm, monthly_bonus_target: e.target.value })} placeholder="0" /></div>
            <div className="form-row"><label>Bonus Jika Capai Target</label><input type="number" value={userForm.bonus_amount} onChange={(e) => setUserForm({ ...userForm, bonus_amount: e.target.value })} placeholder="0" /></div>
          </div>

          <div className="btn-row" style={{ marginTop: '15px' }}>
            <button className="btn btn-primary" type="submit">{userForm.id ? 'Update' : 'Simpan'} Karyawan</button>
            <button className="btn btn-secondary" type="button" onClick={onReset}>Batal</button>
          </div>
        </form>
      </div>

      <div className="glass-card">
        <h2 className="section-title">Daftar Karyawan</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nama</th><th>Email / WA</th><th>Akses</th><th>Cabang</th><th>Aksi</th></tr></thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id}>
                  <td><b>{item.nama}</b></td>
                  <td>{item.email}<br/><span className="text-muted" style={{color: '#10b981'}}>{item.no_telepon || 'Belum ada WA'}</span></td>
                  <td style={{ textTransform: 'capitalize' }}>{item.akses}</td>
                  <td>{item.branch_nama || 'Pusat'}</td>
                  <td>
                    <div className="btn-row">
                      <button className="btn btn-secondary btn-small" onClick={() => onEdit(item)}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => onDelete(item.id)}>Hapus</button>
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
