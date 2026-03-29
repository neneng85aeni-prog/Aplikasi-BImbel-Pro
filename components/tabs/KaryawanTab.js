import { useState } from 'react'
import { formatTanggal } from '../../lib/format'
import { EMPLOYEE_STATUS_OPTIONS } from '../../lib/constants'

// FUNGSI BANTUAN: Menyulap teks waktu berantakan (ISO 8601) menjadi jam rapi (09:31)
function formatJam(timeString) {
  if (!timeString) return '--:--';
  // Jika formatnya sudah pendek dari input manual (misal: "09:00"), biarkan saja
  if (timeString.length === 5 && timeString.includes(':')) return timeString;
  
  try {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return timeString; 
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return timeString;
  }
}

export function KaryawanTab({ 
  currentUser, employeeMode, setEmployeeMode, scanEmployeeActive, setScanEmployeeActive, 
  employeeScanInfo, employeeScanText, absensiKaryawan, employeeManualForm, setEmployeeManualForm, 
  users, onSubmitManual 
}) {
  // STATE LOKAL UNTUK PENCARIAN & PAGINASI
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10 // Bisa diubah jika ingin menampilkan lebih banyak/sedikit baris per halaman

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
      (item.jam_datang && item.jam_datang.includes(q)) ||
      (item.jam_pulang && item.jam_pulang.includes(q)) ||
      formatTanggal(item.tanggal).toLowerCase().includes(q)
    );
  })

  // 4. POTONG DATA UNTUK PAGINASI (HALAMAN) AGAR TIDAK BERAT
  const totalPages = Math.ceil(finalFilteredAbsensi.length / ITEMS_PER_PAGE);
  const paginatedData = finalFilteredAbsensi.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset kembali ke halaman 1 setiap kali mengetik pencarian
  };

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

        {/* 2. INPUT MANUAL (ADMIN/MASTER SAJA) */}
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

      {/* 3. TABEL RIWAYAT DENGAN FILTER & PENCARIAN & PAGINASI */}
      <div className="glass-card">
        <div className="btn-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Riwayat Absensi Karyawan</h2>
          
          <input 
            type="text" 
            placeholder="🔍 Cari nama / status / tanggal..." 
            value={searchQuery}
            onChange={handleSearch}
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
              {paginatedData.map((item) => (
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
                  {/* PENGGUNAAN FUNGSI FORMAT JAM DI SINI */}
                  <td>{formatJam(item.jam_datang)} s/d {formatJam(item.jam_pulang)}</td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    {searchQuery ? 'Data pencarian tidak ditemukan.' : 'Belum ada data absensi untuk ditampilkan.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* KONTROL PAGINASI */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>
              Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, finalFilteredAbsensi.length)} dari {finalFilteredAbsensi.length} data
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-secondary btn-small" 
                disabled={currentPage === 1} 
                onClick={() => goToPage(currentPage - 1)}
              >
                ◀ Prev
              </button>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: '14px', fontWeight: 'bold' }}>
                Halaman {currentPage} / {totalPages}
              </div>
              <button 
                className="btn btn-secondary btn-small" 
                disabled={currentPage === totalPages} 
                onClick={() => goToPage(currentPage + 1)}
              >
                Next ▶
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
