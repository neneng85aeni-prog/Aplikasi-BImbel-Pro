import { useState } from 'react'
import html2canvas from 'html2canvas'

export function JadwalGuruTab({ users, jadwalGuru, onSubmitJadwal, onDeleteJadwal }) {
  const [form, setForm] = useState({ user_id: '', hari: 'Senin', jam_mulai: '15:00', jam_selesai: '17:00' })
  const [searchQuery, setSearchQuery] = useState('')

  const daftarHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
  const daftarGuru = users.filter(u => u.akses === 'guru' || u.akses === 'GURU')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.user_id) return alert('Pilih gurunya dulu, Mas!')
    onSubmitJadwal(form)
    setForm({ ...form, user_id: '' }) // Reset pilih guru setelah simpan
  }

  // Filter tampilan jadwal
  const filteredJadwal = (jadwalGuru || []).filter(j => 
    j.users?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.hari.toLowerCase().includes(searchQuery.toLowerCase())
  )
const handleDownloadImage = () => {
    const element = document.getElementById('poster-jadwal-guru');
    const originalMaxHeight = element.style.maxHeight;
    const originalOverflow = element.style.overflowY;

    // Buka scroll agar tabel tidak terpotong saat difoto
    element.style.maxHeight = 'none';
    element.style.overflowY = 'visible';

    // Sembunyikan kolom "Aksi" (Tombol Hapus)
    const aksiCells = element.querySelectorAll('.kolom-aksi');
    aksiCells.forEach(cell => cell.style.display = 'none');

    html2canvas(element, { scale: 2, backgroundColor: null }).then(canvas => {
      const link = document.createElement('a');
      link.download = `Jadwal_Guru_Bimbel.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      // Kembalikan seperti semula
      element.style.maxHeight = originalMaxHeight;
      element.style.overflowY = originalOverflow;
      aksiCells.forEach(cell => cell.style.display = '');
    });
  };
  
  return (
    <div className="grid grid-2 gap-lg">
      {/* FORM INPUT JADWAL */}
      <div className="glass-card">
        <h2 className="section-title">Tambah Jadwal Piket Guru</h2>
        <p className="text-muted" style={{fontSize: '13px', marginBottom: '20px'}}>Atur jam standby guru supaya pendaftaran siswa lebih akurat.</p>
        
        <form onSubmit={handleSubmit} className="grid gap-md">
          <div className="form-row">
            <label>Pilih Guru</label>
            <select value={form.user_id} onChange={e => setForm({...form, user_id: e.target.value})} required>
              <option value="">-- Pilih Guru --</option>
              {daftarGuru.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
            </select>
          </div>

          <div className="grid grid-3 gap-md">
            <div className="form-row">
              <label>Hari</label>
              <select value={form.hari} onChange={e => setForm({...form, hari: e.target.value})}>
                {daftarHari.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>Jam Mulai</label>
              <input type="time" value={form.jam_mulai} onChange={e => setForm({...form, jam_mulai: e.target.value})} required />
            </div>
            <div className="form-row">
              <label>Jam Selesai</label>
              <input type="time" value={form.jam_selesai} onChange={e => setForm({...form, jam_selesai: e.target.value})} required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{marginTop: '10px', padding: '12px'}}>💾 Simpan Jadwal</button>
        </form>
      </div>

      {/* DAFTAR JADWAL TERINPUT */}
      <div className="glass-card">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px'}}>
          <h2 className="section-title" style={{margin:0}}>List Jadwal Aktif</h2>
          <div style={{display: 'flex', gap: '10px'}}>
            <input 
              type="text" placeholder="🔍 Cari guru/hari..." 
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '13px'}}
            />
            <button type="button" className="btn btn-primary btn-small" onClick={handleDownloadImage} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              📸 Export
            </button>
          </div>
        </div>

        <div id="poster-jadwal-guru" className="table-wrap" style={{maxHeight: '400px', overflowY: 'auto', padding: '10px', background: 'var(--panel)', borderRadius: '12px'}}>          <table>
            <thead>
              <tr>
                <th>Guru</th>
                <th>Hari</th>
                <th>Jam</th>
                <th className="kolom-aksi">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredJadwal.map(j => (
                <tr key={j.id}>
                  <td><b>{j.users?.nama}</b></td>
                  <td>{j.hari}</td>
                  <td><span className="badge-info">{j.jam_mulai.slice(0,5)} - {j.jam_selesai.slice(0,5)}</span></td>
                  <td className="kolom-aksi">
                    <button className="btn btn-danger btn-small" onClick={() => onDeleteJadwal(j.id)}>Hapus</button>
                  </td>
                </tr>
              ))}
              {filteredJadwal.length === 0 && (
                <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px'}} className="text-muted">Belum ada jadwal.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
