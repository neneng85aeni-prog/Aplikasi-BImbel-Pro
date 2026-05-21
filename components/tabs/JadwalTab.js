import { useState } from 'react'
import html2canvas from 'html2canvas'

export function JadwalTab({ siswa = [], users = [], branches = [], perkembangan = [] }) {
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10))
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
  
  const getDayName = (dateStr) => {
    const d = new Date(dateStr);
    return days[(d.getDay() + 6) % 7];
  };

  const [selectedDay, setSelectedDay] = useState(getDayName(targetDate))
  
  // === STATE BARU: Untuk mengontrol bentuk tabel saat export ===
  const [isExportMode, setIsExportMode] = useState(false);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setTargetDate(newDate);
    setSelectedDay(getDayName(newDate));
  };

  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00']
  const guruList = (users || []).filter(u => u.akses?.toLowerCase() === 'guru')
  
  const dataHadir = (perkembangan || []).filter(p => String(p.tanggal) === targetDate);
  const totalHadir = new Set(dataHadir.map(p => String(p.siswa_id))).size;

  // === FUNGSI DOWNLOAD BARU: BISA MENGUBAH BENTUK TABEL SESAAT ===
  const handleDownloadImage = (tanpaGuru = false) => {
    if (tanpaGuru) {
      setIsExportMode(true); // Ubah wujud tabel jadi 1 baris
    }

    // Tunggu 300 milidetik agar React selesai merapatkan tabel, lalu foto!
    setTimeout(() => {
      const element = document.getElementById('matrix-jadwal');
      
      html2canvas(element, { scale: 2, backgroundColor: '#0f172a' }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Jadwal_${selectedDay}_${targetDate}${tanpaGuru ? '_Tanpa_Guru' : ''}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        // Kembalikan ke wujud normal setelah selesai foto
        if (tanpaGuru) setIsExportMode(false);
      });
    }, tanpaGuru ? 300 : 0);
  };

  return (
    <div className="flex flex-col gap-md" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      <div className="glass-card" style={{ padding: '15px', display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
         <div>
            <label style={{ fontSize: '11px', color: '#94a3b8' }}>Pilih Tanggal:</label>
            <input type="date" value={targetDate} onChange={handleDateChange} style={{ padding: '8px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '4px' }} />
         </div>
         
         <div style={{ padding: '8px 15px', background: '#2563eb', borderRadius: '6px', fontWeight: 'bold', color: '#fff', textAlign: 'center' }}>
            {selectedDay}
         </div>

         <div style={{ padding: '8px 15px', background: '#059669', borderRadius: '6px', color: '#fff', fontWeight: 'bold' }}>
            Total Hadir: {totalHadir} Siswa
         </div>

         {/* DUA TOMBOL EXPORT */}
         <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
           <button onClick={() => handleDownloadImage(false)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
             📸 Export (Ada Guru)
           </button>
           <button onClick={() => handleDownloadImage(true)} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
             📸 Export (Tanpa Guru)
           </button>
         </div>
      </div>

      <div id="matrix-jadwal" className="glass-card" style={{ padding: '15px', overflowX: 'auto', background: '#0f172a' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '12px' }}>
          <thead>
            <tr>
              {/* Kolom Guru Dihilangkan kalau Mode Tanpa Guru Aktif */}
              {!isExportMode && (
                <th style={{ padding: '10px', borderBottom: '1px solid #334155', textAlign: 'left' }}>GURU</th>
              )}
              {timeSlots.map(t => <th key={t} style={{ textAlign: 'center', padding: '10px', borderBottom: '1px solid #334155' }}>{t}</th>)}
            </tr>
          </thead>
          <tbody>
            
            {isExportMode ? (
              // =========================================================
              // TAMPILAN 1: MODE PADAT (TANPA GURU, URUT ABJAD)
              // =========================================================
              <tr>
                {timeSlots.map(slot => {
                  // FILTER NONAKTIF DITAMBAHKAN DI SINI
                  const studentsInSlot = siswa
                    .filter(s => s.status !== 'nonaktif' && s.hari?.includes(selectedDay) && s.jam_mulai?.startsWith(slot.substring(0,2)))
                    .sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));

                  return (
                    <td key={slot} style={{ border: '1px solid #1e293b', verticalAlign: 'top', padding: '5px', minWidth: '100px' }}>
                      {studentsInSlot.map(s => {
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
                  )
                })}
              </tr>
            ) : (
              // =========================================================
              // TAMPILAN 2: MODE NORMAL (PER GURU)
              // =========================================================
              guruList.map(guru => (
                <tr key={guru.id}>
                  <td style={{ padding: '10px', borderBottom: '1px solid #334155', fontWeight: 'bold' }}>{guru.nama}</td>
                  {timeSlots.map(slot => (
                    <td key={slot} style={{ border: '1px solid #1e293b', verticalAlign: 'top', padding: '5px', minWidth: '100px' }}>
                      {/* FILTER NONAKTIF DITAMBAHKAN DI SINI */}
                      {siswa.filter(s => 
                        s.status !== 'nonaktif' &&
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
              ))
            )}
            
          </tbody>
        </table>
      </div>
    </div>
  )
}
