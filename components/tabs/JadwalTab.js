import { useState } from 'react'

export function JadwalTab({ siswa, users, branches }) {
  // 1. Pilih Hari (karena matrix hanya bisa tampil per hari agar tidak pusing)
  const [selectedDay, setSelectedDay] = useState('Senin')
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
  
  // 2. Definisi Jam (8 pagi - 6 sore)
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ]

  // 3. Ambil data Guru saja
  const guruList = users.filter(u => u.akses === 'GURU')

  return (
    <div className="grid gap-lg">
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 className="section-title" style={{ margin: 0 }}>📅 Monitoring Jadwal Guru</h2>
          
          {/* PEMILIH HARI */}
          <div style={{ display: 'flex', gap: '5px', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '10px' }}>
            {days.map(d => (
              <button 
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`btn btn-small ${selectedDay === d ? 'btn-primary' : ''}`}
                style={{ background: selectedDay === d ? '' : 'transparent', border: 'none', padding: '6px 12px' }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* MATRIX CONTAINER */}
        <div className="table-wrap" style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: '0', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, zIndex: 2, background: '#1e293b', minWidth: '150px' }}>Nama Guru</th>
                {timeSlots.map(time => (
                  <th key={time} style={{ textAlign: 'center', minWidth: '120px', background: 'rgba(255,255,255,0.02)' }}>{time}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guruList.map(guru => (
                <tr key={guru.id}>
                  {/* KOLOM KIRI: NAMA GURU */}
                  <td style={{ 
                    position: 'sticky', left: 0, zIndex: 1, background: '#1e293b', 
                    fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.1)' 
                  }}>
                    {guru.nama}
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal' }}>
                      {branches.find(b => b.id === guru.branch_id)?.nama || 'Pusat'}
                    </div>
                  </td>

                  {/* KOLOM KANAN: JADWAL PER JAM */}
                  {timeSlots.map(slot => {
                    // Cari siswa yang diajar guru ini di hari ini pada jam ini
                    // Logika: jam_mulai siswa mengandung angka slot (misal "14:00" cocok dengan slot "14:00")
                    const matchSiswa = siswa.filter(s => 
                      s.guru_id === guru.id && 
                      s.hari === selectedDay && 
                      s.jam_mulai && s.jam_mulai.startsWith(slot.substring(0, 2))
                    )

                    return (
                      <td key={slot} style={{ verticalAlign: 'top', padding: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        {matchSiswa.length > 0 ? (
                          matchSiswa.map(s => (
                            <div key={s.id} style={{ 
                              background: 'rgba(59, 130, 246, 0.2)', 
                              borderLeft: '3px solid #3b82f6',
                              padding: '6px', 
                              borderRadius: '4px', 
                              marginBottom: '4px',
                              fontSize: '11px'
                            }}>
                              <div style={{ fontWeight: 'bold' }}>{s.nama}</div>
                              <div style={{ fontSize: '9px', opacity: 0.8 }}>{s.programs?.nama || 'Reguler'}</div>
                              <div style={{ fontSize: '9px', color: '#60a5fa' }}>{s.jam_mulai}</div>
                            </div>
                          ))
                        ) : (
                          <div style={{ height: '40px' }}></div> // Kotak Kosong
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#94a3b8' }}>
          💡 <i>Klik tombol hari di atas untuk melihat perubahan jadwal per hari secara real-time.</i>
        </div>
      </div>
    </div>
  )
}
