import { useState } from 'react'
import QRCode from 'qrcode'
import { INITIAL_SISWA_FORM } from '../../lib/constants'
import { printBarcodeCard, BarcodePreview } from '../ui/BarcodePreview'

async function openAndroidQrSharePage(item) {
  const value = item?.kode_qr || item?.id
  if (!value) {
    alert('QR siswa belum tersedia')
    return
  }

  const qr = await QRCode.toDataURL(value, { margin: 1, width: 720 })
  const title = item?.nama || 'Siswa'
  const subtitle = `${item?.branches?.nama || '-'} • ${item?.kelas || '-'}`

  const w = window.open('', '_blank')
  if (!w) {
    alert('Popup diblokir browser. Izinkan popup untuk melanjutkan.')
    return
  }

  w.document.write(`<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>QR ${title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #ffffff; color: #000000; text-align: center; }
        .card { max-width: 420px; margin: 0 auto; border: 1px solid #d7dfef; border-radius: 16px; padding: 20px; }
        h2 { margin: 0 0 6px; font-size: 18px; }
        .sub { color: #334155; font-size: 13px; margin-bottom: 16px; }
        img { width: 240px; max-width: 100%; height: auto; border-radius: 12px; }
        .code { margin-top: 12px; font-size: 12px; word-break: break-all; }
        .help { margin-top: 18px; text-align: left; font-size: 13px; line-height: 1.5; color: #334155; background: #f8fafc; border-radius: 12px; padding: 12px; }
        .actions { margin-top: 16px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
        .btn { border: none; border-radius: 10px; padding: 10px 14px; cursor: pointer; font-weight: 600; }
        .btn-primary { background: #111827; color: #fff; }
        .btn-secondary { background: #e5e7eb; color: #111827; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>${title}</h2>
        <div class="sub">${subtitle}</div>
        <img src="${qr}" alt="QR ${title}" />
        <div class="code">${value}</div>
        <div class="actions">
          <button class="btn btn-primary" onclick="downloadQr()">Download QR</button>
          <button class="btn btn-secondary" onclick="window.close()">Tutup</button>
        </div>
        <div class="help">
          <b>Cara print di Android:</b><br />
          1. Tekan tombol <b>Download QR</b><br />
          2. Buka aplikasi printer bluetooth thermal<br />
          3. Pilih menu print image / print gambar<br />
          4. Pilih file QR yang tadi diunduh lalu print
        </div>
      </div>
      <script>
        function downloadQr() {
          const a = document.createElement('a');
          a.href = "${qr}";
          a.download = "${title}-barcode.png";
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
      </script>
    </body>
  </html>`)
  w.document.close()
}

