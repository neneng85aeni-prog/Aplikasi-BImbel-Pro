import { useState } from 'react'
import { formatTanggal } from '../../lib/format'
import { EMPLOYEE_STATUS_OPTIONS } from '../../lib/constants'

export function KaryawanTab({ 
  currentUser, employeeMode, setEmployeeMode, scanEmployeeActive, setScanEmployeeActive, 
  employeeScanInfo, employeeScanText, absensiKaryawan, employeeManualForm, setEmployeeManualForm, 
  users, onSubmitManual 
}) {
  // STATE LOKAL UNTUK PENCARIAN
  const [searchQuery, setSearchQuery] = useState('')

  // 1. CEK HAK AKSES (Bisa lihat semua atau hanya punya sendiri)
  const canViewAll = currentUser?.akses === 'master' || currentUser?.akses === 'admin' || currentUser?.menu_permissions?.includes('permissions')

  // 2. FILTER BERDASARKAN USER YANG LOGIN
  const roleFilteredAbsensi = (absensiKaryawan || []).filter(item => {
    if (canViewAll) return true;
    return item.user_id === currentUser?.id;
  })

  // 3. FILTER PENCARIAN PINTAR
  const finalFilteredAbsensi = roleFilteredAbsensi.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.users?.nama?.toLowerCase().includes(q) ||
      item.status?.toLowerCase().includes(q) ||
      item.jam_datang?.includes(q) ||
      item.jam_pulang?.includes(q) ||
      formatTanggal(item.tanggal).toLowerCase().includes(q)
    );
  })

  return (
    <div className="grid gap-lg">
      <div className="grid grid-2">
        
        {/* 1. SCANNER ABSENSI */}
        <div className="glass-card">
          <h2 className="section-title">Scanner Absensi Karyawan</h2>
          <p className="text-muted" style={{ marginBottom: '20px', fontSize: '14px' }}>
            Arahkan kamera HP Anda pada QR Code yang tertempel di dinding cabang.
          </p>
          
          <div className="form-row">
            <label>Pilih Mode Absen:</label>
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

          {employeeScanText && <div className="text-muted" style={{ fontSize: '13px', marginBottom: '10px' }}>Hasil Scan: {employeeScanText}</div>}
          
          <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-muted" style={{ fontSize: '12px' }}>Status Terakhir:</span><br/>
            <b style={{ fontSize: '15px', color: employeeScanInfo.includes('berhasil') ? '#10b981' : '#ef4444' }}>{employeeScanInfo}</b>
          </div>
        </div>

        {/* 2. INPUT MANUAL (ADMIN/MASTER) */}
        {(currentUser?.akses === 'master' || currentUser?.akses === 'admin') && (
          <div className="glass-card">
            <h2 className="section-title">Input Absensi Manual</h2>
            <form onSubmit={onSubmitManual}>
              <div className="form-row">
                <label>Nama Karyawan</label>
                <select 
                  value={employeeManualForm.user_id} 
                  onChange={(e) => setEmployeeManualForm({ ...employeeManualForm, user_id: e.target.value })} 
                  required 
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
                >
                  <option value="" style={{ color: 'black' }}>-- Pilih Karyawan --</option>
                  {users.map((u) => <option key={u.id} value={u.id} style={{ color: 'black' }}>{u.nama} ({u.akses})</option>)}
                </select>
              </div>
              <div className="grid grid-2">
                <div className="form-row">
                  <label>Tanggal</label>
                  <input type="date" value={employeeManualForm.tanggal} onChange={(e) => setEmployeeManualForm({ ...employeeManualForm, tanggal: e.target.value })} required />
                </div>
                <div className="form-row">
                  <label>Status</label>
                  <select 
                    value={employeeManualForm.status} 
                    onChange={(e) => setEmployeeManualForm({ ...employeeManualForm, status: e.target.value })}
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
                  >
                    {EMPLOYEE_STATUS_OPTIONS.map((opt) => <option key={opt} value={opt} style={{ color: 'black' }}>{opt.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <label>Catatan</label>
                <input type="text" value={employeeManualForm.catatan} onChange={(e) => setEmployeeManualForm({ ...employeeManualForm, catatan: e.target.value })} placeholder="Cth: Lupa scan / Sakit" />
              </div>
              <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '12px' }}>💾 Simpan Manual</button>
            </form>
          </div>
        )}

      </div>

      {/* 3. TABEL RIWAYAT DENGAN FILTER & PENCARIAN */}
      <div className="glass-card">
        <div className="btn-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Riwayat Absensi Karyawan</h2>
          
          <input 
            type="text" 
            placeholder="🔍 Cari nama / status / tanggal..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              padding: '10px 14px', 
              borderRadius: '8px', 
              width: '100%', 
              maxWidth: '350px',
              border: '1px solid rgba(255,255,255,0.2)', 
              background: 'rgba(255,255,255,0.05)', 
              color: 'inherit',
              fontSize: '14px'
            }}
          />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Tanggal</th><th>Karyawan</th><th>Status</th><th>Jam Masuk - Pulang</th></tr>
            </thead>
            <tbody>
              {finalFilteredAbsensi.map((item) => (
                <tr key={item.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatTanggal(item.tanggal)}</td>
                  <td><b>{item.users?.nama || '-'}</b></td>
                  <td>
                    <span style={{ 
                      fontWeight: 'bold', 
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      background: item.status === 'hadir' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: item.status === 'hadir' ? '#10b981' : '#ef4444'
                    }}>{item.status.toUpperCase()}</span>
                  </td>
                  <td>{item.jam_datang || '--:--'} s/d {item.jam_pulang || '--:--'}</td>
                </tr>
              ))}
              {finalFilteredAbsensi.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    {searchQuery ? 'Data pencarian tidak ditemukan.' : 'Belum ada data absensi untuk ditampilkan.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
