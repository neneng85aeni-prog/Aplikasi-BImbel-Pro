import { formatTanggal } from '../../lib/format'

export function PerkembanganTab({ 
  user, perkembanganForm, setPerkembanganForm, siswaTampil, guruOptions, 
  perkembanganHistory, selectedProgressStudent, progressInputMode, setProgressInputMode, 
  scanStudentActive, setScanStudentActive, studentScanInfo, onSelectProgressStudent, 
  onSubmit, onSendPerkembanganWA, perkembanganTampil 
}) {
  
  // === GEMBOK UTAMA (SUPER KETAT) ===
  // Mengabaikan jabatan. Hanya ngecek: "Apakah di database ada kata 'siswa' di dalam menu_permissions-nya?"
  // Jika menu_permissions kosong/error, maka otomatis FALSE (tombol hilang).
  const canAccessSiswaMenu = Array.isArray(user?.menu_permissions) && user.menu_permissions.includes('siswa');

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

        {/* BAGIAN KANAN: TABEL RIWAYAT UNTUK KASIR KIRIM WA */}
        <div className="glass-card">
          <h2 className="section-title">Riwayat Input Terakhir (Semua Siswa)</h2>
          <p className="text-muted" style={{ fontSize: '13px', marginBottom: '15px' }}>Tabel ini memudahkan Kasir/Admin untuk langsung mengirimkan laporan ke WA Orang Tua.</p>
          
          <div className="table-wrap" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table style={{ minWidth: '100%' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#1e293b' }}>
                <tr><th>Tanggal</th><th>Siswa</th><th>Catatan Guru</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {perkembanganTampil && perkembanganTampil.slice(0, 30).map((item) => (
                  <tr key={item.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatTanggal(item.tanggal)}</td>
                    <td><b>{item.siswa?.nama || '-'}</b><br/><span className="text-muted" style={{fontSize: '11px'}}>Guru: {item.users?.nama || '-'}</span></td>
                    <td><div style={{ maxHeight: '60px', overflowY: 'auto', fontSize: '13px' }}>{item.catatan}</div></td>
                    <td>
                      
                      {/* === INI BAGIAN YANG DILINDUNGI === */}
                      {/* Hanya muncul jika user PUNYA centang di Menu Siswa */}
                      {canAccessSiswaMenu ? (
                        <button className="btn btn-primary btn-small" onClick={() => onSendPerkembanganWA(item)} style={{ background: '#10b981', borderColor: '#10b981', whiteSpace: 'nowrap' }}>Kirim WA 💬</button>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '12px', fontStyle: 'italic', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>Terkunci</span>
                      )}
                      {/* ================================== */}

                    </td>
                  </tr>
                ))}
                {(!perkembanganTampil || perkembanganTampil.length === 0) && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Belum ada riwayat perkembangan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
