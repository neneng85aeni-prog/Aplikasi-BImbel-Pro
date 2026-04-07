import { useState, useEffect } from 'react'
import { formatTanggal } from '../../lib/format'

export function AbsensiSiswaTab({
  siswaTampil, perkembanganTampil, openSmartWA
}) {
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update jam setiap 1 menit agar trigger Jam 16:00 otomatis berjalan
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Kamus Hari
  const hariMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const todayName = hariMap[currentTime.getDay()]
  const todayStr = currentTime.toISOString().slice(0, 10)
  
  // Deteksi apakah sudah lewat dari jam 16:00 (Jam 3 sore)
  const isPast3PM = currentTime.getHours() >= 16

  // 1. CARI: Siapa saja siswa yang jadwalnya (hari) cocok dengan hari ini?
  const siswaJadwalHariIni = (siswaTampil || []).filter(s => s.hari?.includes(todayName))

  // 2. FILTER: Dari siswa tersebut, siapa yang BELUM ada di tabel perkembangan hari ini?
  const siswaBelumHadir = siswaJadwalHariIni.filter(s => {
    const sudahHadir = (perkembanganTampil || []).some(p => p.siswa_id === s.id && p.tanggal.startsWith(todayStr))
    return !sudahHadir // Hanya kembalikan yang FALSE (Belum hadir)
  })

  // FUNGSI KIRIM WA OTOMATIS
  const handleSendWA = (siswa) => {
    if (!siswa.no_hp) return alert('Maaf, siswa ini belum memiliki nomor HP.');
    
    const text = `Halo Ayah/Bunda,\n\nKami dari manajemen menginformasikan bahwa hari ini (${todayName}, ${formatTanggal(todayStr)}) ananda *${siswa.nama}* belum terlihat hadir di kelas untuk jadwal belajarnya (Jam ${siswa.jam_mulai || '-'}).\n\nApakah ananda berhalangan hadir hari ini? Mohon konfirmasinya ya Ayah/Bunda agar kami bisa menyesuaikan jadwalnya.\n\nTerima kasih 🙏\n\nSalam hangat,\nAdmin Bimbel`;
    
    openSmartWA(siswa.no_hp, text);
  }

  return (
    <div className="grid gap-lg">
      <div className="glass-card">
        <h2 className="section-title">Monitoring Kehadiran (Otomatis)</h2>
        
        <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>Jadwal Hari Ini:</div>
              <b style={{ fontSize: '16px' }}>{todayName}, {formatTanggal(todayStr)}</b>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>Jam Server Saat Ini:</div>
              <b style={{ fontSize: '18px', color: isPast3PM ? '#ef4444' : '#10b981' }}>
                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </b>
            </div>
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>
            *Sistem membandingkan <b>Jadwal Siswa</b> dengan <b>Input Laporan Perkembangan</b> hari ini.<br/>
            *Siswa akan berstatus "MENUNGGU SESI" sebelum jam 15:00. Jika jam 15:00 terlewati dan guru belum menginput perkembangan, status berubah menjadi "BELUM HADIR" dan tombol WA otomatis terbuka.
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama Siswa</th>
                <th>Jadwal Masuk</th>
                <th>Status Hari Ini</th>
                <th style={{ textAlign: 'center' }}>Aksi Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {siswaBelumHadir.map(s => (
                <tr key={s.id}>
                  <td>
                    <b>{s.nama}</b>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{s.branches?.nama || 'Pusat'}</div>
                  </td>
                  <td>Jam {s.jam_mulai || '-'}</td>
                  <td>
                    <span style={{ 
                      fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', fontSize: '12px',
                      background: isPast3PM ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: isPast3PM ? '#ef4444' : '#f59e0b'
                    }}>
                      {isPast3PM ? 'BELUM HADIR' : 'MENUNGGU SESI'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {isPast3PM ? (
                      <button 
                        className="btn btn-primary btn-small" 
                        onClick={() => handleSendWA(s)}
                        style={{ background: '#10b981', borderColor: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        💬 Tanya Kabar
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                        ⏳ Tunggu Jam 15:00
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {siswaBelumHadir.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#10b981' }}>
                    <div style={{ fontSize: '30px', marginBottom: '10px' }}>🎉</div>
                    <b>Luar Biasa!</b><br/>
                    Semua siswa yang jadwalnya hari ini sudah hadir dan diinput oleh guru (Atau tidak ada kelas hari ini).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
