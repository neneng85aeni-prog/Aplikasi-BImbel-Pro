import { useState } from 'react'
import html2canvas from 'html2canvas'

export function JadwalGuruTab({ users, siswaTampil, absensiSiswa, stats }) {
  const [searchQuery, setSearchQuery] = useState('')
  
  // === FILTER TANGGAL: Otomatis ke tanggal hari ini ===
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10))

  // Menentukan list nama hari untuk tab switcher
  const daftarHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
  
  // Ambil nama hari berdasarkan filter tanggal yang dipilih
  const hariSesuaiTanggal = new Date(targetDate).toLocaleDateString('id-ID', { weekday: 'long' });
  
  // State untuk switch tab hari (default mengikuti hari dari tanggal terpilih)
  const [activeHariTab, setActiveHariTab] = useState(hariSesuaiTanggal);

  // Jika tanggal diubah, otomatis tab hari menyesuaikan agar sinkron
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setTargetDate(newDate);
    const dayName = new Date(newDate).toLocaleDateString('id-ID', { weekday: 'long' });
    if (daftarHari.includes(dayName)) {
      setActiveHariTab(dayName);
    }
  };

  // Filter Guru & Pencarian
  const daftarGuru = users.filter(u => 
    (u.akses?.toLowerCase() === 'guru') &&
    (u.nama?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // List Jam untuk kolom timeline atas (Sesuai gambar Mbak)
  const slotJam = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  const handleDownloadImage = () => {
    const element = document.getElementById('poster-monitoring-jadwal');
    html2canvas(element, { scale: 2, backgroundColor: '#0f172a' }).then(canvas => {
      const link = document.createElement('a');
      link.download = `Monitoring_Jadwal_${targetDate}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  return (
    <div className="grid gap-lg" id="poster-monitoring-jadwal" style={{ background: '#0f172a', padding: '20px', borderRadius: '16px' }}>
      
      {/* AREA FILTER UTAMA */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {/* Input Filter Tanggal */}
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>📅 Filter Tanggal Kehadiran:</label>
            <input 
              type="date" 
              value={targetDate} 
              onChange={handleDateChange} 
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontWeight: 'bold', outline: 'none' }}
            />
          </div>
          
          {/* Pencarian Nama Guru */}
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>🔍 Cari Guru:</label>
            <input 
              type="text" 
              placeholder="Ketik nama guru..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', width: '200px', outline: 'none' }}
            />
          </div>
        </div>

        <button onClick={handleDownloadImage} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '50px', padding: '10px 20px', background: '#2563eb' }}>
          📸 Export Gambar
        </button>
      </div>

      {/* HEADER MONITOR JADWAL & SWITCHER HARI */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>📆</span>
          <h2 className="section-title" style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#fff' }}>Monitoring Jadwal Siswa</h2>
        </div>

        {/* Tab Switcher Hari (Persen seperti di gambar Mbak) */}
        <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {daftarHari.map(h => (
            <button
              key={h}
              onClick={() => setActiveHariTab(h)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s',
                background: activeHariTab === h ? '#2563eb' : 'transparent',
                color: activeHariTab === h ? '#fff' : '#64748b'
              }}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* GRID TIMELINE UTAMA */}
      <div className="table-responsive" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(30, 41, 59, 0.4)', color: '#fff' }}>
          <thead>
            <tr style={{ background: '#1e293b', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '15px', textTransform: 'uppercase', fontSize: '12px', color: '#94a3b8', width: '150px', textAlign: 'left' }}>Guru</th>
              {slotJam.map(jam => (
                <th key={jam} style={{ padding: '15px', textTransform: 'uppercase', fontSize: '12px', color: '#94a3b8', textAlign: 'center', minWidth: '110px' }}>
                  {jam}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {daftarGuru.map(guru => (
              <tr key={guru.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {/* Kolom Profil Guru */}
                <td style={{ padding: '15px', background: 'rgba(15, 23, 42, 0.4)', borderRight: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#f8fafc' }}>{guru.nama}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>📍 {guru.branch_nama || 'Cabang Pusat'}</div>
                </td>

                {/* Kolom Slot Jam Mengajar */}
                {slotJam.map(jam => {
                  // Saring siswa yang diplot ke Guru ini, pada Hari terpilih, dan Jam yang sesuai
                  const siswaDiSlotIni = (siswaTampil || []).filter(s => 
                    s.guru_id === guru.id && 
                    s.hari === activeHariTab && 
                    s.jam_mulai?.slice(0, 5) === jam
                  );

                  return (
                    <td key={jam} style={{ padding: '10px 6px', borderRight: '1px solid rgba(255,255,255,0.03)', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {siswaDiSlotIni.map(s => {
                          // === CEK STATUS KEHADIRAN SISWA PADA TANGGAL FILTER ===
                          const isSiswaHadir = (absensiSiswa || []).some(abs => 
                            abs.siswa_id === s.id && 
                            abs.tanggal === targetDate && 
                            (abs.status?.toLowerCase() === 'hadir' || abs.mode?.toLowerCase() === 'in')
                          );

                          return (
                            <div
                              key={s.id}
                              style={{
                                padding: '8px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                // JIKA HADIR: JADI HIJAU NEON TERANG, JIKA BELUM: PUTIH BERSIH ELEGAN
                                background: isSiswaHadir ? '#10b981' : '#ffffff',
                                color: isSiswaHadir ? '#ffffff' : '#1e293b',
                                border: isSiswaHadir ? '1px solid #059669' : '1px solid #e2e8f0',
                                fontWeight: isSiswaHadir ? 'bold' : '50px'
                              }}
                            >
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {isSiswaHadir ? '✅ ' : '👤 '}{s.nama}
                              </div>
                              <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '3px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{jam}</span>
                                <span>{s.kelas}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {daftarGuru.length === 0 && (
              <tr>
                <td colSpan={slotJam.length + 1} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Tidak ada data guru ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
