import { useState } from 'react'
import html2canvas from 'html2canvas'

export function JadwalTab({ siswa = [], users = [], branches = [], perkembangan = [] }) {
  // 1. Logika Tanggal & Hari Otomatis
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10))
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
  
  // Fungsi untuk mendapatkan nama hari dari tanggal
  const getDayName = (dateStr) => {
    const d = new Date(dateStr);
    // 0=Minggu, 1=Senin, dst.
    const dayIndex = (d.getDay() + 6) % 7; 
    return days[dayIndex];
  };

  const [selectedDay, setSelectedDay] = useState(getDayName(targetDate))

  // Update hari otomatis saat tanggal berubah
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setTargetDate(newDate);
    setSelectedDay(getDayName(newDate));
  };

  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00']
  const guruList = (users || []).filter(u => u.akses?.toLowerCase() === 'guru')
  
  // Data dari tabel perkembangan
  const dataHadir = (perkembangan || []).filter(p => String(p.tanggal) === targetDate);

  const handleDownloadImage = () => {
    const element = document.getElementById('matrix-jadwal');
    html2canvas(element, { scale: 2, backgroundColor: '#0f172a' }).then(canvas => {
      const link = document.createElement('a');
      link.download = `Jadwal_${targetDate}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  return (
    <div className="flex flex-col gap-md" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      <div className="glass-card" style={{ padding: '15px', display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '10px' }}>
         <div>
            <label style={{ fontSize: '11px', color: '#94a3b8' }}>Pilih Tanggal:</label>
            <input type="date" value={targetDate} onChange={handleDateChange} style={{ padding: '8px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '4px' }} />
         </div>
         
         <div style={{ padding: '8px', background: '#2563eb', color: '#fff', borderRadius: '4px', fontWeight: 'bold' }}>
            {selectedDay}
         </div>

         <button onClick={handleDownloadImage} style={{ marginLeft: 'auto', background: '#10b981', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
           📸 Export Image
         </button>
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
                      const isHadir = dataHadir.some(p => String(p.siswa_id) === String(s.id));
                      return (
                        <div key={s.id} style={{ 
                            background: isHadir ? '#10b981' : '#334155', 
                            padding: '6px', borderRadius: '4px', marginBottom: '4px', color: '#fff',
                            fontSize: '11px', fontWeight: '500'
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
