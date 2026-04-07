import { useState, useEffect } from 'react'
import { formatTanggal } from '../../lib/format'

// FUNGSI BANTUAN 1: Menghitung Jam Selesai (+1.5 Jam)
function getJamSelesai(jamMulai) {
  if (!jamMulai) return '-';
  try {
    let [h, m] = jamMulai.split(':').map(Number);
    m += 30; 
    if (m >= 60) { h += 1; m -= 60; }
    h += 1; 
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  } catch { return '-'; }
}

// FUNGSI BANTUAN 2: Cek apakah waktu sekarang sudah melewati 1.5 jam dari jam mulai
function isSudahLewatSesi(jamMulai, currentTime) {
  if (!jamMulai) return false;
  try {
    const [h, m] = jamMulai.split(':').map(Number);
    const sesiStart = new Date(currentTime);
    sesiStart.setHours(h, m, 0, 0);
    
    // Tambah 90 menit (1.5 jam) ke jam mulai
    const threshold = new Date(sesiStart.getTime() + (1.5 * 60 * 60 * 1000));
    
    return currentTime > threshold;
  } catch { return false; }
}

export function AbsensiSiswaTab({
  siswaTampil, perkembanganTampil, openSmartWA
}) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20 

  // Update jam setiap menit agar deteksi "Sesi Lewat" berjalan real-time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // === 1. PASTIKAN WAKTU WIB & TANGGAL AKURAT ===
  const wibTime = new Date(currentTime.getTime() + (7 * 60 * 60 * 1000));
  const hariMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayName = hariMap[wibTime.getUTCDay()]; 
  const todayStr = wibTime.toISOString().slice(0, 10);

  // === 2. FILTER SISWA JADWAL HARI INI (ANTI HURUF KECIL/BESAR) ===
  const siswaTampilHariIni = (siswaTampil || []).filter(s => {
    // Buang siswa yang statusnya sudah nonaktif
    if (s.status === 'nonaktif' || s.status === 'Nonaktif') return false;
    
    let matchDay = false;
    if (Array.isArray(s.hari)) {
      matchDay = s.hari.some(h => h?.toLowerCase() === todayName.toLowerCase());
    } else if (typeof s.hari === 'string') {
      matchDay = s.hari.toLowerCase().includes(todayName.toLowerCase());
    }
    return matchDay;
  }).map(s => {
    // === 3. CEK STATUS HADIR (TANPA MENGHAPUS DATA) ===
    const isSudahHadir = (perkembanganTampil || []).some(p => p.siswa_id === s.id && p.tanggal.startsWith(todayStr));
    return { ...s, isSudahHadir };
  }).sort((a, b) => {
    // Urutkan: Yang belum hadir di atas, yang sudah hadir di bawah. Lalu urutkan jam.
    if (a.isSudahHadir !== b.isSudahHadir) return a.isSudahHadir ? 1 : -1;
    const jamA = a.jam_mulai || '99:99';
    const jamB = b.jam_mulai || '99:99';
    return jamA.localeCompare(jamB);
  });

  // Karena variabelnya kita ubah namanya, kita sesuaikan paginasinya
  const totalPages = Math.ceil(siswaTampilHariIni.length / ITEMS_PER_PAGE);
  const paginatedSiswa = siswaTampilHariIni.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // 3. PAGINATION
  const totalPages = Math.ceil(siswaBelumHadir.length / ITEMS_PER_PAGE);
  const paginatedSiswa = siswaBelumHadir.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const goToPage = (page) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };

  const handleSendWA = (siswa) => {
    if (!siswa.no_hp) return alert('Maaf, nomor HP tidak ditemukan.');
    const text = `Halo Ayah/Bunda,\n\nKami menginformasikan bahwa hari ini ananda *${siswa.nama}* belum hadir di kelas untuk sesi jam ${siswa.jam_mulai || '-'} s.d ${getJamSelesai(siswa.jam_mulai)}.\n\nMohon konfirmasinya ya Ayah/Bunda jika ananda berhalangan hadir. Terima kasih 🙏`;
    openSmartWA(siswa.no_hp, text);
  }

  return (
    <div className="grid gap-lg">
      <div className="glass-card">
        <h2 className="section-title">Monitoring Kehadiran Real-Time</h2>
        
        <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Hari Ini:</div>
              <b>{todayName}, {formatTanggal(todayStr)}</b>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Waktu Sekarang:</div>
              <b style={{ fontSize: '18px', color: '#60a5fa' }}>
                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </b>
            </div>
          </div>
          <p style={{ marginTop: '10px', fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
            *Tombol WA akan muncul otomatis jika waktu sekarang sudah melewati 1.5 jam dari jam masuk siswa.
          </p>
        </div>

        <div className="table-wrap" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#1e293b' }}>Nama Siswa</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#1e293b' }}>Guru</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#1e293b' }}>Sesi Belajar</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#1e293b' }}>Status</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#1e293b', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <td>
                      {s.isSudahHadir ? (
                        <span style={{ fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                          ✅ SUDAH HADIR
                        </span>
                      ) : (
                        <span style={{ fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', background: sesiLewat ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: sesiLewat ? '#ef4444' : '#f59e0b' }}>
                          {sesiLewat ? 'BELUM HADIR' : 'MENUNGGU'}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {(!s.isSudahHadir && sesiLewat) ? (
                        <button className="btn btn-primary btn-small" onClick={() => handleSendWA(s)} style={{ background: '#10b981', borderColor: '#10b981' }}>💬 Tanya Kabar</button>
                      ) : (
                        <span style={{fontSize:'11px', color:'#94a3b8'}}>{s.isSudahHadir ? 'Selesai' : 'Belum Mulai'}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Hal {currentPage} dari {totalPages}</span>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button className="btn btn-secondary btn-small" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>Prev</button>
              <button className="btn btn-secondary btn-small" disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
