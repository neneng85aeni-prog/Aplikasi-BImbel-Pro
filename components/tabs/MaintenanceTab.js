import { useState } from 'react'

export function MaintenanceTab({ pembayaran, perkembangan, onTriggerArchive }) {
  // Pilihan Buffer (Default: 6 Bulan)
  const [buffer, setBuffer] = useState(6)

  const now = new Date();
  // Tanggal 1 pada X bulan yang lalu
  const cutoff = new Date(now.getFullYear(), now.getMonth() - buffer, 1);
  const cutoffDate = cutoff.toISOString().slice(0, 10);
  
  const oldTrans = pembayaran.filter(item => item.tanggal && item.tanggal < cutoffDate);
  const oldPerk = perkembangan.filter(item => item.tanggal && item.tanggal < cutoffDate);
  const hasOldData = oldTrans.length > 0 || oldPerk.length > 0;

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const targetLabel = `1 ${monthNames[cutoff.getMonth()]} ${cutoff.getFullYear()}`;

  return (
    <div className="grid gap-lg">
      <div className="glass-card">
        <h2 className="section-title">⚙️ Pemeliharaan Sistem (Maintenance)</h2>
        <p className="text-muted">Menu ini dirancang khusus untuk menjaga kapasitas database. Anda dapat mengatur jarak waktu backup sesuai keinginan.</p>

        <div style={{ marginTop: '20px', marginBottom: '15px' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Pilih Jarak Waktu (Buffer) Backup:</label>
          <select 
            value={buffer} 
            onChange={(e) => setBuffer(Number(e.target.value))}
            style={{ padding: '10px 15px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'inherit', border: '1px solid rgba(255,255,255,0.2)', width: '100%', maxWidth: '300px' }}
          >
            <option value={1} style={{ color: '#000' }}>1 Bulan Terakhir (Sangat Rutin)</option>
            <option value={3} style={{ color: '#000' }}>3 Bulan Terakhir (Per Kuartal)</option>
            <option value={6} style={{ color: '#000' }}>6 Bulan Terakhir (Batas Maksimal)</option>
          </select>
        </div>

        <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ color: '#eab308', margin: '0 0 10px 0' }}>Status Data Usang ({buffer} Bulan)</h3>
          <p style={{ margin: '0 0 15px 0' }}>Target Bersih: <b>Semua data sebelum {targetLabel}</b></p>

          {hasOldData ? (
            <div>
              <div style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '15px' }}>
                🚨 Peringatan: Terdapat {oldTrans.length} Transaksi dan {oldPerk.length} Laporan Perkembangan usang!
              </div>
              <button onClick={() => onTriggerArchive(buffer)} className="btn btn-primary" style={{ background: '#eab308', borderColor: '#eab308', color: '#000', padding: '12px' }}>
                📦 Backup & Bersihkan Data Lama Sekarang
              </button>
            </div>
          ) : (
            <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '15px' }}>
              ✅ Database Aman. Tidak ada data usang di periode {buffer} bulan ini.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
