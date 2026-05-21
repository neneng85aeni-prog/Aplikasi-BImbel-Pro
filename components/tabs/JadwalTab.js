import { useState } from 'react'
import html2canvas from 'html2canvas'

// === TAMBAHKAN absensiSiswa DI PROPS BAWAAN ===
export function JadwalTab({ siswa = [], users = [], branches = [], absensiSiswa = [] }) {
  
  // === 1. STATE FILTER TANGGAL (Default Hari Ini) ===
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10))
  
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
  
  // Ambil nama hari dari tanggal saat ini untuk default terpilih
  const hariAwal = new Date(targetDate).toLocaleDateString('id-ID', { weekday: 'long' });
  const [selectedDay, setSelectedDay] = useState(days.includes(hariAwal) ? hariAwal : 'Senin')
  
  // === 2. FUNGSI SINKRONISASI TANGGAL -> HARI ===
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setTargetDate(newDate);
    
    // Otomatis ubah tab hari sesuai tanggal yang dipilih
    const dayName = new Date(newDate).toLocaleDateString('id-ID', { weekday: 'long' });
    if (days.includes(dayName)) {
      setSelectedDay(dayName);
    }
  };

  // Slot jam kita buat lebih padat
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ]

  const guruList = (users || []).filter(u => u.akses?.toLowerCase() === 'guru')
  
  const handleDownloadImage = () => {
    const element = document.getElementById('poster-jadwal-matrix');
    const originalMaxHeight = element.style.maxHeight;
    const originalOverflowX = element.style.overflowX;

    // Buka scroll agar jadwal dari pagi sampai sore tidak terpotong
    element.style.maxHeight = 'none';
    element.style.overflowX = 'visible';

    html2canvas(element, { scale: 2, backgroundColor: '#1e293b' }).then(canvas => {
      const link = document.createElement('a');
      link.download = `Jadwal_Matrix_${selectedDay}_${targetDate}.png`; // Nama file otomatis dengan tanggal
      link.href = canvas.toDataURL('image/png');
      link.click();

      // Kembalikan scroll seperti semula
      element.style.maxHeight = originalMaxHeight;
      element.style.overflowX = originalOverflowX;
    });
  };

  return (
    <div className="flex flex-col gap-md" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* === KOTAK FILTER TANGGAL (BARU) === */}
      <div className="glass-card" style={{ display: 'flex', gap: '20px', alignItems: 'center', padding: '15px 20px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <div>
          <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>📅 Filter Tanggal Kehadiran:</label>
          <input 
            type="date" 
            value={targetDate} 
            onChange={handleDateChange} 
            style={{ 
              padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', 
              background: 'rgba(0,0,0,0.2)', color: '#fff', fontWeight: 'bold', outline: 'none' 
            }}
          />
        </div>
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Hari dipantau:</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>✨ {selectedDay}</div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '15px' }}>
        
        {/* HEADER & PEMILIH HARI (Dibuat lebih rapat) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2 className="section-title" style={{ margin: 0, fontSize: '18px' }}>📋 Matrix Jadwal</h2>
            <button className="btn btn-primary btn-small" onClick={handleDownloadImage} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '6px 10px' }}>
              📸 Export
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '3px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px', overflowX: 'auto' }}>
            {days.map(d => (
              <button 
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`btn btn-small ${selectedDay === d ? 'btn-primary' : ''}`}
                style={{ 
                  background: selectedDay === d ? '' : 'transparent', 
                  border: 'none', 
                  padding: '5px 10px',
                  fontSize: '12px' 
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* MATRIX TABLE (Optimasi lebar kolom) */}
        <div id="poster-jadwal-matrix" className="table-wrap" style={{
          overflowX: 'auto', 
          maxHeight: '65vh', // Agar tidak terlalu panjang ke bawah
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '10px',
          background: '#0f172a' // Background gelap saat export
        }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: '0', width: '100%', fontSize: '13px' }}>
            <thead>
              <tr>
                {/* HEADER GURU (Pojok Kiri Atas - Sticky Horizontal & Vertikal) */}
                <th style={{ 
                  position: 'sticky', top: 0, left: 0, zIndex: 20, 
                  background: '#1e293b', 
                  minWidth: '100px',
                  padding: '12px 8px',
                  borderBottom: '2px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8'
                }}>GURU</th>
                
                {/* HEADER JAM (Baris Atas - Sticky Vertikal) */}
                {timeSlots.map(time => (
                  <th key={time} style={{ 
                    position: 'sticky', top: 0, zIndex: 10, // <--- KUNCI AGAR TIDAK HILANG SAAT SCROLL BAWAH
                    textAlign: 'center', 
                    minWidth: '75px', 
                    padding: '12px 2px',
                    background: '#1e293b', // <--- WARNA DIBUAT SOLID AGAR BARIS DI BAWAHNYA TIDAK TEMBUS PANDANG
                    fontSize: '11px',
                    borderBottom: '2px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)', // Sedikit bayangan pemisah
                    color: '#94a3b8'
                  }}>{time}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guruList.map(guru => (
                <tr key={guru.id}>
                  {/* KOLOM GURU (Lebih compact) */}
                  <td style={{ 
                    position: 'sticky', left: 0, zIndex: 5, background: '#1e293b', 
                    padding: '12px 10px', borderRight: '1px solid rgba(255,255,255,0.1)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#f8fafc' }}>{guru.nama?.split(' ')[0]}</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                      📍 {branches.find(b => b.id === guru.branch_id)?.nama?.substring(0,10) || 'Pusat'}
                    </div>
                  </td>

                  {/* SLOT JADWAL */}
                  {timeSlots.map(slot => {
                    const matchSiswa = (siswa || []).filter(s => 
                      // 1. FILTER SAKTI: Buang siswa nonaktif
                      s.status !== 'nonaktif' && s.status !== 'Nonaktif' &&
                      // 2. Cocokkan jadwal
                      s.guru_id === guru.id && 
                      s.hari?.includes(selectedDay) &&
                      s.jam_mulai && s.jam_mulai.startsWith(slot.substring(0, 2))
                    )

                    return (
                      <td key={slot} style={{ 
                        verticalAlign: 'top', 
                        padding: '6px', 
                        borderRight: '1px solid rgba(255,255,255,0.03)',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        {matchSiswa.length > 0 ? (
                          matchSiswa.map(s => {
                            // === 3. CEK ABSENSI: APAKAH SISWA INI HADIR DI TANGGAL TERSEBUT? ===
                            const isHadir = (absensiSiswa || []).some(abs => 
                              abs.siswa_id === s.id && 
                              abs.tanggal === targetDate && 
                              (abs.status?.toLowerCase() === 'hadir' || abs.mode?.toLowerCase() === 'in')
                            );

                            return (
                              <div key={s.id} style={{ 
                                // JIKA HADIR = HIJAU TERANG, JIKA BELUM = BIRU MUDA (DEFAULT)
                                background: isHadir ? '#10b981' : '#e0f2fe', 
                                borderLeft: `3px solid ${isHadir ? '#059669' : '#0284c7'}`,
                                padding: '6px 8px', 
                                borderRadius: '4px', 
                                marginBottom: '4px',
                                fontSize: '10px',
                                lineHeight: '1.2',
                                color: isHadir ? '#ffffff' : '#0f172a',
                                boxShadow: isHadir ? '0 2px 6px rgba(16, 185, 129, 0.4)' : 'none',
                                transition: 'all 0.3s ease'
                              }}>
                                <div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {isHadir ? '✅ ' : ''}{s.nama?.split(' ')[0]}
                                </div>
                                <div style={{ fontSize: '9px', color: isHadir ? '#d1fae5' : '#475569', marginTop: '2px' }}>
                                  {s.jam_mulai}
                                </div>
                              </div>
                            )
                          })
                        ) : null}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
