import { EMPLOYEE_GLOBAL_IN, EMPLOYEE_GLOBAL_OUT, EMPLOYEE_STATUS_OPTIONS, INITIAL_EMPLOYEE_MANUAL_FORM } from '../../lib/constants'
import { formatDateTime, formatTanggal } from '../../lib/format'
import { BarcodePreview, printBarcodeCard } from '../ui/BarcodePreview'

export function KaryawanTab({ currentUser, employeeMode, setEmployeeMode, scanEmployeeActive, setScanEmployeeActive, employeeScanInfo, employeeScanText, absensiKaryawan, employeeBarcodeIn, employeeBarcodeOut, employeeManualForm, setEmployeeManualForm, users, onSubmitManual }) {
  return (
    <div className="grid grid-2">
      <div className="glass-card">
        <h2 className="section-title">Absensi karyawan via barcode global</h2>
        <p className="text-muted">Semua user memakai barcode yang sama. Sistem mengenali siapa yang scan dari user yang sedang login.</p>
        <div className="btn-row" style={{ marginBottom: 12 }}>
          <button className={`tab ${employeeMode === 'datang' ? 'active' : ''}`} type="button" onClick={() => setEmployeeMode('datang')}>Mode datang</button>
          <button className={`tab ${employeeMode === 'pulang' ? 'active' : ''}`} type="button" onClick={() => setEmployeeMode('pulang')}>Mode pulang</button>
        </div>
        <div id="reader-karyawan" className="reader-box"></div>
        <p className="text-muted" style={{ marginTop: 12 }}>{employeeScanInfo}</p>
        <div className="btn-row"><button className="btn btn-primary" type="button" onClick={() => setScanEmployeeActive(true)}>{scanEmployeeActive ? 'Scanning...' : 'Start scanning'}</button><button className="btn btn-secondary" type="button" onClick={() => setScanEmployeeActive(false)}>Stop</button></div>
        <div className="helper-box" style={{ marginTop: 16 }}><b>Login aktif:</b> {currentUser?.nama} • scan: {employeeScanText || '-'} • kode valid: {employeeMode === 'datang' ? employeeBarcodeIn || EMPLOYEE_GLOBAL_IN : employeeBarcodeOut || EMPLOYEE_GLOBAL_OUT}</div>
        <div className="grid grid-2" style={{ marginTop: 16 }}>
          <BarcodePreview value={employeeBarcodeIn || EMPLOYEE_GLOBAL_IN} title="Barcode masuk" compact />
          <BarcodePreview value={employeeBarcodeOut || EMPLOYEE_GLOBAL_OUT} title="Barcode pulang" compact />
        </div>
        <div className="btn-row"><button className="btn btn-secondary" type="button" onClick={() => printBarcodeCard({ title: 'Barcode Masuk Karyawan', subtitle: 'Tempel di pintu masuk', value: employeeBarcodeIn || EMPLOYEE_GLOBAL_IN })}>Print masuk</button><button className="btn btn-secondary" type="button" onClick={() => printBarcodeCard({ title: 'Barcode Pulang Karyawan', subtitle: 'Tempel di pintu keluar', value: employeeBarcodeOut || EMPLOYEE_GLOBAL_OUT })}>Print pulang</button></div>
      </div>
      <div className="glass-card">
        <h2 className="section-title">Input manual absensi / ketidakhadiran</h2>
        <form onSubmit={onSubmitManual}>
          <div className="form-row"><label>Karyawan</label><select value={employeeManualForm.user_id} onChange={(e) => setEmployeeManualForm({ ...employeeManualForm, user_id: e.target.value })}><option value="">Pilih karyawan</option>{users.map((item) => <option key={item.id} value={item.id}>{item.nama} • {item.akses}</option>)}</select></div>
          <div className="grid grid-2">
            <div className="form-row"><label>Tanggal</label><input type="date" value={employeeManualForm.tanggal} onChange={(e) => setEmployeeManualForm({ ...employeeManualForm, tanggal: e.target.value })} /></div>
            <div className="form-row"><label>Status</label><select value={employeeManualForm.status} onChange={(e) => setEmployeeManualForm({ ...employeeManualForm, status: e.target.value })}>{EMPLOYEE_STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
          </div>
          <div className="grid grid-2">
            <div className="form-row"><label>Jam datang (opsional)</label><input type="datetime-local" value={employeeManualForm.jam_datang} onChange={(e) => setEmployeeManualForm({ ...employeeManualForm, jam_datang: e.target.value })} /></div>
            <div className="form-row"><label>Jam pulang (opsional)</label><input type="datetime-local" value={employeeManualForm.jam_pulang} onChange={(e) => setEmployeeManualForm({ ...employeeManualForm, jam_pulang: e.target.value })} /></div>
          </div>
          <div className="form-row"><label>Keterangan</label><textarea value={employeeManualForm.catatan} onChange={(e) => setEmployeeManualForm({ ...employeeManualForm, catatan: e.target.value })} /></div>
          <div className="btn-row"><button className="btn btn-primary" type="submit">Simpan absensi manual</button><button className="btn btn-secondary" type="button" onClick={() => setEmployeeManualForm(INITIAL_EMPLOYEE_MANUAL_FORM)}>Reset</button></div>
        </form>
        <div className="table-wrap" style={{ marginTop: 18 }}><table><thead><tr><th>Tanggal</th><th>Karyawan</th><th>Status</th><th>Datang</th><th>Pulang</th><th>Keterangan</th></tr></thead><tbody>{absensiKaryawan.map((item) => <tr key={item.id}><td>{formatTanggal(item.tanggal)}</td><td>{item.users?.nama || '-'}</td><td><span className="badge">{item.status}</span></td><td>{formatDateTime(item.jam_datang)}</td><td>{formatDateTime(item.jam_pulang)}</td><td>{item.catatan || '-'}</td></tr>)}</tbody></table></div>
      </div>
    </div>
  )
}
