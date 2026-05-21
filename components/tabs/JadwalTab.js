import { useState } from 'react'
import html2canvas from 'html2canvas'

export function JadwalTab({ siswa = [], users = [], branches = [], absensiSiswa = [] }) {
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10))
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
  const [selectedDay, setSelectedDay] = useState(days[new Date().getDay() - 1] || 'Senin')

  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
  const guruList = (users || []).filter(u => u.akses?.toLowerCase() === 'guru')

  // === DEBUG ABSENSI ===
  // Kita coba deteksi apakah absensiSiswa memiliki data yang cocok dengan tanggal hari ini
  const filterAbsen = (absensiSiswa || []).filter(a => {
      const tglData = String(a.tanggal || '');
      return tglData.includes(targetDate);
  });

  return (
    <div className="flex flex-col gap-md" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: '15px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8' }}>Filter Tanggal:</label>
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} style={{ padding: '8px', borderRadius: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }} />
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid #10b981' }}>
             <div style={{ fontSize: '11px', color: '#10b981' }}>Absen ditemukan tgl {targetDate}:</div>
             <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{filterAbsen.length} Data</div>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '15px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
          <thead>
            <tr>
              <th style={{ padding: '10px', borderBottom: '1px solid #334155', textAlign: 'left' }}>GURU</th>
              {timeSlots.map(t => <th key={t} style={{ textAlign: 'center' }}>{t}</th>)}
            </tr>
          </thead>
          <tbody>
            {guruList.map(guru => (
              <tr key={guru.id}>
                <td style={{ padding: '10px', borderBottom: '1px solid #334155' }}>{guru.nama}</td>
                {timeSlots.map(slot => (
                  <td key={slot} style={{ border: '1px solid #1e293b', verticalAlign: 'top', padding: '5px' }}>
                    {siswa.filter(s => s.guru_id === guru.id && s.hari?.includes(selectedDay) && s.jam_mulai?.startsWith(slot.substring(0,2))).map(s => {
                      
                      // LOGIKA PALING KRUSIAL: Pencocokan ID Siswa
                      const hadir = filterAbsen.some(a => String(a.siswa_id) === String(s.id));
                      
                      return (
                        <div key={s.id} style={{ 
                            background: hadir ? '#10b981' : '#334155', 
                            padding: '4px', borderRadius: '4px', marginBottom: '4px', fontSize: '11px' 
                        }}>
                          {hadir ? '✅ ' : '👤 '}{s.nama}
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
