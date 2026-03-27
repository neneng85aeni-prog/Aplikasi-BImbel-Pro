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

export function SiswaTab({ user, siswaForm, setSiswaForm, siswaTampil, programs, guruOptions, branches, onGenerateBarcode, onSubmit, onReset, onEdit, onDelete, onPrintBarcode, perkembanganForm, setPerkembanganForm, onSubmitPerkembangan, searchSiswa, setSearchSiswa }) {
  if (user?.akses === 'guru') {
    return (
      <div className="glass-card">
        <h2 className="section-title">Data siswa</h2>
        <p className="text-muted">Untuk guru, input kehadiran harian dan perkembangan siswa sekarang dipusatkan di menu <b>Perkembangan &amp; Absensi</b> agar cukup sekali scan atau pilih manual dalam sehari.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-2">
      <div className="glass-card">
        <h2 className="section-title">Pendaftaran siswa</h2>
        <form onSubmit={onSubmit}>
          <div className="grid grid-2">
            <div className="form-row"><label>Nama siswa</label><input value={siswaForm.nama} onChange={(e) => setSiswaForm({ ...siswaForm, nama: e.target.value })} /></div>
            <div className="form-row"><label>Cabang</label><select value={siswaForm.branch_id} onChange={(e) => setSiswaForm({ ...siswaForm, branch_id: e.target.value })}><option value="">Pilih cabang</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select></div>
          </div>
          <div className="grid grid-2">
            <div className="form-row"><label>Program</label><select value={siswaForm.program_id} onChange={(e) => setSiswaForm({ ...siswaForm, program_id: e.target.value })}><option value="">Pilih program</option>{programs.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select></div>
            <div className="form-row"><label>Guru default</label><select value={siswaForm.guru_id} onChange={(e) => setSiswaForm({ ...siswaForm, guru_id: e.target.value })}><option value="">Pilih guru</option>{guruOptions.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select></div>
          </div>
          <div className="grid grid-2">
            <div className="form-row"><label>Kelas</label><input value={siswaForm.kelas} onChange={(e) => setSiswaForm({ ...siswaForm, kelas: e.target.value })} /></div>
            <div className="form-row"><label>Nama orang tua</label><input value={siswaForm.nama_ortu} onChange={(e) => setSiswaForm({ ...siswaForm, nama_ortu: e.target.value })} /></div>
          </div>
          <div className="grid grid-2">
            <div className="form-row"><label>No HP</label><input value={siswaForm.no_hp} onChange={(e) => setSiswaForm({ ...siswaForm, no_hp: e.target.value })} /></div>
            <div className="form-row"><label>Alamat</label><input value={siswaForm.alamat} onChange={(e) => setSiswaForm({ ...siswaForm, alamat: e.target.value })} /></div>
          </div>
          <div className="form-row"><label>Barcode siswa otomatis</label><div className="btn-row"><input value={siswaForm.kode_qr} onChange={(e) => setSiswaForm({ ...siswaForm, kode_qr: e.target.value })} placeholder="Klik generate jika ingin otomatis" /><button className="btn btn-secondary" type="button" onClick={onGenerateBarcode}>Generate</button></div></div>
          {siswaForm.kode_qr ? <div className="btn-row"><BarcodePreview value={siswaForm.kode_qr} title="Preview barcode siswa" compact /><button className="btn btn-secondary" type="button" onClick={() => printBarcodeCard({ title: `Barcode ${siswaForm.nama || 'Siswa'}`, subtitle: siswaForm.kelas || '', value: siswaForm.kode_qr })}>Print Desktop</button><button className="btn btn-primary" type="button" onClick={() => openAndroidQrSharePage({ nama: siswaForm.nama || 'Siswa', kelas: siswaForm.kelas || '', kode_qr: siswaForm.kode_qr, branches: { nama: branches.find((item) => item.id === siswaForm.branch_id)?.nama || '-' } })}>Print Android</button></div> : null}
          <div className="btn-row"><button className="btn btn-primary" type="submit">{siswaForm.id ? 'Update siswa' : 'Simpan siswa'}</button><button className="btn btn-secondary" type="button" onClick={() => onReset(INITIAL_SISWA_FORM)}>Reset</button></div>
        </form>
      </div>
      <div className="glass-card">
        <h2 className="section-title">Daftar siswa</h2>
        
        {/* KOTAK PENCARIAN DITAMBAHKAN DI SINI */}
        <div style={{ marginBottom: '16px' }}>
          <input 
            type="text" 
            placeholder="🔍 Cari nama atau nomor HP siswa..." 
            value={searchSiswa || ''} 
            onChange={(e) => setSearchSiswa && setSearchSiswa(e.target.value)} 
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d7dfef', fontSize: '14px' }}
          />
        </div>

        <div className="table-wrap"><table><thead><tr><th>Nama</th><th>Cabang</th><th>Program</th><th>Alamat</th><th>Barcode</th><th>Aksi</th></tr></thead><tbody>{siswaTampil.map((item) => <tr key={item.id}><td><b>{item.nama}</b><div className="text-muted">{item.kelas || '-'} • Guru default: {item.users?.nama || '-'}</div></td><td>{item.branches?.nama || '-'}</td><td>{item.programs?.nama || '-'}</td><td>{item.alamat || '-'}</td><td><code>{item.kode_qr || '-'}</code></td><td><div className="btn-row" style={{ flexWrap: 'wrap' }}><button className="btn btn-secondary btn-small" type="button" onClick={() => onEdit(item)}>Edit</button><button className="btn btn-secondary btn-small" type="button" onClick={() => onPrintBarcode(item)}>Print Desktop</button><button className="btn btn-primary btn-small" type="button" onClick={() => openAndroidQrSharePage(item)}>Print Android</button><button className="btn btn-danger btn-small" type="button" onClick={() => onDelete(item.id)}>Hapus</button></div></td></tr>)}</tbody></table></div>
      </div>
    </div>
  )
}
