import { INITIAL_STUDENT_ATTENDANCE_FORM } from '../../lib/constants'
import { formatDateTime, formatTanggal } from '../../lib/format'

export function StudentAttendanceTab({ studentAttendanceForm, setStudentAttendanceForm, siswaTampil, guruOptions, onSubmitAttendance, scanStudentActive, setScanStudentActive, studentScanInfo, absensiSiswaTampil, onSelectStudentAttendance }) {
  return (
    <div className="grid grid-2">
      <div className="glass-card">
        <h2 className="section-title">Absensi siswa terpisah dari kasir</h2>
        <div id="reader-siswa" className="reader-box"></div>
        <p className="text-muted" style={{ marginTop: 12 }}>{studentScanInfo}</p>
        <div className="btn-row"><button className="btn btn-primary" type="button" onClick={() => setScanStudentActive(true)}>{scanStudentActive ? 'Scanning...' : 'Start scanning'}</button><button className="btn btn-secondary" type="button" onClick={() => setScanStudentActive(false)}>Stop</button></div>
        <form onSubmit={onSubmitAttendance} style={{ marginTop: 20 }}>
          <div className="form-row"><label>Siswa</label><select value={studentAttendanceForm.siswa_id} onChange={(e) => { setStudentAttendanceForm({ ...studentAttendanceForm, siswa_id: e.target.value }); onSelectStudentAttendance?.(e.target.value) }}><option value="">Pilih siswa</option>{siswaTampil.map((item) => <option key={item.id} value={item.id}>{item.nama} • {item.branches?.nama || '-'}</option>)}</select></div>
          <div className="grid grid-2">
            <div className="form-row"><label>Tanggal</label><input type="date" value={studentAttendanceForm.tanggal} onChange={(e) => setStudentAttendanceForm({ ...studentAttendanceForm, tanggal: e.target.value })} /></div>
            <div className="form-row"><label>Mode</label><select value={studentAttendanceForm.mode} onChange={(e) => setStudentAttendanceForm({ ...studentAttendanceForm, mode: e.target.value })}><option value="masuk">Masuk</option><option value="pulang">Pulang</option></select></div>
          </div>
          <div className="grid grid-2">
            <div className="form-row"><label>Status</label><select value={studentAttendanceForm.status} onChange={(e) => setStudentAttendanceForm({ ...studentAttendanceForm, status: e.target.value })}><option value="hadir">Hadir</option><option value="izin">Izin</option><option value="sakit">Sakit</option><option value="alpha">Alpha</option></select></div>
            <div className="form-row"><label>Guru yang handle hari ini</label><select value={studentAttendanceForm.guru_handle_id} onChange={(e) => setStudentAttendanceForm({ ...studentAttendanceForm, guru_handle_id: e.target.value })}><option value="">Pilih guru</option>{guruOptions.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select></div>
          </div>
          <div className="form-row"><label>Keterangan</label><textarea value={studentAttendanceForm.catatan} onChange={(e) => setStudentAttendanceForm({ ...studentAttendanceForm, catatan: e.target.value })} /></div>
          <div className="btn-row"><button className="btn btn-primary" type="submit">Simpan absensi siswa</button><button className="btn btn-secondary" type="button" onClick={() => setStudentAttendanceForm(INITIAL_STUDENT_ATTENDANCE_FORM)}>Reset</button></div>
        </form>
      </div>
      <div className="glass-card">
        <h2 className="section-title">Riwayat absensi siswa</h2>
        <div className="table-wrap"><table><thead><tr><th>Tanggal</th><th>Siswa</th><th>Guru handle</th><th>Status</th><th>Masuk</th><th>Pulang</th></tr></thead><tbody>{absensiSiswaTampil.map((item) => <tr key={item.id}><td>{formatTanggal(item.tanggal)}</td><td>{item.siswa?.nama || '-'}</td><td>{item.guru_handle?.nama || item.siswa?.users?.nama || '-'}</td><td><span className="badge">{item.status}</span></td><td>{formatDateTime(item.jam_masuk)}</td><td>{formatDateTime(item.jam_pulang)}</td></tr>)}</tbody></table></div>
      </div>
    </div>
  )
}
