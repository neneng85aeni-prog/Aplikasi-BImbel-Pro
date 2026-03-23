import { defaultPermissionsByRole, ACCESS_OPTIONS, INITIAL_USER_FORM, SALARY_TYPE_OPTIONS } from '../../lib/constants'
import { formatRupiah } from '../../lib/format'

export function UsersTab({ userForm, setUserForm, users, branches, onSubmit, onReset, onEdit, onDelete }) {
  return (
    <div className="grid grid-2">
      <div className="glass-card">
        <h2 className="section-title">Karyawan, kontak & skema gaji</h2>
        <form onSubmit={onSubmit}>
          <div className="form-row"><label>Nama</label><input value={userForm.nama} onChange={(e) => setUserForm({ ...userForm, nama: e.target.value })} /></div>
          <div className="grid grid-2">
            <div className="form-row"><label>Email</label><input value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} /></div>
            <div className="form-row"><label>No telepon</label><input value={userForm.no_telepon} onChange={(e) => setUserForm({ ...userForm, no_telepon: e.target.value })} /></div>
          </div>
          <div className="form-row"><label>Password {userForm.id ? '(kosongkan jika tidak ganti)' : ''}</label><input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} /></div>
          <div className="grid grid-2">
            <div className="form-row"><label>Hak akses</label><select value={userForm.akses} onChange={(e) => setUserForm({ ...userForm, akses: e.target.value, menu_permissions: defaultPermissionsByRole(e.target.value) })}>{ACCESS_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
            <div className="form-row"><label>Cabang</label><select value={userForm.branch_id} onChange={(e) => setUserForm({ ...userForm, branch_id: e.target.value })}><option value="">Pilih cabang</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select></div>
          </div>
          <div className="grid grid-2">
            <div className="form-row"><label>Tipe gaji</label><select value={userForm.salary_type} onChange={(e) => setUserForm({ ...userForm, salary_type: e.target.value })}>{SALARY_TYPE_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
            <div className="form-row"><label>Gaji tetap</label><input type="number" value={userForm.salary_fixed} onChange={(e) => setUserForm({ ...userForm, salary_fixed: e.target.value })} /></div>
          </div>
          <div className="grid grid-2">
            <div className="form-row"><label>Fee per siswa / hari</label><input type="number" value={userForm.student_fee_daily} onChange={(e) => setUserForm({ ...userForm, student_fee_daily: e.target.value })} /></div>
            <div className="form-row"><label>Target siswa / bulan</label><input type="number" value={userForm.monthly_bonus_target} onChange={(e) => setUserForm({ ...userForm, monthly_bonus_target: e.target.value })} /></div>
          </div>
          <div className="form-row"><label>Bonus otomatis saat target tercapai</label><input type="number" value={userForm.bonus_amount} onChange={(e) => setUserForm({ ...userForm, bonus_amount: e.target.value })} /></div>
          <div className="helper-box">Checklist menu detail diatur pada menu <b>Hak Akses</b>.</div>
          <div className="btn-row"><button className="btn btn-primary" type="submit">{userForm.id ? 'Update karyawan' : 'Simpan karyawan'}</button><button className="btn btn-secondary" type="button" onClick={() => onReset(INITIAL_USER_FORM)}>Reset</button></div>
        </form>
      </div>
      <div className="glass-card">
        <h2 className="section-title">Daftar karyawan</h2>
        <div className="table-wrap"><table><thead><tr><th>Nama</th><th>Role</th><th>Cabang</th><th>Kontak</th><th>Skema gaji</th><th>Aksi</th></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td><b>{item.nama}</b><div className="text-muted">{item.email}</div></td><td><span className="badge">{item.akses}</span></td><td>{item.branch_nama || '-'}</td><td>{item.no_telepon || '-'}</td><td><div className="text-muted">Tetap: {formatRupiah(item.salary_fixed)}</div><div className="text-muted">Fee siswa: {formatRupiah(item.student_fee_daily)}</div></td><td><div className="btn-row"><button className="btn btn-secondary btn-small" type="button" onClick={() => onEdit(item)}>Edit</button><button className="btn btn-danger btn-small" type="button" onClick={() => onDelete(item.id)}>Hapus</button></div></td></tr>)}</tbody></table></div>
      </div>
    </div>
  )
}
