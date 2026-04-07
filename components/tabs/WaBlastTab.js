import { useState } from 'react';

export function WaBlastTab({ siswaTampil = [], branches = [] }) {
  // === STATE UNTUK TEMPLATE & FILTER ===
  const [template, setTemplate] = useState('Halo Ayah/Bunda wali dari {nama}, \n\nKami menginformasikan bahwa...\n\nTerima kasih.');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [sentLog, setSentLog] = useState([]); // Menyimpan ID siswa yang sudah diklik hari ini

  // === DATA TEMPLATE CEPAT ===
  const quickTemplates = {
    tagihan: "Halo Ayah/Bunda wali dari *{nama}*, 🙏\n\nMenginformasikan bahwa tagihan SPP bulan ini telah terbit. Mohon abaikan pesan ini jika sudah melakukan pembayaran.\n\nTerima kasih.",
    libur: "Assalamualaikum Ayah/Bunda, \n\nSehubungan dengan libur nasional, sesi belajar ananda *{nama}* besok DILIBURKAN dan akan diganti di hari berikutnya.\n\nSelamat berlibur! 🎉",
    promo: "Kabar gembira! Bimbel Pro sedang ada promo kelas baru. Khusus untuk siswa aktif seperti *{nama}*, ada diskon 50% lho! Balas pesan ini untuk info lanjut ya."
  };

  // === FILTER SISWA ===
  const filteredSiswa = siswaTampil.filter(s => {
    // Jangan tampilkan siswa nonaktif
    if (s.status === 'nonaktif' || s.status === 'Nonaktif') return false;
    // Filter cabang jika dipilih
    if (selectedBranch && s.branch_id !== selectedBranch) return false;
    // Harus punya nomor HP
    if (!s.no_hp) return false;
    return true;
  });

  // === FUNGSI EKSEKUSI KIRIM WA ===
  const handleSendWA = (siswa) => {
    if (!siswa.no_hp) return;

    // 1. Ganti variabel {nama} dengan nama asli siswa
    const finalMessage = template.replace(/{nama}/g, siswa.nama);

    // 2. Rapikan nomor HP (Ganti 08 menjadi 628)
    let phone = siswa.no_hp.replace(/\D/g, ''); // Hapus karakter non-angka
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }

    // 3. Catat bahwa siswa ini sudah diklik kirim
    if (!sentLog.includes(siswa.id)) {
      setSentLog([...sentLog, siswa.id]);
    }

    // 4. Buka WhatsApp Web / App
    const encodedText = encodeURIComponent(finalMessage);
    const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="grid gap-lg" style={{ gridTemplateColumns: '1fr 2fr' }}>
      
      {/* KOTAK KIRI: PENGATURAN PESAN */}
      <div className="glass-card" style={{ alignSelf: 'start' }}>
        <h2 className="section-title">Konsep Pesan (Template)</h2>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-small" onClick={() => setTemplate(quickTemplates.tagihan)}>💰 SPP</button>
          <button className="btn btn-secondary btn-small" onClick={() => setTemplate(quickTemplates.libur)}>🏖️ Libur</button>
          <button className="btn btn-secondary btn-small" onClick={() => setTemplate(quickTemplates.promo)}>📢 Promo</button>
        </div>

        <div className="form-row">
          <label>Teks Pesan <span style={{fontSize:'11px', color:'#94a3b8'}}>(Gunakan <b>{'{nama}'}</b> untuk memanggil nama anak)</span></label>
          <textarea 
            rows="8" 
            value={template} 
            onChange={(e) => setTemplate(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px' }}
          />
        </div>

        <div className="form-row" style={{ marginTop: '15px' }}>
          <label>Filter Target Cabang</label>
          <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px' }}>
            <option value="">-- Semua Cabang --</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.nama}</option>)}
          </select>
        </div>
        
        <div style={{ marginTop: '15px', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '11px', color: '#a7f3d0' }}>
          💡 <b>Cara Penggunaan:</b> Ketik pesan di atas, lalu klik tombol "Kirim WA" pada tabel di sebelah kanan satu per satu dari atas ke bawah.
        </div>
      </div>

      {/* KOTAK KANAN: DAFTAR TARGET & EKSEKUSI */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Target Pengiriman</h2>
          <span style={{ fontSize: '12px', background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', padding: '4px 10px', borderRadius: '20px' }}>
            {filteredSiswa.length} Siswa Ditemukan
          </span>
        </div>

        <div className="table-wrap" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <table style={{ width: '100%' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ background: '#1e293b' }}>Nama Siswa</th>
                <th style={{ background: '#1e293b' }}>No. HP</th>
                <th style={{ background: '#1e293b', textAlign: 'center' }}>Status Eksekusi</th>
              </tr>
            </thead>
            <tbody>
              {filteredSiswa.map(siswa => {
                const isSent = sentLog.includes(siswa.id);
                return (
                  <tr key={siswa.id} style={{ background: isSent ? 'rgba(16, 185, 129, 0.05)' : 'transparent' }}>
                    <td>
                      <b>{siswa.nama}</b>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>{siswa.branches?.nama || 'Pusat'}</div>
                    </td>
                    <td style={{ fontSize: '12px', color: '#e2e8f0' }}>{siswa.no_hp}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className={`btn btn-small ${isSent ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => handleSendWA(siswa)}
                        style={{ 
                          background: isSent ? 'transparent' : '#10b981', 
                          border: isSent ? '1px solid #10b981' : 'none',
                          color: isSent ? '#10b981' : '#fff'
                        }}
                      >
                        {isSent ? '✅ Selesai (Kirim Ulang)' : '📲 Kirim WA'}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filteredSiswa.length === 0 && (
                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>Tidak ada data siswa dengan nomor HP.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
