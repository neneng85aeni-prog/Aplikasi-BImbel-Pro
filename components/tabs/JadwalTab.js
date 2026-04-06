import { useState } from 'react'

export function JadwalTab({ siswa = [], users = [], branches = [] }) {
  const [selectedDay, setSelectedDay] = useState('Senin')
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
  
  // Slot jam kita buat lebih padat
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ]

  const guruList = (users || []).filter(u => u.akses?.toLowerCase() === 'guru')

  return (
    <div className="flex flex-col gap-md" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: '15px' }}>
        
        {/* HEADER & PEMILIH HARI (Dibuat lebih rapat) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 className="section-title" style={{ margin: 0, fontSize: '18px' }}>📅 Monitoring Jadwal</h2>
          
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
        <div className="table-wrap" style={{ 
          overflowX: 'auto', 
          maxHeight: '65vh', // Agar tidak terlalu panjang ke bawah
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '10px'
        }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: '0', width: '100%', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ 
                  position: 'sticky', left: 0, zIndex: 10, 
                  background: '#1e293b', minWidth: '130px', // Nama guru lebih sempit
                  borderBottom: '2px solid rgba(255,255,255,0.1)'
                }}>Guru</th>
                
                {timeSlots.map(time => (
                  <th key={time} style={{ 
                    textAlign: 'center', 
                    minWidth: '65px', // Lebar jam diperkecil dari 120 ke 90
                    background: 'rgba(255,255,255,0.02)',
                    fontSize: '11px',
                    borderBottom: '2px solid rgba(255,255,255,0.1)'
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
                  {timeSlots.map(slot => {
                    const matchSiswa = (siswa || []).filter(s => 
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
                              background: 'rgba(59, 130, 246, 0.15)', 
                              borderLeft: '2px solid #3b82f6',
                              padding: '4px 6px', 
                              borderRadius: '4px', 
                              marginBottom: '2px',
                              fontSize: '10px',
                              lineHeight: '1.2'
                            }}>
                              <div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {s.nama?.split(' ')[0]}
                              </div>
                              <div style={{ fontSize: '9px', opacity: 0.7 }}>{s.jam_mulai}</div>
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
