import { useState } from 'react'
import { formatTanggal } from '../../lib/format'
import { EMPLOYEE_STATUS_OPTIONS } from '../../lib/constants'

// ==========================================
// SETTING STANDAR JAM KERJA BIMBEL
// Ubah angka ini sesuai jam operasional cabang
const BATAS_JAM_MASUK = '08:00'; 
const BATAS_JAM_PULANG = '17:00';
// ==========================================

// FUNGSI BANTUAN 1: Format ISO jadi Jam (09:31)
function formatJam(timeString) {
  if (!timeString) return '--:--';
  if (timeString.length === 5 && timeString.includes(':')) return timeString;
  try {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return timeString; 
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
  } catch {
    return timeString;
  }
}

// FUNGSI BANTUAN 2: Cek Keterlambatan
function getKeteranganWaktu(jamDatang, jamPulang) {
  const datang = jamDatang ? formatJam(jamDatang) : null;
  const pulang = jamPulang ? formatJam(jamPulang) : null;
  let keterangan = [];

  if (datang && datang !== '--:--' && datang > BATAS_JAM_MASUK) {
    keterangan.push('Telat Masuk');
  }
  if (pulang && pulang !== '--:--' && pulang < BATAS_JAM_PULANG) {
    keterangan.push('Pulang Cepat');
  }
  return keterangan;
}

