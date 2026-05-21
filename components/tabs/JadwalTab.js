import { useState } from 'react'
import html2canvas from 'html2canvas'

export function JadwalTab({ siswa = [], users = [], branches = [], perkembangan = [] }) {
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10))
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
  
  // Ambil nama hari dari tanggal terpilih
  const getDayName = (dateStr) => {
    const d = new Date(dateStr);
    return days[(d.getDay() + 6) % 7];
  };

  const [selectedDay, setSelectedDay] = useState(getDayName(targetDate))

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setTargetDate(newDate);
    setSelectedDay(getDayName(newDate)); // HARI OTOMATIS BERUBAH
  };

  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00']
  const guruList = (users || []).filter(u => u.akses?.toLowerCase() === 'guru')
  
  // Filter data perkembangan berdasarkan tanggal
  const dataHadir = (perkembangan || []).filter(p => String(p.tanggal) === targetDate);

  return (
    <div className="flex flex-col gap-md" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* FILTER & HARI */}
      <div className="glass-card" style={{ padding: '15px', marginBottom: '10px' }}>
         <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div>
               <label style={{ fontSize: '11px', color: '#94a3b8' }}>Filter Tanggal:</label>
               <input type="date" value={targetDate} onChange={handleDateChange} style={{ padding: '8px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '4px' }} />
            </div>
            {/* Indikator Hari yang sedang aktif */}
            <div style={{ padding: '10px 20px', background: '#2563eb', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', color: '#fff' }}>
                {selectedDay}
            </div>
         </div>
      </div>

      <div id="matrix-jadwal" className="glass-card" style={{ padding: '15px', overflowX: 'auto', background: '#0f172a' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '12px' }}>
          <thead>
            <tr>
              <th style={{ padding: '10px', borderBottom: '1px solid #334155', textAlign: 'left' }}>GURU</th>
              {timeSlots.map(t => <th key={t} style={{ textAlign: 'center', padding: '10px', borderBottom: '1px solid #334155' }}>{t}</th>)}
            </tr>
          </thead>
          <tbody>
            {guruList.map(guru => (
              <tr key={guru.id}>
                <td style={{ padding: '10px', borderBottom: '1px solid #334155', fontWeight: 'bold' }}>{guru.nama}</td>
                {timeSlots.map(slot => (
                  <td key={slot} style={{ border: '1px solid #1e293b', verticalAlign: 'top', padding: '5px', minWidth: '100px' }}>
                    {siswa.filter(s => 
                      s.guru_id === guru.id && 
                      s.hari?.includes(selectedDay) && 
                      s.jam_mulai?.startsWith(slot.substring(0,2))
                    ).map(s => {
                      // CEK KEHADIRAN: ID Siswa di tabel perkembangan harus sama dengan ID Siswa di jadwal
                      const isHadir = dataHadir.some(p => String(p.siswa_id) === String(s.id));
                      return (
                        <div key={s.id} style={{ 
                            background: isHadir ? '#10b981' : '#334155', 
                            padding: '6px', borderRadius: '4px', marginBottom: '4px', color: '#fff',
                            fontSize: '11px', fontWeight: '500', transition: '0.3s'
                        }}>
                          {isHadir ? '✅ ' : '👤 '} {s.nama}
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
