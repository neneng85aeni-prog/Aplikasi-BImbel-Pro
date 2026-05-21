import { useState } from 'react'
import html2canvas from 'html2canvas'

// Kita terima 'perkembangan' sebagai pengganti absensiSiswa
export function JadwalTab({ siswa = [], users = [], branches = [], perkembangan = [] }) {
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10))
  const [selectedDay, setSelectedDay] = useState('Senin')
  
  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
  const guruList = (users || []).filter(u => u.akses?.toLowerCase() === 'guru')

  // Logika Hijau: Cari siswa di data perkembangan pada tanggal yang dipilih
  const siswaHadirHariIni = (perkembangan || []).filter(p => String(p.tanggal) === targetDate);

  return (
    <div className="flex flex-col gap-md" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: '15px' }}>
         <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
         <div style={{ color: '#fff' }}>Siswa Hadir tgl {targetDate}: {siswaHadirHariIni.length} Orang</div>
      </div>

      <div className="glass-card" style={{ padding: '15px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
          <tbody>
            {guruList.map(guru => (
              <tr key={guru.id}>
                <td style={{ padding: '10px' }}>{guru.nama}</td>
                {timeSlots.map(slot => (
                  <td key={slot} style={{ border: '1px solid #334155', verticalAlign: 'top', padding: '5px' }}>
                    {siswa.filter(s => s.guru_id === guru.id && s.jam_mulai?.startsWith(slot.substring(0,2))).map(s => {
                      
                      // KUNCI UTAMA: Cek di data perkembangan apakah siswa ini ada
                      const isHadir = siswaHadirHariIni.some(p => String(p.siswa_id) === String(s.id));

                      return (
                        <div key={s.id} style={{ 
                            background: isHadir ? '#10b981' : '#334155', 
                            padding: '4px', borderRadius: '4px', marginBottom: '4px', fontSize: '11px' 
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
