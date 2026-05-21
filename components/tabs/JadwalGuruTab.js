import { useState } from 'react'
import html2canvas from 'html2canvas'

export function JadwalGuruTab({ users, jadwalGuru, absensiSiswa, siswaTampil, onSubmitJadwal, onDeleteJadwal }) {
  const [form, setForm] = useState({ user_id: '', hari: 'Senin', jam_mulai: '15:00', jam_selesai: '17:00' })
  const [searchQuery, setSearchQuery] = useState('')
  
  // === FILTER TANGGAL BARU ===
  // Default langsung ke tanggal hari ini agar kasir/admin tidak repot input manual
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10))

  const daftarHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
  const daftarGuru = users.filter(u => u.akses === 'guru' || u.akses === 'GURU')

  // Logika mendeteksi nama hari berdasarkan tanggal yang dipilih user
  const namaHariTerpilih = new Date(targetDate).toLocaleDateString('id-ID', { weekday: 'long' });

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.user_id) return alert('Pilih gurunya dulu, Mas!')
    onSubmitJadwal(form)
    setForm({ ...form, user_id: '' }) 
  }

  // Filter tampilan jadwal aktif berdasarkan pencarian
  const filteredJadwal = (jadwalGuru || []).filter(j => 
    j.users?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.hari.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDownloadImage = () => {
    const element = document.getElementById('poster-jadwal-guru');
    const originalMaxHeight = element.style.maxHeight;
    const originalOverflow = element.style.overflowY;

    element.style.maxHeight = 'none';
    element.style.overflowY = 'visible';

    const aksiCells = element.querySelectorAll('.kolom-aksi');
    aksiCells.forEach(cell => cell.style.display = 'none');

    html2canvas(element, { scale: 2, backgroundColor: null }).then(canvas => {
      const link = document.createElement('a');
      link.download = `Jadwal_&_Kehadiran_Guru_${targetDate}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      element.style.maxHeight = originalMaxHeight;
      element.style.overflowY = originalOverflow;
      aksiCells.forEach(cell => cell.style.display = '');
    });
  };
  
  return (
    <div className="grid grid-2 gap-lg">
      {/* FORM INPUT JADWAL */}
      <div className="glass-card" style={{ height: 'fit-content' }}>
        <h2 className="section-title">Tambah Jadwal Piket Guru</h2>
        <p className="text-muted" style={{fontSize: '13px', marginBottom: '20px'}}>Atur jam standby guru supaya pendaftaran siswa lebih akurat.</p>
        
        <form onSubmit={handleSubmit} className="grid gap-md">
          <div className="form-row">
            <label>Pilih Guru</label>
            <select value={form.user_id} onChange={e => setForm({...form, user_id: e.target.value})} required>
              <option value="">-- Pilih Guru --</option>
              {daftarGuru.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
            </select>
          </div>

          <div className="grid grid-3 gap-md">
            <div className="form-row">
              <label>Hari</label>
              <select value={form.hari} onChange={e => setForm({...form, hari: e.target.value})}>
                {daftarHari.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>Jam Mulai</label>
              <input type="time" value={form.jam_mulai} onChange={e => setForm({...form, jam_mulai: e.target.value})} required />
            </div>
            <div className="form-row">
              <label>Jam Selesai</label>
              <input type="time" value={form.jam_selesai} onChange={e => setForm({...form, jam_selesai: e.target.value})} required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{marginTop: '10px', padding: '12px'}}>💾 Simpan Jadwal</button>
        </form>
      </div>

      {/* DAFTAR JADWAL & MONITOR MONITOR SISWA */}
      <div className="glass-card">
        {/* === HEADER FILTER TANGGAL BARU === */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>📅 Filter Tanggal Monitor Kehadiran:</label>
            <input 
              type="date" 
              value={targetDate} 
              onChange={e => setTargetDate(e.target.value)} 
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontWeight: 'bold' }}
            />
          </div>
          <div style={{ textAlign: 'right', fontSize: '13px' }}>
            <span className="text-muted">Hari Terpilih:</span><br />
            <b style={{ color: '#3b82f6' }}>✨ {namaHariTerpilih}</b>
          </div>
        </div>

        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px'}}>
          <h2 className="section-title" style={{margin:0}}>List Jadwal & Absensi</h2>
          <div style={{display: 'flex', gap: '10px'}}>
            <input 
              type="text" placeholder="🔍 Cari guru/hari..." 
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '13px'}}
            />
            <button type="button" className="btn btn-primary btn-small" onClick={handleDownloadImage} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              📸 Export
            </button>
          </div>
        </div>

        <div id="poster-jadwal-guru" className="table-wrap" style={{maxHeight: '500px', overflowY: 'auto', padding: '10px', background: 'var(--panel)', borderRadius: '12px'}}>
          <table>
            <thead>
              <tr>
                <th>Guru</th>
                <th>Hari & Jam</th>
                <th>Siswa Dipiket Ini</th>
                <th className="kolom-aksi">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredJadwal.map(j => {
                // 1. Cari semua siswa yang punya jadwal hari dan jam_mulai yang cocok dengan baris piket guru ini
                const siswaDiJadwalIni = (siswaTampil || []).filter(s => 
                  s.hari === j.hari && 
                  s.jam_mulai?.slice(0,5) === j.jam_mulai?.slice(0,5)
                );

                return (
                  <tr key={j.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ verticalAlign: 'top', padding: '12px 8px' }}>
                      <b>{j.users?.nama}</b>
                    </td>
                    <td style={{ verticalAlign: 'top', padding: '12px 8px' }}>
                      <div>{j.hari}</div>
                      <span className="badge-info" style={{ fontSize: '11px', display: 'inline-block', marginTop: '4px' }}>
                        {j.jam_mulai.slice(0,5)} - {j.jam_selesai.slice(0,5)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {siswaDiJadwalIni.length === 0 ? (
                        <span className="text-muted" style={{ fontSize: '12px', italic: 'true' }}>- Tidak ada siswa -</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {siswaDiJadwalIni.map(s => {
                            // 2. KUNCI UTAMA: Cek database absensiSiswa apakah anak ini berstatus 'hadir' di tanggal filter
                            const IsSiswaHadir = (absensiSiswa || []).some(abs => 
                              abs.siswa_id === s.id && 
                              abs.tanggal === targetDate && 
                              (abs.status?.toLowerCase() === 'hadir' || abs.mode?.toLowerCase() === 'in')
                            );

                            return (
                              <div 
                                key={s.id} 
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  fontWeight: IsSiswaHadir ? 'bold' : 'normal',
                                  // WARNA HIJAU TERANG JIKA HADIR, SELEBIHNYA TRANSPARAN ELEGAN
                                  background: IsSiswaHadir ? '#10b981' : 'rgba(255,255,255,0.03)',
                                  color: IsSiswaHadir ? '#ffffff' : 'inherit',
                                  border: IsSiswaHadir ? '1px solid #059669' : '1px solid rgba(255,255,255,0.05)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}
                              >
                                <span>👤 {s.nama} <small style={{ opacity: 0.7 }}>({s.kelas})</small></span>
                                {IsSiswaHadir && <span style={{ fontSize: '11px', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>✅ Hadir</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="kolom-aksi" style={{ verticalAlign: 'top', padding: '12px 8px' }}>
                      <button className="btn btn-danger btn-small" onClick={() => onDeleteJadwal(j.id)}>Hapus</button>
                    </td>
                  </tr>
                );
              })}
              {filteredJadwal.length === 0 && (
                <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px'}} className="text-muted">Belum ada jadwal.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
