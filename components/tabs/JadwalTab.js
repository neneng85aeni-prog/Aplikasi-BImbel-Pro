import { useState } from 'react'
import html2canvas from 'html2canvas'

export function JadwalTab({ siswa = [], users = [], branches = [], perkembangan = [] }) {
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10))
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
  const [selectedDay, setSelectedDay] = useState('Senin')
  
  // === JAM DIBATASI HANYA SAMPAI 15:00 ===
  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00']
  
  const guruList = (users || []).filter(u => u.akses?.toLowerCase() === 'guru')
  
  // Ambil data siswa yang hadir dari tabel 'perkembangan' (berdasarkan tanggal terpilih)
  const siswaHadirHariIni = (perkembangan || []).filter(p => String(p.tanggal) === targetDate);

  return (
    <div className="flex flex-col gap-md" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* FILTER */}
      <div className="glass-card" style={{ padding: '15px' }}>
         <label style={{ fontSize: '12px', color: '#94a3b8' }}>Filter Tanggal:</label>
         <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} style={{ padding: '8px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }} />
         
         <div style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
            {days.map(d => (
              <button key={d} onClick={() => setSelectedDay(d)} style={{ background: selectedDay === d ? '#2563eb' : '#334155', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>
                {d}
              </button>
            ))}
         </div>
      </div>

      <div className="glass-card" style={{ padding: '15px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '12px' }}>
          <thead>
            <tr>
              <th style={{ padding: '10px', borderBottom: '1px solid #334155' }}>GURU</th>
              {timeSlots.map(t => <th key={t} style={{ textAlign: 'center', borderBottom: '1px solid #334155' }}>{t}</th>)}
            </tr>
          </thead>
          <tbody>
            {guruList.map(guru => (
              <tr key={guru.id}>
                <td style={{ padding: '10px', borderBottom: '1px solid #334155', fontWeight: 'bold' }}>{guru.nama}</td>
                {timeSlots.map(slot => (
                  <td key={slot} style={{ border: '1px solid #1e293b', verticalAlign: 'top', padding: '5px' }}>
                    
                    {/* FILTER SISWA: Cocokkan Hari dan Jam */}
                    {siswa.filter(s => 
                      s.guru_id === guru.id && 
                      s.hari?.includes(selectedDay) && 
                      s.jam_mulai?.startsWith(slot.substring(0,2))
                    ).map(s => {
                      
                      // CEK HIJAU: Apakah siswa ada di tabel perkembangan tgl ini?
                      const isHadir = siswaHadirHariIni.some(p => String(p.siswa_id) === String(s.id));

                      return (
                        <div key={s.id} style={{ 
                            background: isHadir ? '#10b981' : '#334155', 
                            padding: '4px', borderRadius: '4px', marginBottom: '4px', color: '#fff' 
                        }}>
                          {isHadir ? '✅ ' : '👤 '}{s.nama}
                        </div>
                      )
                    })}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
