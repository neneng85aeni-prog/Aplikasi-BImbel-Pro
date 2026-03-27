import { formatTanggal } from '../../lib/format'
import { EMPLOYEE_STATUS_OPTIONS } from '../../lib/constants'

export function KaryawanTab({ 
  currentUser, employeeMode, setEmployeeMode, scanEmployeeActive, setScanEmployeeActive, 
  employeeScanInfo, employeeScanText, absensiKaryawan, employeeBarcodeIn, employeeBarcodeOut, 
  employeeManualForm, setEmployeeManualForm, users, onSubmitManual 
}) {
  return (
    <div className="grid gap-lg">
      <div className="grid grid-2">
        <div className="glass-card">
          <h2 className="section-title">Scanner Absensi Karyawan</h2>
          <p className="text-muted" style={{ marginBottom: '20px', fontSize: '14px' }}>
            Arahkan kamera HP ke QR Code.
          </p>
          
          <div className="form-row">
            <label>Pilih Mode Absen:</label>
            {/* FIX: Background dihapus agar tidak silau putih */}
            <div style={{ display: 'flex', gap: '20px', padding: '10px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                <input type="radio" value="datang" checked={employeeMode === 'datang'} onChange={(e) => setEmployeeMode(e.target.value)} /> Masuk / Datang
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                <input type="radio" value="pulang" checked={employeeMode === 'pulang'} onChange={(e) => setEmployeeMode(e.target.value)} /> Pulang
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            {!scanEmployeeActive ? (
              <button className="btn btn-primary" onClick={() => setScanEmployeeActive(true)} style={{ width: '100%', padding: '14px' }}>📷 Buka Kamera</button>
            ) : (
              <div className="scanner-container">
                <div id="reader-karyawan" style={{ width: '100%' }}></div>
                <button className="btn btn-danger" onClick={() => setScanEmployeeActive(false)} style={{ width: '100%', marginTop: '10px' }}>Tutup</button>
              </div>
            )}
          </div>

          <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-muted" style={{ fontSize: '12px' }}>Status:</span><br/>
            <b style={{ color: employeeScanInfo.includes('berhasil') ? '#10b981' : '#ef4444' }}>{employeeScanInfo}</b>
          </div>
        </div>

        {(currentUser?.akses === 'master' || currentUser?.akses === 'admin') && (
          <div className="glass-card">
            <h2 className="section-title">Absensi Manual</h2>
            <form onSubmit={onSubmitManual}>
              <div className="form-row">
                <label>Karyawan</label>
                <select value={employeeManualForm.user_id} onChange={(e) => setEmployeeManualForm({ ...employeeManualForm, user_id: e.target.value })} required style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                  <option value="" style={{color: 'black'}}>-- Pilih --</option>
                  {users.map((u) => <option key={u.id} value={u.id} style={{color: 'black'}}>{u.nama}</option>)}
                </select>
              </div>
              <div className="grid grid-2">
                <div className="form-row"><label>Tanggal</label><input type="date" value={employeeManualForm.tanggal} onChange={(e) => setEmployeeManualForm({ ...employeeManualForm, tanggal: e.target.value })} required /></div>
                <div className="form-row">
                  <label>Status</label>
                  <select value={employeeManualForm.status} onChange={(e) => setEmployeeManualForm({ ...employeeManualForm, status: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                    {EMPLOYEE_STATUS_OPTIONS.map((opt) => <option key={opt} value={opt} style={{color: 'black'}}>{opt.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>Simpan Manual</button>
            </form>
          </div>
        )}
      </div>

      <div className="glass-card">
        <h2 className="section-title">Riwayat Absensi</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Tanggal</th><th>Karyawan</th><th>Status</th><th>Jam</th></tr></thead>
            <tbody>
              {absensiKaryawan.map((item) => (
                <tr key={item.id}>
                  <td>{formatTanggal(item.tanggal)}</td>
                  <td><b>{item.users?.nama}</b></td>
                  <td>{item.status}</td>
                  <td>{item.jam_datang || '--'} - {item.jam_pulang || '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
