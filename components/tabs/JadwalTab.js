import { useState } from 'react'
import html2canvas from 'html2canvas'

export function JadwalTab({ siswa = [], users = [], branches = [] }) {
  const [selectedDay, setSelectedDay] = useState('Senin')
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
  
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

    html2canvas(element, { scale: 2, backgroundColor: '#f8fafc' }).then(canvas => {
      const link = document.createElement('a');
      link.download = `Jadwal_Matrix_${selectedDay}.png`; // Nama file otomatis sesuai hari
      link.href = canvas.toDataURL('image/png');
      link.click();

      // Kembalikan scroll seperti semula
      element.style.maxHeight = originalMaxHeight;
      element.style.overflowX = originalOverflowX;
    });
  };

  return (
    <div className="flex flex-col gap-md" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: '15px' }}>
        
        {/* HEADER & PEMILIH HARI (Dibuat lebih rapat) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2 className="section-title" style={{ margin: 0, fontSize: '18px' }}>📅 Monitoring Jadwal</h2>
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
          borderRadius: '10px'
        }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: '0', width: '100%', fontSize: '13px' }}>
            <thead>
              <tr>
                {/* HEADER GURU (Pojok Kiri Atas - Sticky Horizontal & Vertikal) */}
                <th style={{ 
                  position: 'sticky', top: 0, left: 0, zIndex: 20, 
                  background: '#1e293b', 
                  minWidth: '100px',
                  padding: '8px',
                  borderBottom: '2px solid rgba(255,255,255,0.1)'
                }}>Guru</th>
                
                {/* HEADER JAM (Baris Atas - Sticky Vertikal) */}
                {timeSlots.map(time => (
                  <th key={time} style={{ 
                    position: 'sticky', top: 0, zIndex: 10, // <--- KUNCI AGAR TIDAK HILANG SAAT SCROLL BAWAH
                    textAlign: 'center', 
                    minWidth: '65px', 
                    padding: '8px 2px',
                    background: '#1e293b', // <--- WARNA DIBUAT SOLID AGAR BARIS DI BAWAHNYA TIDAK TEMBUS PANDANG
                    fontSize: '11px',
                    borderBottom: '2px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)' // Sedikit bayangan pemisah
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
                    padding: '10px', borderRight: '1px solid rgba(255,255,255,0.1)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{guru.nama?.split(' ')[0]}</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                      📍 {branches.find(b => b.id === guru.branch_id)?.nama?.substring(0,10) || 'Pusat'}
                    </div>
                  </td>

                  {/* SLOT JADWAL */}
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
                        padding: '4px', 
                        borderRight: '1px solid rgba(255,255,255,0.03)',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        {matchSiswa.length > 0 ? (
                          matchSiswa.map(s => (
                            <div key={s.id} style={{ 
                              background: '#e0f2fe', /* Warna biru muda solid agar kamera tidak bingung */
                              borderLeft: '3px solid #0284c7',
                              padding: '4px 6px', 
                              borderRadius: '4px', 
                              marginBottom: '2px',
                              fontSize: '10px',
                              lineHeight: '1.2',
                              color: '#0f172a' /* PAKSA TEKS JADI HITAM PEKAT */
                            }}>
                              <div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {s.nama?.split(' ')[0]}
                              </div>
                              <div style={{ fontSize: '9px', color: '#475569' }}>{s.jam_mulai}</div>
                            </div>
                          ))
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
