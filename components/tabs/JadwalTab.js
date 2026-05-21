import { useState } from 'react'
import html2canvas from 'html2canvas'

export function JadwalTab({ siswa = [], users = [], branches = [], absensiSiswa = [] }) {
  
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10))
  
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
  
  const hariAwal = new Date(targetDate).toLocaleDateString('id-ID', { weekday: 'long' });
  const [selectedDay, setSelectedDay] = useState(days.includes(hariAwal) ? hariAwal : 'Senin')
  
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setTargetDate(newDate);
    const dayName = new Date(newDate).toLocaleDateString('id-ID', { weekday: 'long' });
    if (days.includes(dayName)) {
      setSelectedDay(dayName);
    }
  };

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ]

  const guruList = (users || []).filter(u => u.akses?.toLowerCase() === 'guru')
  
  const handleDownloadImage = () => {
    const element = document.getElementById('poster-jadwal-matrix');
    const originalMaxHeight = element.style.maxHeight;
    const originalOverflowX = element.style.overflowX;

    element.style.maxHeight = 'none';
    element.style.overflowX = 'visible';

    html2canvas(element, { scale: 2, backgroundColor: '#1e293b' }).then(canvas => {
      const link = document.createElement('a');
      link.download = `Jadwal_Matrix_${selectedDay}_${targetDate}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      element.style.maxHeight = originalMaxHeight;
      element.style.overflowX = originalOverflowX;
    });
  };

  return (
    <div className="flex flex-col gap-md" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* KOTAK FILTER TANGGAL */}
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
                style={{ background: selectedDay === d ? '' : 'transparent', border: 'none', padding: '5px 10px', fontSize: '12px' }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* MATRIX TABLE */}
        <div id="poster-jadwal-matrix" className="table-wrap" style={{ overflowX: 'auto', maxHeight: '65vh', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', background: '#0f172a' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: '0', width: '100%', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', top: 0, left: 0, zIndex: 20, background: '#1e293b', minWidth: '100px', padding: '12px 8px', borderBottom: '2px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>GURU</th>
                {timeSlots.map(time => (
                  <th key={time} style={{ position: 'sticky', top: 0, zIndex: 10, textAlign: 'center', minWidth: '75px', padding: '12px 2px', background: '#1e293b', fontSize: '11px', borderBottom: '2px solid rgba(255,255,255,0.1)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', color: '#94a3b8' }}>{time}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guruList.map(guru => (
                <tr key={guru.id}>
                  <td style={{ position: 'sticky', left: 0, zIndex: 5, background: '#1e293b', padding: '12px 10px', borderRight: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#f8fafc' }}>{guru.nama?.split(' ')[0]}</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>📍 {branches.find(b => b.id === guru.branch_id)?.nama?.substring(0,10) || 'Pusat'}</div>
                  </td>

                  {timeSlots.map(slot => {
                    const matchSiswa = (siswa || []).filter(s => 
                      s.status !== 'nonaktif' && s.status !== 'Nonaktif' &&
                      s.guru_id === guru.id && s.hari?.includes(selectedDay) &&
                      s.jam_mulai && s.jam_mulai.startsWith(slot.substring(0, 2))
                    )

                    return (
                      <td key={slot} style={{ verticalAlign: 'top', padding: '6px', borderRight: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        {matchSiswa.length > 0 ? (
                          matchSiswa.map(s => {
                            // =====================================================================
                            // LOGIKA SUPER PINTAR PENDETEKSI KEHADIRAN (DIJAMIN NYALA)
                            // =====================================================================
                            const isHadir = (absensiSiswa || []).some(abs => {
                              // 1. Samakan ID Siswa dengan kuat
                              const isIdSama = String(abs.siswa_id) === String(s.id);
                              
                              // 2. Baca Segala Jenis Kolom Tanggal (tanggal, created_at, waktu_in)
                              const dataTanggal = String(abs.tanggal || abs.waktu_in || abs.waktu || abs.created_at || '');
                              // Gunakan .includes() karena format Supabase panjang (misal: "2026-05-21T08:00:00")
                              const isTanggalSama = dataTanggal.includes(targetDate);
                              
                              // 3. Baca Segala Jenis Kolom Status (kalau tidak ada kolomnya, otomatis dianggap Hadir)
                              const dataStatus = String(abs.status || abs.keterangan || abs.mode || '').toLowerCase();
                              const isStatusMasuk = dataStatus === '' || dataStatus.includes('hadir') || dataStatus.includes('in') || dataStatus.includes('masuk') || dataStatus.includes('true');
                                                    
                              return isIdSama && isTanggalSama && isStatusMasuk;
                            });
                            // =====================================================================

                            return (
                              <div key={s.id} style={{ 
                                background: isHadir ? '#10b981' : '#e0f2fe', 
                                borderLeft: `3px solid ${isHadir ? '#059669' : '#0284c7'}`,
                                padding: '6px 8px', borderRadius: '4px', marginBottom: '4px', fontSize: '10px', lineHeight: '1.2',
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
