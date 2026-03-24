import { INITIAL_BONUS_FORM } from '../../lib/constants'
import { formatRupiah, formatTanggal } from '../../lib/format'

export function PayrollTab({ payrollRows, bonusForm, setBonusForm, users, bonusManual, onSubmitBonus }) {
  return (
    <div className="grid grid-2">
      <div className="glass-card">
        <h2 className="section-title">Payroll bulanan final</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Hadir</th>
                <th>Izin</th>
                <th>Alpha</th>
                <th>Gaji pokok</th>
                <th>Fee siswa</th>
                <th>Tunjangan tetap</th>
                <th>Tunjangan hadir</th>
                <th>Bonus</th>
                <th>Potongan</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {payrollRows.map((item) => (
                <tr key={item.id}>
                  <td><b>{item.nama}</b><div className="text-muted">{item.akses}</div></td>
                  <td>{item.hadir || 0}</td>
                  <td>{item.izin || 0}</td>
                  <td>{item.alpha || 0}</td>
                  <td>{formatRupiah(item.gajiPokok || 0)}</td>
                  <td>{formatRupiah(item.feeSiswa || item.gajiSiswa || 0)}</td>
                  <td>{formatRupiah(item.tunjanganTetap || 0)}</td>
                  <td>{formatRupiah(item.tunjanganHadir || 0)}</td>
                  <td>{formatRupiah((item.bonusOtomatis || 0) + (item.bonusManual || 0))}</td>
                  <td>{formatRupiah(item.potongan || 0)}</td>
                  <td><b>{formatRupiah(item.totalGaji || 0)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="glass-card">
        <h2 className="section-title">Input bonus manual</h2>
        <form onSubmit={onSubmitBonus}>
          <div className="form-row"><label>Karyawan</label><select value={bonusForm.user_id} onChange={(e) => setBonusForm({ ...bonusForm, user_id: e.target.value })}><option value="">Pilih karyawan</option>{users.map((item) => <option key={item.id} value={item.id}>{item.nama} - {item.akses}</option>)}</select></div>
          <div className="grid grid-2">
            <div className="form-row"><label>Tanggal</label><input type="date" value={bonusForm.bonus_date} onChange={(e) => setBonusForm({ ...bonusForm, bonus_date: e.target.value })} /></div>
            <div className="form-row"><label>Nominal bonus</label><input type="number" value={bonusForm.amount} onChange={(e) => setBonusForm({ ...bonusForm, amount: e.target.value })} /></div>
          </div>
          <div className="form-row"><label>Keterangan</label><textarea value={bonusForm.description} onChange={(e) => setBonusForm({ ...bonusForm, description: e.target.value })} /></div>
          <div className="btn-row"><button className="btn btn-primary" type="submit">Simpan bonus</button><button className="btn btn-secondary" type="button" onClick={() => setBonusForm(INITIAL_BONUS_FORM)}>Reset</button></div>
        </form>
        <div className="table-wrap" style={{ marginTop: 18 }}><table><thead><tr><th>Tanggal</th><th>Karyawan</th><th>Nominal</th><th>Catatan</th></tr></thead><tbody>{bonusManual.map((item) => <tr key={item.id}><td>{formatTanggal(item.bonus_date)}</td><td>{item.user_nama || '-'}</td><td>{formatRupiah(item.amount)}</td><td>{item.description || '-'}</td></tr>)}</tbody></table></div>
      </div>
    </div>
  )
}
