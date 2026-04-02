import { useState } from 'react'
import { formatTanggal } from '../../lib/format'

export function PerkembanganTab({ 
  user, perkembanganForm, setPerkembanganForm, siswaTampil, guruOptions, 
  perkembanganHistory, selectedProgressStudent, progressInputMode, setProgressInputMode, 
  scanStudentActive, setScanStudentActive, studentScanInfo, onSelectProgressStudent, 
  onSubmit, onSendPerkembanganWA, perkembanganTampil 
}) {
  
  // === SETUP DEFAULT: BULAN BERJALAN ===
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  // === STATE LOKAL UNTUK PENCARIAN & PAGINASI ===
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [currentPage, setCurrentPage] = useState(1);
  
  // PERMINTAAN: MAKSIMAL 10 DATA
  const ITEMS_PER_PAGE = 10;

  // === GEMBOK UTAMA (SUPER KETAT) ===
  const canAccessSiswaMenu = Array.isArray(user?.menu_permissions) && user.menu_permissions.includes('siswa');

  // === FILTER CERDAS UNTUK TABEL RIWAYAT ===
  

  // === PEMOTONGAN DATA UNTUK HALAMAN (PAGINASI) ===
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const paginatedData = filteredHistory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // === FITUR BARU: DOWNLOAD CSV SESUAI FILTER ===
  const handleDownload = () => {
    let csv = "Tanggal,Siswa,Guru Penginput,Catatan\n";
    filteredHistory.forEach(item => {
      const tgl = formatTanggal(item.tanggal);
      const siswa = item.siswa?.nama || '-';
      const guru = item.users?.nama || '-';
      // Bersihkan catatan dari koma dan baris baru agar CSV tidak berantakan
      const catatan = (item.catatan || '').replace(/,/g, ' ').replace(/\n/g, ' '); 
      csv += `"${tgl}","${siswa}","${guru}","${catatan}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Laporan_Perkembangan_${startDate || 'Semua'}_sd_${endDate || 'Semua'}.csv`;
    link.click();
  };

  return (
    <div className="grid gap-lg">
      <div className="grid grid-2">
        
        {/* BAGIAN KIRI: INPUT PROGRESS OLEH GURU/ADMIN */}
        <div className="glass-card">
          <div className="btn-row" style={{ justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Input Perkembangan</h2>
            <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                <input type="radio" checked={progressInputMode === 'scan'} onChange={() => setProgressInputMode('scan')} /> Scan Barcode
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                <input type="radio" checked={progressInputMode === 'manual'} onChange={() => setProgressInputMode('manual')} /> Cari Manual
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            {progressInputMode === 'scan' ? (
              <div>
                {!scanStudentActive ? (
                  <button type="button" className="btn btn-secondary" onClick={() => setScanStudentActive(true)} style={{ width: '100%', padding: '12px' }}>📷 Buka Scanner Siswa</button>
                ) : (
                  <div className="scanner-container">
                    <div id="reader-siswa" style={{ width: '100%' }}></div>
                    <button type="button" className="btn btn-danger" onClick={() => setScanStudentActive(false)} style={{ width: '100%', marginTop: '10px' }}>Tutup Scanner</button>
                  </div>
                )}
                <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#3b82f6' }}>{studentScanInfo}</div>
              </div>
            ) : (
              <div className="form-row">
                <label>Pilih Siswa Manual</label>
                <select value={perkembanganForm.siswa_id} onChange={(e) => onSelectProgressStudent(e.target.value, 'manual')} style={{ width: '100%', padding: '10px' }}>
                  <option value="">-- Ketik/Pilih Nama Siswa --</option>
                  {siswaTampil.map((item) => <option key={item.id} value={item.id}>{item.nama} ({item.branches?.nama || 'Pusat'})</option>)}
                </select>
              </div>
            )}
          </div>

          <form onSubmit={onSubmit}>
            {user?.akses !== 'guru' && (
              <div className="form-row">
                <label>Guru Pengajar (Default: {selectedProgressStudent?.guru_default_nama || '-'})</label>
                <select value={perkembanganForm.guru_handle_id} onChange={(e) => setPerkembanganForm({ ...perkembanganForm, guru_handle_id: e.target.value })}>
                  <option value="">Sama dengan guru default</option>
                  {guruOptions.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
                </select>
              </div>
            )}
            <div className="form-row">
              <label>Tanggal Sesi</label>
              <input type="date" value={perkembanganForm.tanggal} onChange={(e) => setPerkembanganForm({ ...perkembanganForm, tanggal: e.target.value })} required />
            </div>
            <div className="form-row">
              <label>Catatan Perkembangan / Materi Hari Ini</label>
              <textarea value={perkembanganForm.catatan} onChange={(e) => setPerkembanganForm({ ...perkembanganForm, catatan: e.target.value })} placeholder="Cth: Ananda sudah mulai lancar perkalian pecahan..." rows="4" required style={{ width: '100%', padding: '10px', borderRadius: '8px' }}></textarea>
            </div>
            <button className="btn btn-primary" type="submit" disabled={!perkembanganForm.siswa_id} style={{ width: '100%', padding: '14px', fontSize: '15px' }}>💾 Simpan Perkembangan</button>
          </form>
        </div>

        {/* BAGIAN KANAN: TABEL RIWAYAT DENGAN FILTER & PAGINASI */}
        <div className="glass-card">
          <h2 className="section-title">
            Riwayat Input {canAccessSiswaMenu ? '(Semua Siswa)' : '(Siswa Anda)'}
          </h2>
          
          {/* === KONTROL PENCARIAN, PERIODE, & DOWNLOAD === */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} style={{ background: 'transparent', border: 'none', color: 'inherit', outline: 'none', fontSize: '13px' }} />
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>s/d</span>
              <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} style={{ background: 'transparent', border: 'none', color: 'inherit', outline: 'none', fontSize: '13px' }} />
            </div>

            <input 
              type="text" 
              placeholder="🔍 Cari nama/catatan..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '13px', flex: 1, minWidth: '150px' }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-secondary btn-small" 
                onClick={() => { setStartDate(''); setEndDate(''); setCurrentPage(1); }}
                style={{ whiteSpace: 'nowrap' }}
              >
                Semua Periode
              </button>
              
              {/* TOMBOL DOWNLOAD BARU */}
              <button 
                className="btn btn-primary btn-small" 
                onClick={handleDownload}
                style={{ background: '#10b981', borderColor: '#10b981', color: 'black', fontWeight: 'bold' }}
              >
                ⬇️ CSV
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table style={{ minWidth: '100%' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#1e293b' }}>
                <tr><th>Tanggal</th><th>Siswa</th><th>Catatan Guru</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {paginatedData.map((item) => (
                  <tr key={item.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatTanggal(item.tanggal)}</td>
                    <td><b>{item.siswa?.nama || '-'}</b><br/><span className="text-muted" style={{fontSize: '11px'}}>Guru: {item.users?.nama || '-'}</span></td>
                    <td><div style={{ maxHeight: '60px', overflowY: 'auto', fontSize: '13px' }}>{item.catatan}</div></td>
                    <td>
                      {canAccessSiswaMenu ? (
                        <button className="btn btn-primary btn-small" onClick={() => onSendPerkembanganWA(item)} style={{ background: '#10b981', borderColor: '#10b981', whiteSpace: 'nowrap' }}>Kirim WA 💬</button>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '12px', fontStyle: 'italic', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>Terkunci</span>
                      )}
                    </td>
                  </tr>
                ))}
                {paginatedData.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Data perkembangan tidak ditemukan.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* === KONTROL PAGINASI (10 DATA PER HALAMAN) === */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap', gap: '15px' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredHistory.length)} dari {filteredHistory.length} data
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
    </div>
  )
}
