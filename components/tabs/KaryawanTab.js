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
        
        {/* 1. KARTU SCANNER ABSENSI KARYAWAN */}
        <div className="glass-card">
          <h2 className="section-title">Scanner Absensi Karyawan</h2>
          <p className="text-muted" style={{ marginBottom: '20px', fontSize: '14px' }}>
            Arahkan kamera HP Anda pada QR Code yang tertempel di dinding cabang. (QR Code dapat di-print dari menu Overview).
          </p>
          
          <div className="form-row">
            <label>Pilih Mode Absen:</label>
            {/* BAGIAN INI YANG DIPERBAIKI (Hapus background putih, ganti ke padding transparan) */}
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
              <button className="btn btn-primary" onClick={() => setScanEmployeeActive(true)} style={{ width: '100%', padding: '14px', fontSize: '15px' }}>
                📷 Buka Kamera & Scan Sekarang
              </button>
            ) : (
              <div className="scanner-container">
                <div id="reader-karyawan" style={{ width: '100%' }}></div>
                <button className="btn btn-danger" onClick={() => setScanEmployeeActive(false)} style={{ width: '100%', marginTop: '10px' }}>Tutup Kamera</button>
              </div>
            )}
          </div>

          {employeeScanText && <div className="text-muted" style={{ fontSize: '13px', marginBottom: '10px' }}>Hasil Scan Terakhir: {employeeScanText}</div>}
          
          <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-muted" style={{ fontSize: '12px' }}>Status Absensi Terakhir:</span><br/>
            <b style={{ fontSize: '15px', color: employeeScanInfo.includes('berhasil') ? '#10b981' : '#ef4444' }}>{employeeScanInfo}</b>
          </div>
        </div>

        {/* 2. KARTU INPUT MANUAL ABSENSI (HANYA UNTUK ADMIN/MASTER) */}
        {(currentUser?.akses === 'master' || currentUser?.akses === 'admin') && (
          <div className="glass-card">
            <h2 className="section-title">Input Absensi Manual (Admin)</h2>
            <form onSubmit={onSubmitManual}>
              <div className="form-row">
                <label>Nama Karyawan</label>
                <select value={employeeManualForm.user_id} onChange={(e) => setEmployeeManualForm({ ...employeeManualForm, user_id: e.target.value })} required>
                  <option value="">-- Pilih Karyawan --</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.nama} ({u.akses})</option>)}
                </select>
              </div>
              <div className="grid grid-2">
                <div className="form-row">
                  <label>Tanggal</label>
                  <input type="date" value={employeeManualForm.tanggal} onChange={(e) => setEmployeeManualForm({ ...employeeManualForm, tanggal: e.target.value })} required />
                </div>
                <div className="form-row">
                  <label>Status</label>
                  <select value={employeeManualForm.status} onChange={(e) => setEmployeeManualForm({ ...employeeManualForm, status: e.target.value })}>
                    {EMPLOYEE_STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              {(employeeManualForm.status === 'hadir' || employeeManualForm.status === 'terlambat') && (
                <div className="grid grid-2">
                  <div className="form-row"><label>Jam Masuk (Opsional)</label><input type="time" value={employeeManualForm.jam_datang} onChange={(e) => setEmployeeManualForm({ ...employeeManualForm, jam_datang: e.target.value })} /></div>
                  <div className="form-row"><label>Jam Pulang (Opsional)</label><input type="time" value={employeeManualForm.jam_pulang} onChange={(e) => setEmployeeManualForm({ ...employeeManualForm, jam_pulang: e.target.value })} /></div>
                </div>
              )}
              <div className="form-row">
                <label>Catatan Tambahan</label>
                <input type="text" value={employeeManualForm.catatan} onChange={(e) => setEmployeeManualForm({ ...employeeManualForm, catatan: e.target.value })} placeholder="Cth: Lupa absen pagi / Sakit tipes" />
              </div>
              <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '12px' }}>💾 Simpan Manual</button>
            </form>
          </div>
        )}

      </div>

      {/* 3. TABEL RIWAYAT ABSENSI */}
      <div className="glass-card">
        <h2 className="section-title">Riwayat Absensi Karyawan</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Tanggal</th><th>Karyawan</th><th>Cabang</th><th>Status</th><th>Jam Masuk - Pulang</th><th>Catatan</th></tr>
            </thead>
            <tbody>
              {absensiKaryawan.map((item) => (
                <tr key={item.id}>
                  <td>{formatTanggal(item.tanggal)}</td>
                  <td><b>{item.users?.nama || '-'}</b></td>
                  <td>{item.users?.branch_nama || 'Pusat'}</td>
                  <td>
                    <span style={{ 
                      fontWeight: 'bold', 
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      background: item.status === 'hadir' ? 'rgba(16, 185, 129, 0.1)' : item.status === 'alpha' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: item.status === 'hadir' ? '#10b981' : item.status === 'alpha' ? '#ef4444' : '#f59e0b',
                      textTransform: 'uppercase'
                    }}>{item.status}</span>
                  </td>
                  <td>{item.jam_datang || '--:--'} s/d {item.jam_pulang || '--:--'}</td>
                  <td className="text-muted">{item.catatan || '-'}</td>
                </tr>
              ))}
              {absensiKaryawan.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>Belum ada data absensi.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
