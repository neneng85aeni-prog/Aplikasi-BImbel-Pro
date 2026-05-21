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
    setSelectedDay(getDayName(newDate));
  };

  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00']
  const guruList = (users || []).filter(u => u.akses?.toLowerCase() === 'guru')
  
  // === LOGIKA TOTAL HADIR ===
  // Mengambil ID siswa unik yang ada di tabel perkembangan untuk tanggal tersebut
  const dataHadir = (perkembangan || []).filter(p => String(p.tanggal) === targetDate);
  const totalHadir = new Set(dataHadir.map(p => String(p.siswa_id))).size;

  const handleDownloadImage = (tampilkanGuru) => {
    const element = document.getElementById('matrix-jadwal');
    
    // Ambil semua elemen kolom guru
    const kolomGuru = document.querySelectorAll('.col-guru');
    
    // Jika user memilih "Tanpa Guru", kita sembunyikan kolomnya sesaat
    if (!tampilkanGuru) {
      kolomGuru.forEach(el => el.style.display = 'none');
    }

    html2canvas(element, { scale: 2, backgroundColor: '#0f172a' }).then(canvas => {
      const link = document.createElement('a');
      // Nama file otomatis menyesuaikan pilihan
      link.download = `Jadwal_${selectedDay}_${targetDate}${tampilkanGuru ? '' : '_TanpaGuru'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      // Kembalikan kolom guru seperti semula setelah foto diambil
      if (!tampilkanGuru) {
        kolomGuru.forEach(el => el.style.display = '');
      }
    });
  };

  return (
    <div className="flex flex-col gap-md" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* FILTER & STATISTIK HADIR */}
      <div className="glass-card" style={{ padding: '15px', display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
         <div>
            <label style={{ fontSize: '11px', color: '#94a3b8' }}>Pilih Tanggal:</label>
            <input type="date" value={targetDate} onChange={handleDateChange} style={{ padding: '8px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '4px' }} />
         </div>
         
         <div style={{ padding: '8px 15px', background: '#2563eb', borderRadius: '6px', fontWeight: 'bold', color: '#fff', textAlign: 'center' }}>
            {selectedDay}
         </div>

         {/* BADGE TOTAL HADIR */}
         <div style={{ marginLeft: 'auto', padding: '8px 15px', background: '#059669', borderRadius: '6px', color: '#fff', fontWeight: 'bold' }}>
            Total Hadir: {totalHadir} Siswa
         </div>

         <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
           <button onClick={() => handleDownloadImage(true)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
             📸 Export (Ada Guru)
           </button>
           <button onClick={() => handleDownloadImage(false)} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
             📸 Export (Tanpa Guru)
           </button>
         </div>
      </div>

      {/* MATRIX JADWAL */}
      <div id="matrix-jadwal" className="glass-card" style={{ padding: '15px', overflowX: 'auto', background: '#0f172a' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '12px' }}>
          <thead>
            <tr>
              <th className="col-guru" style={{ padding: '10px', borderBottom: '1px solid #334155', textAlign: 'left' }}>GURU</th>
              {timeSlots.map(t => <th key={t} style={{ textAlign: 'center', padding: '10px', borderBottom: '1px solid #334155' }}>{t}</th>)}
            </tr>
          </thead>
          <tbody>
            {guruList.map(guru => (
              <tr key={guru.id}>
                <td className="col-guru" style={{ padding: '10px', borderBottom: '1px solid #334155', fontWeight: 'bold' }}>{guru.nama}</td>
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
