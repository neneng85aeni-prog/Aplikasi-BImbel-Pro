import { useState, useEffect } from 'react'
import { formatTanggal } from '../../lib/format'

export function PerkembanganTab({ 
  user, perkembanganForm, setPerkembanganForm, siswaTampil, guruOptions, 
  perkembanganHistory, selectedProgressStudent, progressInputMode, setProgressInputMode, 
  scanStudentActive, setScanStudentActive, studentScanInfo, onSelectProgressStudent, 
  onSubmit, onSendPerkembanganWA, perkembanganTampil, onDeletePerkembangan 
}) {
  
  // === SETUP DEFAULT: BULAN BERJALAN ===
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  // === STATE LOKAL ===
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5; 

  // === STATE BARU: PANCINGAN KEYBOARD HP ===
  const [siswaSearchTerm, setSiswaSearchTerm] = useState('');

  // --- LOGIKA FILTER SISWA MANUAL ---
  const filteredSiswaOptions = (siswaTampil || []).filter(s => 
    s.nama?.toLowerCase().includes(siswaSearchTerm.toLowerCase())
  );

  // === CEK AKSES MENU SISWA (Untuk Syarat Muncul Tombol WA) ===
  const canAccessSiswaMenu = Array.isArray(user?.menu_permissions) && user.menu_permissions.includes('siswa');

  // === FITUR AUTO-FILTER ✨ ===
  useEffect(() => {
    if (selectedProgressStudent?.nama) {
      setSearchQuery(selectedProgressStudent.nama);
      setCurrentPage(1);
    }
  }, [selectedProgressStudent]);

  // Fungsi format Jam
  const formatJam = (timestamp) => {
    if (!timestamp) return '--:--';
    return new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // === FILTER TERBUKA (Agar Guru Bisa Lihat Riwayat Sebelumnya) ===
  const filteredHistory = (perkembanganTampil || []).filter(item => {
    const itemDate = item.tanggal;
    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const isMatch = (
        item.siswa?.nama?.toLowerCase().includes(q) ||
        item.users?.nama?.toLowerCase().includes(q) ||
        item.catatan?.toLowerCase().includes(q) ||
        item.siswa?.programs?.nama?.toLowerCase().includes(q) // Bisa cari berdasarkan nama program juga!
      );
      if (!isMatch) return false;
    }
    return true;
  });

  // === PAGINASI ===
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const paginatedData = filteredHistory.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const goToPage = (page) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };

  // === LOGIKA EDIT & BATAL ===
  const startEdit = (item) => {
    setPerkembanganForm({
      id: item.id,
      siswa_id: item.siswa_id,
      guru_handle_id: item.guru_id,
      tanggal: item.tanggal,
      catatan: item.catatan
    });
    
    if (item.siswa?.nama) {
      setSearchQuery(item.siswa.nama);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setPerkembanganForm({ id: null, siswa_id: '', guru_handle_id: '', tanggal: today.toISOString().slice(0, 10), catatan: '' });
    if (onSelectProgressStudent) onSelectProgressStudent(null);
    setSearchQuery('');
    setSiswaSearchTerm(''); // <--- TAMBAHKAN BARIS INI
  };

  const handleDownload = () => {
    let csv = "Tanggal,Jam,Siswa,Program,Guru,Catatan\n";
    filteredHistory.forEach(item => {
      const program = item.siswa?.programs?.nama || item.siswa?.program?.nama || '-';
      csv += `"${formatTanggal(item.tanggal)}","${formatJam(item.created_at)}","${item.siswa?.nama || '-'}","${program}","${item.users?.nama || '-'}","${(item.catatan || '').replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Riwayat_Perkembangan.csv`;
    link.click();
  };

  return (
    <div className="grid gap-lg">
      {/* MENGGUNAKAN flex-column AGAR ATAS-BAWAH */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* BAGIAN ATAS: INPUT */}
        <div className="glass-card">
          <div className="btn-row" style={{ justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              {perkembanganForm.id ? '📝 Edit Perkembangan' : '🚀 Input Perkembangan'}
            </h2>
            {!perkembanganForm.id && (
              <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '12px' }}>
                  <input type="radio" checked={progressInputMode === 'scan'} onChange={() => setProgressInputMode('scan')} /> Scan
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '12px' }}>
                  <input type="radio" checked={progressInputMode === 'manual'} onChange={() => setProgressInputMode('manual')} /> Manual
                </label>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            {perkembanganForm.id ? (
               <div className="form-row">
                 <label>Siswa (Mode Edit)</label>
                 <input type="text" value={selectedProgressStudent?.nama || 'Siswa'} disabled style={{ opacity: 0.7 }} />
               </div>
            ) : progressInputMode === 'scan' ? (
              <div>
                {!scanStudentActive ? (
                  <button type="button" className="btn btn-secondary" onClick={() => setScanStudentActive(true)} style={{ width: '100%' }}>📷 Buka Scanner</button>
                ) : (
                  <div className="scanner-container">
                    <div id="reader-siswa" style={{ width: '100%' }}></div>
                    <button type="button" className="btn btn-danger" onClick={() => setScanStudentActive(false)} style={{ width: '100%', marginTop: '10px' }}>Tutup</button>
                  </div>
                )}
                <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '13px', color: '#3b82f6' }}>{studentScanInfo}</div>
              </div>
           ) : (
              <div className="form-row" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label>Pilih Siswa</label>
                
                {/* === KOTAK PANCINGAN KEYBOARD HP === */}
                <input 
                  type="text" 
                  placeholder="🔍 Ketik nama siswa di sini..." 
                  value={siswaSearchTerm} 
                  onChange={(e) => setSiswaSearchTerm(e.target.value)}
                  style={{ 
                    padding: '12px', fontSize: '14px', borderRadius: '8px', 
                    border: '1px solid rgba(255,255,255,0.3)', 
                    background: 'rgba(255,255,255,0.05)', color: '#fff', width: '100%' 
                  }}
                />
                
                {/* Dropdown yang otomatis memendek */}
                <select value={perkembanganForm.siswa_id} onChange={(e) => onSelectProgressStudent(e.target.value, 'manual')} style={{ padding: '12px', fontSize: '15px', width: '100%' }}>
                  <option value="">-- Pilih dari Hasil ({filteredSiswaOptions.length} Siswa) --</option>
                  {filteredSiswaOptions.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}
                </select>
              </div>
            )}
          </div>

         <form onSubmit={onSubmit}>
            <div className="form-row">
              <label>Tanggal Sesi</label>
              <input type="date" value={perkembanganForm.tanggal} onChange={(e) => setPerkembanganForm({ ...perkembanganForm, tanggal: e.target.value })} required />
            </div>

            {/* === KODE YANG DITAMBAHKAN DI PERKEMBANGANTAB.JS === */}
            <div className="form-row">
              <label>Guru Pengajar</label>
              <select 
                value={perkembanganForm.guru_handle_id || ''} 
                onChange={(e) => setPerkembanganForm({ ...perkembanganForm, guru_handle_id: e.target.value })}
              >
                <option value="">-- Ikuti Guru Utama Siswa --</option>
                {guruOptions?.map(guru => (
                  <option key={guru.id} value={guru.id}>{guru.nama}</option>
                ))}
              </select>
            </div>
            {/* ==================================================== */}

            <div className="form-row">
              <label>Catatan Materi</label>
              <textarea value={perkembanganForm.catatan} onChange={(e) => setPerkembanganForm({ ...perkembanganForm, catatan: e.target.value })} placeholder="Tulis progres belajar siswa..." rows="4" required />
            </div>
            
            {/* INI TOMBOL FORM (SIMPAN & BATAL) */}
            <div className="btn-row">
              <button className="btn btn-primary" type="submit" disabled={!perkembanganForm.siswa_id} style={{ flex: 2 }}>
                {perkembanganForm.id ? '💾 Update Laporan' : '💾 Simpan Laporan'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={resetForm} style={{ flex: 1 }}>Batal</button>
            </div>
          </form>
        </div>

        {/* BAGIAN BAWAH: RIWAYAT */}
        <div className="glass-card">
          <h2 className="section-title">Riwayat Perkembangan Siswa</h2>
          
          {/* LAYOUT PENCARIAN & TANGGAL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.05)', padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} style={{ fontSize: '12px', background: 'transparent', border: 'none', color: 'inherit', outline: 'none' }} />
                <span style={{ fontSize: '11px' }}>s/d</span>
                <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} style={{ fontSize: '12px', background: 'transparent', border: 'none', color: 'inherit', outline: 'none' }} />
              </div>
              <button className="btn btn-primary btn-small" onClick={handleDownload} style={{ background: '#10b981' }}>⬇️ Download Excel (CSV)</button>
            </div>
            
            <input 
              type="text" 
              placeholder="🔍 Cari nama siswa, program, atau catatan..." 
              value={searchQuery} 
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
              style={{ width: '100%', padding: '10px', fontSize: '13px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'inherit' }} 
            />
          </div>

          <div className="table-wrap" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th style={{ background: '#1e293b', borderBottom: '2px solid rgba(255,255,255,0.1)', width: '15%' }}>Waktu</th>
                  <th style={{ background: '#1e293b', borderBottom: '2px solid rgba(255,255,255,0.1)', width: '20%' }}>Siswa</th>
                  <th style={{ background: '#1e293b', borderBottom: '2px solid rgba(255,255,255,0.1)', width: '45%' }}>Materi</th>
                  <th style={{ background: '#1e293b', borderBottom: '2px solid rgba(255,255,255,0.1)', textAlign: 'center', width: '20%' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
                      <b>{formatTanggal(item.tanggal)}</b><br />
                      <span className="text-muted">Pkl {formatJam(item.created_at)}</span>
                    </td>
                    <td>
                      <b style={{ color: '#60a5fa' }}>{item.siswa?.nama || '-'}</b><br />
                      <span style={{ fontSize: '10px', opacity: 0.7 }}>Oleh: {item.users?.nama || '-'}</span><br/>
                      
                      {/* === INI TAMBAHAN PROGRAM YANG DIIKUTI === */}
                      <span style={{ 
                        fontSize: '9px', 
                        background: 'rgba(59, 130, 246, 0.15)', 
                        color: '#93c5fd', 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        display: 'inline-block', 
                        marginTop: '4px',
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                      }}>
                        {item.siswa?.programs?.nama || item.siswa?.program?.nama || '-'}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px' }}>{item.catatan}</td>
                    <td>
                      {/* INI TOMBOL AKSI TABEL (EDIT, HAPUS, WA) */}
                      <div className="btn-row" style={{ gap: '5px', justifyContent: 'center' }}>
                        <button className="btn btn-secondary btn-small" onClick={() => startEdit(item)}>Edit</button>
                        
                        <button className="btn btn-danger btn-small" onClick={() => {
                          if (typeof onDeletePerkembangan === 'function') {
                            onDeletePerkembangan(item.id, item.siswa?.nama);
                          } else {
                            alert("Kabel Hapus di dashboard.js belum terpasang!");
                          }
                        }}>Hapus</button>

                        {/* Tombol WA Hanya Muncul Jika Punya Akses Menu Siswa ✨ */}
                        {canAccessSiswaMenu && (
                          <button className="btn btn-primary btn-small" onClick={() => onSendPerkembanganWA(item)} style={{ background: '#10b981' }}>WA</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedData.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }} className="text-muted">Data tidak ditemukan.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINASI */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
              <button className="btn btn-secondary btn-small" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>◀ Prev</button>
              <span style={{ fontSize: '12px' }}>{currentPage} / {totalPages}</span>
              <button className="btn btn-secondary btn-small" disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}>Next ▶</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