export function SiswaTab({ 
  user, siswaForm, setSiswaForm, siswaTampil, programs, guruOptions, branches, 
  onGenerateBarcode, onSubmit, onReset, onEdit, onDelete, onPrintBarcode, 
  searchSiswa, setSearchSiswa,
  // === PROPS BARU PENGINGAT ===
  onSendManualReminder, perkembanganTampil = [], transaksiTampil = []
}) {
  
  // STATE LOKAL UNTUK PAGINASI & MODE PENGINGAT
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [isReminderMode, setIsReminderMode] = useState(false);
  const [sentList, setSentList] = useState([]); // Menyimpan ID pesan yang sudah dikirim

  // LOGIKA PENCARIAN & PAGINASI
  const handleSearch = (e) => {
    if (setSearchSiswa) setSearchSiswa(e.target.value);
    setCurrentPage(1); 
  };

  const siswaAktifTampil = siswaTampil.filter(s => s.status !== 'nonaktif' && s.status !== 'Nonaktif');
  const totalPages = Math.ceil(siswaAktifTampil.length / ITEMS_PER_PAGE);
  const paginatedData = siswaAktifTampil.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const goToPage = (page) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };

  // === LOGIKA MODE FOKUS PENGINGAT ===
  const namaHariIni = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date());

  // Filter siswa yang HANYA masuk hari ini
  const siswaHariIni = siswaAktifTampil.filter(s => 
    s.hari && String(s.hari).toLowerCase().includes(namaHariIni.toLowerCase())
  );

  // Deteksi Jatuh Tempo (Sistem Kuota Terhubung Kasir & Bulanan)
  const getStatusBayar = (siswa) => {
    const programNama = siswa.programs?.nama || "";
    const programDeskripsi = siswa.programs?.deskripsi || "";
    
    // 1. Cek Sesi (Sistem Kuota Kasir)
    const matchSesi = programNama.match(/(\d+)x/i);
    if (matchSesi) {
      const sesiPerPaket = parseInt(matchSesi[1]);
      
      // Ambil Sisa Kuota Lama (Cut-off)
      const sesiAwal = Number(siswa.sesi_awal || 0);
      
      // Hitung tambahan sesi dari pembayaran di Kasir
      const totalBayarKasir = transaksiTampil.filter(t => t.siswa_id === siswa.id && t.program_id === siswa.program_id).length;
      const tambahanSesi = totalBayarKasir * sesiPerPaket;
      
      // Hitung Total Kehadiran di Aplikasi
      const totalHadirAplikasi = perkembanganTampil.filter(p => p.siswa_id === siswa.id).length;
      
      // RUMUS SISA KUOTA
      const sisaSesi = (sesiAwal + tambahanSesi) - totalHadirAplikasi;
      
      if (sisaSesi <= 1) {
        return { tipe: 'SESI', info: sisaSesi <= 0 ? 'Kuota Habis!' : 'Sisa 1 Sesi lagi' };
      }
    }

    // 2. Cek Bulanan
    const isBulanan = programDeskripsi.toLowerCase().includes('bulanan');
    if (isBulanan && siswa.created_at) {
      const tglDaftar = new Date(siswa.created_at).getDate();
      const tglSekarang = new Date().getDate();
      if (tglSekarang >= tglDaftar - 3 && tglSekarang <= tglDaftar) {
        return { tipe: 'BULANAN', info: `Jatuh tempo tgl ${tglDaftar}` };
      }
    }
    return null;
  };
  
  const handleManualWA = (siswa, jenis, infoBayar = null) => {
    if(onSendManualReminder) onSendManualReminder(siswa, jenis, infoBayar);
    const uniqueKey = siswa.id + jenis;
    if (!sentList.includes(uniqueKey)) {
      setSentList([...sentList, uniqueKey]);
    }
  };

  return (
    <div className="flex flex-col gap-lg">
      
      {/* === TOMBOL SAKLAR MODE FOKUS PENGINGAT === */}
      <div style={{ marginBottom: '5px' }}>
        <button 
          className={`btn ${isReminderMode ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => setIsReminderMode(!isReminderMode)}
          style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 'bold', border: isReminderMode ? '1px solid #10b981' : 'none' }}
        >
          {isReminderMode ? '⬅️ Kembali ke Mode Pendaftaran & Daftar Siswa' : `🔔 Buka Mode Pengingat Jadwal & Tagihan (Hari ${namaHariIni})`}
        </button>
      </div>

      {isReminderMode ? (
        
        /* ========================================================= */
        /* MODE FOKUS PENGINGAT                    */
        /* ========================================================= */
        <div className="glass-card" style={{ animation: 'fadeIn 0.3s ease-in-out', borderTop: '4px solid #10b981' }}>
          <div style={{ marginBottom: '25px', textAlign: 'center' }}>
            <h2 className="section-title" style={{ fontSize: '20px' }}>Daftar Siswa Masuk Hari {namaHariIni}</h2>
            <p className="text-muted">Fokus tugas hari ini: Ada {siswaHariIni.length} siswa yang dijadwalkan hadir.</p>
          </div>

          <div className="grid gap-md">
            {siswaHariIni.length > 0 ? (
              siswaHariIni.map((item) => {
                const statusBayar = getStatusBayar(item);
                const isJadwalSent = sentList.includes(item.id + 'JADWAL');
                const isTagihanSent = sentList.includes(item.id + 'TAGIHAN');
                
                return (
                  <div key={item.id} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px',
                    padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
                    borderLeft: statusBayar ? '5px solid #ef4444' : '5px solid #3b82f6',
                    border: (isJadwalSent || (statusBayar && isTagihanSent)) ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '17px', color: '#fff' }}>
                        {item.nama} {((!statusBayar && isJadwalSent) || (statusBayar && isJadwalSent && isTagihanSent)) && '✅'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                        ⏰ Jam: {item.jam_mulai || '-'} | 📚 {item.programs?.nama || '-'}
                      </div>
                      
                      {statusBayar && (
                        <div style={{ marginTop: '8px', fontSize: '11px', color: '#f87171', fontWeight: 'bold', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                          ⚠️ TAGIHAN {statusBayar.tipe}: {statusBayar.info}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button 
                        className="btn"
                        onClick={() => handleManualWA(item, 'JADWAL')}
                        style={{ background: isJadwalSent ? '#059669' : '#10b981', color: 'white', border: 'none', padding: '8px 16px', fontSize: '13px' }}
                      >
                        {isJadwalSent ? 'Kirim Ulang Jadwal' : '📲 WA Jadwal'}
                      </button>
                      
                      {statusBayar && (
                        <button 
                          className="btn"
                          onClick={() => handleManualWA(item, 'TAGIHAN', statusBayar)}
                          style={{ background: isTagihanSent ? '#b91c1c' : '#ef4444', color: 'white', border: 'none', padding: '8px 16px', fontSize: '13px' }}
                        >
                          {isTagihanSent ? 'Kirim Ulang Tagihan' : '💸 WA Tagihan'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }} className="text-muted">
                🎉 Tidak ada jadwal siswa untuk hari ini.
              </div>
            )}
          </div>
        </div>

      ) : (

        /* ========================================================= */
        /* MODE NORMAL (FORM PENDAFTARAN & DAFTAR SISWA)     */
        /* ========================================================= */
        <>
          <div className="glass-card">
            <h2 className="section-title">Pendaftaran siswa</h2>
            <form onSubmit={onSubmit}>
              {/* --- BAGIAN 1: DATA DIRI SISWA --- */}
              <div className="grid grid-2">
                <div className="form-row">
                  <label>Nama siswa</label>
                  <input value={siswaForm.nama} onChange={(e) => setSiswaForm({ ...siswaForm, nama: e.target.value })} required />
                </div>
                <div className="form-row">
                  <label>Cabang</label>
                  <select value={siswaForm.branch_id} onChange={(e) => setSiswaForm({ ...siswaForm, branch_id: e.target.value })}>
                    <option value="">Pilih cabang</option>
                    {branches.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}
                  </select>
                </div>
              </div>

             <div className="grid grid-4" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
                <div className="form-row">
                  <label>Program Belajar</label>
                  <select value={siswaForm.program_id || ''} onChange={(e) => setSiswaForm({ ...siswaForm, program_id: e.target.value })} required>
                    <option value="">-- Pilih Program --</option>
                    {programs.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <label>Kelas</label>
                  <input value={siswaForm.kelas || ''} onChange={(e) => setSiswaForm({ ...siswaForm, kelas: e.target.value })} placeholder="Cth: 1 SD" />
                </div>
                
                {/* KOTAK BARU: Sisa Kuota Lama */}
                <div className="form-row">
                  <label>Sisa Kuota Lama</label>
                  <input type="number" min="0" value={siswaForm.sesi_awal === 0 ? '' : siswaForm.sesi_awal} onChange={(e) => setSiswaForm({ ...siswaForm, sesi_awal: parseInt(e.target.value) || 0 })} placeholder="Cth: 3" />
                </div>

                <div className="form-row">
                  <label>Status Siswa</label>
                  <select value={siswaForm.status || 'aktif'} onChange={(e) => setSiswaForm({ ...siswaForm, status: e.target.value })} style={{ border: siswaForm.status === 'nonaktif' ? '1px solid #ef4444' : '' }}>
                    <option value="aktif">🟢 Aktif</option>
                    <option value="nonaktif">🔴 Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* --- BAGIAN 2: JADWAL & GURU (KOTAK BIRU) --- */}
              <div style={{ marginTop: '10px', marginBottom: '20px', padding: '15px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div className="form-row" style={{ marginBottom: '15px' }}>
                  <label>Hari Masuk <span style={{fontSize: '11px', color: '#94a3b8'}}>(Bisa pilih lebih dari satu)</span></label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '8px', marginTop: '8px' }}>
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => {
                      const isSelected = siswaForm.hari?.includes(day);
                      return (
                        <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)', padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', border: `1px solid ${isSelected ? '#3b82f6' : 'transparent'}`, transition: 'all 0.2s' }}>
                          <input 
                            type="checkbox" 
                            checked={isSelected || false}
                            onChange={(e) => {
                              let currentDays = siswaForm.hari ? siswaForm.hari.split(',').map(d => d.trim()).filter(d => d) : [];
                              if (e.target.checked) { if(!currentDays.includes(day)) currentDays.push(day); } 
                              else { currentDays = currentDays.filter(d => d !== day); }
                              const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
                              currentDays.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
                              setSiswaForm({ ...siswaForm, hari: currentDays.join(', ') });
                            }}
                            style={{ cursor: 'pointer', accentColor: '#3b82f6', width: '16px', height: '16px' }}
                          />
                          <span style={{ fontSize: '13px', fontWeight: isSelected ? 'bold' : 'normal', color: isSelected ? '#60a5fa' : 'white' }}>{day}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-2">
                  <div className="form-row">
                    <label>Jam Mulai</label>
                    <input type="time" value={siswaForm.jam_mulai || '14:00'} onChange={(e) => setSiswaForm({ ...siswaForm, jam_mulai: e.target.value })} required />
                  </div>
                  <div className="form-row">
                    <label>Guru Pengampu (Filter Otomatis)</label>
                    <select value={siswaForm.guru_id || ''} onChange={(e) => setSiswaForm({ ...siswaForm, guru_id: e.target.value })} required disabled={!siswaForm.hari || !siswaForm.program_id}>
                      <option value="">{!siswaForm.hari ? '-- Pilih Hari & Program Dulu --' : '-- Pilih Guru Tersedia --'}</option>
                      {(guruOptions || []).filter(guru => {
                        const bisaProgram = guru.programs_can_handle?.includes(siswaForm.program_id);
                        const selectedDays = siswaForm.hari ? siswaForm.hari.split(',').map(d => d.trim()).filter(d => d) : [];
                        const bisaJadwal = selectedDays.length > 0 && selectedDays.every(day => {
                          const jadwalHari = guru.availability?.find(a => a.hari === day && a.aktif);
                          return jadwalHari && siswaForm.jam_mulai >= jadwalHari.jam_masuk && siswaForm.jam_mulai <= jadwalHari.jam_pulang;
                        });
                        return bisaProgram && bisaJadwal;
                      }).map(guru => <option key={guru.id} value={guru.id}>{guru.nama}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-2">
                <div className="form-row"><label>Nama orang tua</label><input value={siswaForm.nama_ortu} onChange={(e) => setSiswaForm({ ...siswaForm, nama_ortu: e.target.value })} /></div>
                <div className="form-row"><label>No HP (WA)</label><input value={siswaForm.no_hp} onChange={(e) => setSiswaForm({ ...siswaForm, no_hp: e.target.value })} placeholder="Cth: 0812..." /></div>
              </div>

              <div className="form-row"><label>Alamat Lengkap</label><input value={siswaForm.alamat} onChange={(e) => setSiswaForm({ ...siswaForm, alamat: e.target.value })} /></div>

              {/* --- BAGIAN 3: BARCODE --- */}
              <div className="form-row">
                <label>Barcode siswa otomatis</label>
                <div className="btn-row">
                  <input value={siswaForm.kode_qr} onChange={(e) => setSiswaForm({ ...siswaForm, kode_qr: e.target.value })} placeholder="Klik generate" />
                  <button className="btn btn-secondary" type="button" onClick={onGenerateBarcode}>Generate</button>
                </div>
              </div>

              {siswaForm.kode_qr && (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <BarcodePreview value={siswaForm.kode_qr} title="Preview barcode siswa" compact />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button className="btn btn-secondary" type="button" onClick={() => printBarcodeCard({ title: `Barcode ${siswaForm.nama || 'Siswa'}`, subtitle: siswaForm.kelas || '', value: siswaForm.kode_qr })}>Print Desktop</button>
                    <button className="btn btn-primary" type="button" onClick={() => openAndroidQrSharePage({ nama: siswaForm.nama || 'Siswa', kelas: siswaForm.kelas || '', kode_qr: siswaForm.kode_qr, branches: { nama: branches.find((item) => item.id === siswaForm.branch_id)?.nama || '-' } })}>Print Android</button>
                  </div>
                </div>
              )}

              <div className="btn-row">
                <button className="btn btn-primary" type="submit">{siswaForm.id ? '💾 Update siswa' : '💾 Simpan siswa'}</button>
                <button className="btn btn-secondary" type="button" onClick={() => onReset(INITIAL_SISWA_FORM)}>Reset</button>
              </div>
            </form>
          </div>

          <div className="glass-card">
            <h2 className="section-title">Daftar siswa</h2>
            <div style={{ marginBottom: '16px' }}>
              <input type="text" placeholder="🔍 Cari nama atau nomor HP siswa..." value={searchSiswa || ''} onChange={handleSearch} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '14px' }} />
            </div>

            <div className="table-wrap">
              <table style={{ minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Nama</th>
                    <th style={{ width: '15%' }}>Cabang</th>
                    <th style={{ width: '15%' }}>Program</th>
                    <th style={{ width: '20%' }}>Alamat</th>
                    <th style={{ width: '25%' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <b style={{ whiteSpace: 'nowrap' }}>{item.nama}</b>
                        <div className="text-muted" style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                          {item.kelas || '-'} • Guru: {item.users?.nama?.split(' ')[0] || '-'}
                        </div>
                      </td>
                      <td><span style={{ whiteSpace: 'nowrap' }}>{item.branches?.nama || '-'}</span></td>
                      <td><span style={{ whiteSpace: 'nowrap' }}>{item.programs?.nama?.split(' ')[0] || '-'}</span></td>
                      <td><div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{item.alamat || '-'}</div></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '4px' }}>
                          <button className="btn btn-secondary btn-small" type="button" onClick={() => onEdit(item)}>Edit</button>
                          <button className="btn btn-secondary btn-small" type="button" onClick={() => onPrintBarcode(item)}>Print</button>
                          <button className="btn btn-danger btn-small" type="button" onClick={() => onDelete(item.id, item.nama)}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedData.length === 0 && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>{searchSiswa ? 'Siswa tidak ditemukan.' : 'Belum ada data siswa.'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap', gap: '15px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, siswaAktifTampil.length)} dari {siswaAktifTampil.length} siswa aktif</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary btn-small" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>◀ Prev</button>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: '14px', fontWeight: 'bold' }}>{currentPage} / {totalPages}</div>
                  <button className="btn btn-secondary btn-small" disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}>Next ▶</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
