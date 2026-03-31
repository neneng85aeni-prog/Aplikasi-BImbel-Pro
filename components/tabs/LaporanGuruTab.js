import { useState } from 'react'

export function LaporanGuruTab({ users, perkembanganTampil, siswaTampil, absensiSiswa }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // 1. Ambil Bulan Sekarang untuk default filter
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  // Set default filter jika belum ada
  const start = startDate || firstDay;
  const end = endDate || lastDay;

  const laporanGuru = users
    .filter(u => u.akses === 'guru' || u.akses === 'GURU')
    .map(guru => {
      // A. TOTAL TERDAFTAR (Fixed dari Profil Siswa)
      const terdaftar = siswaTampil.filter(s => s.guru_default_id === guru.id).length;

      // B. TOTAL SISWA UNIK (Berapa anak yang pernah diajar di periode ini)
      const uniqueSiswaIds = perkembanganTampil
        .filter(p => {
          const matchGuru = p.guru_handle_id === guru.id;
          const matchDate = p.tanggal >= start && p.tanggal <= end;
          return matchGuru && matchDate;
        })
        .map(p => p.siswa_id);
      const totalSiswaUnik = [...new Set(uniqueSiswaIds)].length;

      // C. TOTAL KEDATANGAN / SESI (Menghitung setiap kali Scan Siswa)
      // Kita hitung dari tabel absensi_siswa yang ditangani guru tersebut
      const totalSesi = (absensiSiswa || []).filter(abs => {
        const matchGuru = abs.guru_id === guru.id; // Pastikan kolom guru_id ada di tabel absensi
        const matchDate = abs.tanggal >= start && abs.tanggal <= end;
        return matchGuru && matchDate;
      }).length;

      return {
        nama: guru.nama,
        terdaftar: terdaftar,
        siswaUnik: totalSiswaUnik,
        totalSesi: totalSesi,
        selisih: terdaftar - totalSiswaUnik
      }
    })
    .filter(g => g.nama.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 className="section-title" style={{ margin: 0 }}>Laporan Performa & Sesi Guru</h2>
          <p className="text-muted" style={{ fontSize: '13px' }}>Periode: <b>{start}</b> s/d <b>{end}</b></p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
             <input type="date" value={start} onChange={(e) => setStartDate(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'inherit', outline: 'none', fontSize: '13px' }} />
             <span style={{ fontSize: '12px', color: '#94a3b8' }}>-</span>
             <input type="date" value={end} onChange={(e) => setEndDate(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'inherit', outline: 'none', fontSize: '13px' }} />
          </div>
          <input 
            type="text" 
            placeholder="🔍 Cari Guru..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
          />
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nama Guru</th>
              <th style={{ textAlign: 'center' }}>Siswa Terdaftar (Profil)</th>
              <th style={{ textAlign: 'center' }}>Siswa Aktif (Unik)</th>
              <th style={{ textAlign: 'center', background: 'rgba(59, 130, 246, 0.1)' }}>Total Sesi (Scan QR)</th>
              <th style={{ textAlign: 'center' }}>Status Keaktifan</th>
            </tr>
          </thead>
          <tbody>
            {laporanGuru.map((g, i) => (
              <tr key={i}>
                <td><b>{g.nama}</b></td>
                <td style={{ textAlign: 'center' }}>{g.terdaftar} Anak</td>
                <td style={{ textAlign: 'center' }}>{g.siswaUnik} Anak</td>
                <td style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', color: '#60a5fa' }}>
                  {g.totalSesi} <span style={{fontSize: '12px'}}>Sesi</span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  {g.siswaUnik >= g.terdaftar ? (
                    <span className="badge-success">Full Output</span>
                  ) : (
                    <span className="badge-danger">{g.selisih} Belum Terjamah</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