export function KaryawanTab({ 
  currentUser, employeeMode, setEmployeeMode, scanEmployeeActive, setScanEmployeeActive, 
  employeeScanInfo, employeeScanText, absensiKaryawan, employeeManualForm, setEmployeeManualForm, 
  users, onSubmitManual 
}) {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState(firstDay)
  const [endDate, setEndDate] = useState(lastDay)
  const [currentPage, setCurrentPage] = useState(1)
  
  // PERMINTAAN: 5 ROWS PER HALAMAN
  const ITEMS_PER_PAGE = 5 

  // 1. CEK HAK AKSES
  const canViewAll = currentUser?.akses === 'master' || currentUser?.akses === 'admin' || currentUser?.menu_permissions?.includes('permissions')

  // 2. FILTER BERDASARKAN USER YANG LOGIN
  const roleFilteredAbsensi = (absensiKaryawan || []).filter(item => {
    if (canViewAll) return true;
    return item.user_id === currentUser?.id;
  })

  // 3. FILTER PERIODE & PENCARIAN PINTAR
  const finalFilteredAbsensi = roleFilteredAbsensi.filter(item => {
    const itemDate = item.tanggal;
    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const isMatch = (
        item.users?.nama?.toLowerCase().includes(q) ||
        item.status?.toLowerCase().includes(q) ||
        (item.jam_datang && item.jam_datang.includes(q)) ||
        (item.jam_pulang && item.jam_pulang.includes(q)) ||
        formatTanggal(item.tanggal).toLowerCase().includes(q)
      );
      if (!isMatch) return false;
    }
    return true;
  })

  // 4. POTONG DATA UNTUK PAGINASI
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
    setCurrentPage(1); 
  };

  // FUNGSI BARU: DOWNLOAD CSV BERDASARKAN FILTER
  const downloadFilteredData = () => {
    if (finalFilteredAbsensi.length === 0) {
      alert("Tidak ada data untuk di-download pada periode ini.");
      return;
    }

    const rows = finalFilteredAbsensi.map(item => {
      const ketWaktu = getKeteranganWaktu(item.jam_datang, item.jam_pulang).join(' & ');
      const statusKet = ketWaktu ? ` (${ketWaktu})` : '';
      
      return [
        item.tanggal,
        `"${item.users?.nama || '-'}"`,
        `"${item.status.toUpperCase()}${statusKet}"`,
        `${formatJam(item.jam_datang)} s/d ${formatJam(item.jam_pulang)}`,
        `"${item.catatan || '-'}"`
      ].join(',')
    });

    const csvContent = ['Tanggal,Karyawan,Status & Pelanggaran Waktu,Jam Masuk - Pulang,Catatan'].join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Laporan_Absensi_${startDate}_sd_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid gap-lg">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* 1. SCANNER ABSENSI */}
        <div className="glass-card">
          <h2 className="section-title">Scanner Absensi Karyawan</h2>
          <p className="text-muted" style={{ marginBottom: '20px', fontSize: '14px' }}>
            Arahkan kamera HP Anda pada QR Code yang tertempel di dinding cabang.
          </p>
          
          <div className="form-row">
            <label>Pilih Mode Absen:</label>
            <div style={{ display: 'flex', gap: '15px', padding: '10px 0', flexWrap: 'wrap' }}>
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
                <div id="reader-karyawan" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }}></div>
                <button className="btn btn-danger" onClick={() => setScanEmployeeActive(false)} style={{ width: '100%', marginTop: '10px', padding: '12px' }}>Tutup Kamera</button>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
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

              {employeeManualForm.status === 'hadir' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                  <div className="form-row" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12px' }}>Jam Datang (Opsional)</label>
                    <input type="time" value={employeeManualForm.jam_datang || ''} onChange={(e) => setEmployeeManualForm({ ...employeeManualForm, jam_datang: e.target.value })} style={{ width: '100%' }} />
                  </div>
                  <div className="form-row" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12px' }}>Jam Pulang (Opsional)</label>
                    <input type="time" value={employeeManualForm.jam_pulang || ''} onChange={(e) => setEmployeeManualForm({ ...employeeManualForm, jam_pulang: e.target.value })} style={{ width: '100%' }} />
                  </div>
                </div>
              )}

              <div className="form-row">
                <label>Catatan</label>
                <input type="text" value={employeeManualForm.catatan} onChange={(e) => setEmployeeManualForm({ ...employeeManualForm, catatan: e.target.value })} placeholder="Cth: Lupa scan / Sakit" />
              </div>
              <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '12px' }}>💾 Simpan Manual</button>
            </form>
          </div>
        )}

      </div>

      {/* 3. TABEL RIWAYAT DENGAN FILTER PERIODE, PENCARIAN & DOWNLOAD */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Riwayat Absensi Karyawan</h2>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} style={{ background: 'transparent', border: 'none', color: 'inherit', outline: 'none', fontSize: '13px' }} />
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>s/d</span>
              <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} style={{ background: 'transparent', border: 'none', color: 'inherit', outline: 'none', fontSize: '13px' }} />
            </div>

            <input 
              type="text" 
              placeholder="🔍 Cari nama/status..." 
              value={searchQuery}
              onChange={handleSearch}
              style={{ 
                padding: '10px 14px', borderRadius: '8px', width: '200px',
                border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', 
                color: 'inherit', fontSize: '13px'
              }}
            />

            <button className="btn btn-primary" onClick={downloadFilteredData} style={{ padding: '10px 14px', fontSize: '13px' }}>
              ⬇️ Download CSV
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Tanggal</th><th>Karyawan</th><th>Status</th><th>Jam Masuk - Pulang</th></tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => {
                const keteranganWaktu = getKeteranganWaktu(item.jam_datang, item.jam_pulang);

                return (
                  <tr key={item.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatTanggal(item.tanggal)}</td>
                    <td><b>{item.users?.nama || '-'}</b></td>
                    <td>
                      <span style={{ 
                        fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', fontSize: '12px',
                        background: item.status === 'hadir' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: item.status === 'hadir' ? '#10b981' : '#ef4444'
                      }}>{item.status.toUpperCase()}</span>
                    </td>
                    <td>
                      {formatJam(item.jam_datang)} s/d {formatJam(item.jam_pulang)}
                      
                      {keteranganWaktu.length > 0 && (
                        <div style={{ marginTop: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {keteranganWaktu.map((ket, i) => (
                            <span key={i} style={{ background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                              ⚠️ {ket}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    {searchQuery || startDate || endDate ? 'Data pencarian / periode tidak ditemukan.' : 'Belum ada data absensi untuk ditampilkan.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap', gap: '15px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>
              Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, finalFilteredAbsensi.length)} dari {finalFilteredAbsensi.length} data
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary btn-small" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>
                ◀ Prev
              </button>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: '14px', fontWeight: 'bold' }}>
                {currentPage} / {totalPages}
              </div>
              <button className="btn btn-secondary btn-small" disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}>
                Next ▶
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
