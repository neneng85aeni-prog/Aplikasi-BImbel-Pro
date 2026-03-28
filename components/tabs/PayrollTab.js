import { useState } from 'react'
import { formatRupiah, formatTanggal, formatMonthYear } from '../../lib/format'

export function PayrollTab({ 
  payrollRows, bonusForm, setBonusForm, users, bonusManual, onSubmitBonus, 
  onCatatGaji, branches, payrollMonth, setPayrollMonth, payrollYear, setPayrollYear, openSmartWA,
  actions // Tambahkan actions agar bisa memanggil setDeleteConfirm
}) {
  const [slipModal, setSlipModal] = useState(null)
  const [customItems, setCustomItems] = useState([])

  const BULAN_OPTIONS = [
    { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
    { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' }
  ]
  
  const TAHUN_OPTIONS = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i)

  function openModal(user) {
    setSlipModal(user)
    setCustomItems([])
  }

  function addCustomItem(type) {
    setCustomItems([...customItems, { name: '', amount: '', type }])
  }

  function updateCustomItem(index, field, value) {
    const newItems = [...customItems]
    newItems[index][field] = value
    setCustomItems(newItems)
  }

  function removeCustomItem(index) {
    setCustomItems(customItems.filter((_, i) => i !== index))
  }

  function handlePrintAndSave() {
    if (!slipModal) return
    const totalCustomTunjangan = customItems.filter(i => i.type === 'tunjangan').reduce((acc, i) => acc + Number(i.amount || 0), 0)
    const totalCustomPotongan = customItems.filter(i => i.type === 'potongan').reduce((acc, i) => acc + Number(i.amount || 0), 0)
    const totalBersih = slipModal.totalGaji + totalCustomTunjangan - totalCustomPotongan
    const periodeCetak = formatMonthYear(payrollMonth, payrollYear)
    const branchObj = branches?.find(b => b.id === slipModal.branch_id)
    const namaKopSurat = branchObj?.nama || 'BIMBEL PRO PUSAT'
    onCatatGaji(`Slip Gaji Karyawan: ${slipModal.nama} - Periode ${periodeCetak}`, totalBersih, slipModal.branch_id)
    const html = buildSlipGajiHtml(slipModal, customItems, totalBersih, periodeCetak, namaKopSurat, branchObj?.nama)
    const w = window.open('', '_blank', 'width=800,height=900')
    if (!w) { alert('Popup diblokir browser. Izinkan popup untuk mencetak slip.'); return }
    w.document.write(html)
    w.document.close()
    setSlipModal(null)
  }

  function handleSendWAAndSave() {
    if (!slipModal) return
    const totalCustomTunjangan = customItems.filter(i => i.type === 'tunjangan').reduce((acc, i) => acc + Number(i.amount || 0), 0)
    const totalCustomPotongan = customItems.filter(i => i.type === 'potongan').reduce((acc, i) => acc + Number(i.amount || 0), 0)
    const totalBersih = slipModal.totalGaji + totalCustomTunjangan - totalCustomPotongan
    const periodeCetak = formatMonthYear(payrollMonth, payrollYear)
    const branchObj = branches?.find(b => b.id === slipModal.branch_id)
    const namaKopSurat = branchObj?.nama || 'BIMBEL PRO PUSAT'
    onCatatGaji(`Slip Gaji Karyawan: ${slipModal.nama} - Periode ${periodeCetak} (Via WA)`, totalBersih, slipModal.branch_id)
    let text = `*SLIP GAJI - ${namaKopSurat}*\n\n`;
    text += `Nama Pegawai: ${slipModal.nama}\n`;
    text += `Posisi: ${slipModal.akses}\n`;
    text += `Periode: ${periodeCetak}\n\n`;
    text += `*PENDAPATAN:*\n`;
    if (slipModal.gajiPokok) text += `- Gaji Pokok: ${formatRupiah(slipModal.gajiPokok)}\n`;
    if (slipModal.feeSiswa) text += `- Honor Mengajar: ${formatRupiah(slipModal.feeSiswa)}\n`;
    if (slipModal.tunjanganTetap) text += `- Tunjangan Tetap: ${formatRupiah(slipModal.tunjanganTetap)}\n`;
    if (slipModal.tunjanganHadir) text += `- Tunjangan Hadir: ${formatRupiah(slipModal.tunjanganHadir)}\n`;
    if (slipModal.bonusOtomatis) text += `- Bonus Target: ${formatRupiah(slipModal.bonusOtomatis)}\n`;
    if (slipModal.bonusManual) text += `- Bonus Tambahan: ${formatRupiah(slipModal.bonusManual)}\n`;
    customItems.filter(i => i.type === 'tunjangan').forEach(i => { text += `- ${i.name || 'Tunjangan Lain'}: ${formatRupiah(i.amount)}\n`; });
    let hasPotongan = false;
    let potText = `\n*POTONGAN:*\n`;
    if (slipModal.potongan) { potText += `- Potongan Absen: ${formatRupiah(slipModal.potongan)}\n`; hasPotongan = true; }
    customItems.filter(i => i.type === 'potongan').forEach(i => { potText += `- ${i.name || 'Potongan Lain'}: ${formatRupiah(i.amount)}\n`; hasPotongan = true; });
    if (hasPotongan) text += potText;
    text += `\n*TAKE HOME PAY: ${formatRupiah(totalBersih)}*\n\n`;
    text += `Terima kasih atas dedikasi dan kerja keras Anda.\n_Pesan otomatis dikirim dari Aplikasi Manajemen ${namaKopSurat}_`;
    if (openSmartWA) { openSmartWA(slipModal.no_telepon, text); }
    setSlipModal(null)
  }

  return (
    <div className="grid gap-lg">
      <div className="glass-card">
        <div className="btn-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Data Payroll Karyawan</h2>
          <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Periode Bulan</label>
              <select value={payrollMonth} onChange={(e) => setPayrollMonth(Number(e.target.value))} style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                {BULAN_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Tahun</label>
              <select value={payrollYear} onChange={(e) => setPayrollYear(Number(e.target.value))} style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                {TAHUN_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Nama Karyawan</th><th>Status Kehadiran</th><th>Pendapatan Sistem</th><th>Potongan Sistem</th><th>Total Sistem</th><th>Aksi Cetak</th></tr>
            </thead>
            <tbody>
              {payrollRows.map((item) => (
                <tr key={item.id}>
                  <td><b>{item.nama}</b><div className="text-muted" style={{textTransform: 'capitalize'}}>{item.akses}</div></td>
                  <td>Hadir: <b>{item.hadir}</b><br/><span className="text-muted">Izin/Sakit: {item.sakit + item.izin} | Alpha: {item.alpha}</span></td>
                  <td>
                    Pokok: {formatRupiah(item.gajiPokok)}<br/>
                    Honor/Bonus: {formatRupiah(item.feeSiswa + item.bonusOtomatis + item.bonusManual)}<br/>
                    Tunjangan: {formatRupiah(item.tunjanganTetap + item.tunjanganHadir)}
                  </td>
                  <td>{formatRupiah(item.potongan)}</td>
                  <td><b style={{color: '#ffffff'}}>{formatRupiah(item.totalGaji)}</b></td>
                  <td><button className="btn btn-primary btn-small" onClick={() => openModal(item)}>Kirim / Cetak</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="glass-card">
          <h2 className="section-title">Input Bonus Manual</h2>
          <form onSubmit={onSubmitBonus}>
            <div className="form-row"><label>Karyawan</label><select value={bonusForm.user_id} onChange={(e) => setBonusForm({ ...bonusForm, user_id: e.target.value })} required><option value="">Pilih Karyawan</option>{users.map(u => <option key={u.id} value={u.id}>{u.nama}</option>)}</select></div>
            <div className="form-row"><label>Tanggal</label><input type="date" value={bonusForm.bonus_date} onChange={(e) => setBonusForm({ ...bonusForm, bonus_date: e.target.value })} required /></div>
            <div className="form-row"><label>Nominal</label><input type="number" value={bonusForm.amount} onChange={(e) => setBonusForm({ ...bonusForm, amount: e.target.value })} required /></div>
            <div className="form-row"><label>Keterangan</label><input type="text" value={bonusForm.description} onChange={(e) => setBonusForm({ ...bonusForm, description: e.target.value })} placeholder="Cth: Lembur acara baksos" required /></div>
            <button className="btn btn-primary" type="submit">Simpan Bonus</button>
          </form>
        </div>
        <div className="glass-card">
          <h2 className="section-title">Riwayat Bonus Sesuai Periode</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Tanggal</th><th>Karyawan</th><th>Nominal</th><th>Aksi</th></tr></thead>
              <tbody>
                {bonusManual.map(b => (
                  <tr key={b.id}>
                    <td>{formatTanggal(b.bonus_date)}</td>
                    <td><b>{b.user_nama}</b><div className="text-muted">{b.description}</div></td>
                    <td>{formatRupiah(b.amount)}</td>
                    <td>
                      {/* TOMBOL HAPUS BARU */}
                      <button 
                        className="btn btn-danger btn-small" 
                        onClick={() => actions.setDeleteConfirm({ 
                          show: true, 
                          table: 'bonusManual', 
                          id: b.id, 
                          label: `Bonus ${b.user_nama} (${formatRupiah(b.amount)})` 
                        })}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* POPUP SLIP GAJI */}
      {slipModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <h2 className="section-title">Setup Slip Gaji: {slipModal.nama}</h2>
            <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.05)', padding: '15px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>Total Hitungan Sistem (Auto)</span><b style={{fontSize: '18px'}}>{formatRupiah(slipModal.totalGaji)}</b></div>
              <div className="text-muted" style={{ fontSize: '12px', lineHeight: '1.5' }}>*Gaji pokok, bonus, dan potongan absen periode {formatMonthYear(payrollMonth, payrollYear)} sudah dihitung oleh sistem. Tambahkan tunjangan/potongan insidental di bawah ini jika diperlukan.</div>
            </div>
            <h3 style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 'bold' }}>Tunjangan / Potongan Manual (Opsional)</h3>
            {customItems.map((item, idx) => (
              <div key={idx} className="grid grid-3" style={{ gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                <input placeholder="Nama (Cth: Lembur)" value={item.name} onChange={(e) => updateCustomItem(idx, 'name', e.target.value)} style={{padding: '8px'}} />
                <input type="number" placeholder="Nominal (Cth: 50000)" value={item.amount} onChange={(e) => updateCustomItem(idx, 'amount', e.target.value)} style={{padding: '8px'}} />
                <div style={{ display: 'flex', gap: '5px' }}>
                  <select value={item.type} onChange={(e) => updateCustomItem(idx, 'type', e.target.value)} style={{ flex: 1, padding: '8px' }}>
                    <option value="tunjangan">Tunjangan (+)</option>
                    <option value="potongan">Potongan (-)</option>
                  </select>
                  <button type="button" className="btn btn-danger btn-small" onClick={() => removeCustomItem(idx)}>X</button>
                </div>
              </div>
            ))}
            <div className="btn-row" style={{ marginBottom: '30px', marginTop: '10px' }}>
              <button type="button" className="btn btn-secondary btn-small" onClick={() => addCustomItem('tunjangan')}>+ Tambah Tunjangan</button>
              <button type="button" className="btn btn-secondary btn-small" onClick={() => addCustomItem('potongan')}>+ Tambah Potongan</button>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <div style={{fontSize: '12px', color: '#94a3b8', marginBottom: '4px'}}>TAKE HOME PAY</div>
                <b style={{fontSize: '15px'}}>Total Bersih</b>
              </div>
              <b style={{ fontSize: '24px', color: '#10b981' }}>{formatRupiah(slipModal.totalGaji + customItems.filter(i=>i.type==='tunjangan').reduce((a,b)=>a+Number(b.amount||0),0) - customItems.filter(i=>i.type==='potongan').reduce((a,b)=>a+Number(b.amount||0),0))}</b>
            </div>
            <div className="btn-row">
              <button className="btn btn-primary" onClick={handlePrintAndSave} style={{ flex: 1, padding: '14px', fontSize: '15px' }}>🖨️ Cetak PDF</button>
              <button className="btn btn-primary" onClick={handleSendWAAndSave} style={{ flex: 1, padding: '14px', fontSize: '15px', background: '#10b981', borderColor: '#10b981' }}>💬 Kirim WA</button>
              <button className="btn btn-secondary" onClick={() => setSlipModal(null)} style={{ padding: '14px', fontSize: '15px' }}>Batal</button>
            </div>
            <div className="text-muted" style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px' }}>*Mencetak atau mengirim WA akan otomatis mencatat pengeluaran di sistem.</div>
          </div>
        </div>
      )}
    </div>
  )
}

function buildSlipGajiHtml(user, customItems, totalBersih, periode, namaKopSurat, rawBranchName) {
  return `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Slip Gaji - ${user.nama}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; background: #fff; }
        .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #1e293b; padding-bottom: 15px; margin-bottom: 30px; }
        .logo { font-size: 32px; font-weight: 800; color: #1e293b; letter-spacing: -1px; text-transform: uppercase; }
        .title { font-size: 20px; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 2px;}
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .info-col div { margin-bottom: 10px; font-size: 15px; }
        .label { display: inline-block; width: 130px; font-weight: 600; color: #64748b; }
        .val { font-weight: bold; color: #0f172a;}
        .table-container { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 12px 10px; background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-size: 15px; color: #334155; text-transform: uppercase; }
        td { padding: 12px 10px; border-bottom: 1px dashed #e2e8f0; font-size: 15px; }
        .amount { text-align: right; font-family: monospace; font-size: 16px; font-weight: bold; }
        .total-box { background: #1e293b; color: #fff; padding: 20px 30px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 50px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .total-title { font-size: 18px; font-weight: bold; letter-spacing: 1px;}
        .total-amount { font-size: 28px; font-weight: bold; color: #10b981; }
        .footer { display: grid; grid-template-columns: 1fr 1fr; text-align: center; margin-top: 50px; font-size: 15px; }
        .sign-area { margin-top: 90px; font-weight: bold; text-decoration: underline; text-transform: uppercase; }
      </style>
    </head>
    <body onload="window.print()">
      <div class="header">
        <div class="logo">${namaKopSurat}</div>
        <div class="title">Slip Gaji Karyawan</div>
      </div>
      <div class="info-grid">
        <div class="info-col">
          <div><span class="label">Nama Pegawai:</span> <span class="val">${user.nama}</span></div>
          <div><span class="label">Posisi / Akses:</span> <span class="val" style="text-transform: capitalize;">${user.akses}</span></div>
        </div>
        <div class="info-col">
          <div><span class="label">Periode Gaji:</span> <span class="val">${periode}</span></div>
          <div><span class="label">Penempatan:</span> <span class="val">${rawBranchName || 'Pusat'}</span></div>
        </div>
      </div>
      <div class="table-container">
        <div>
          <table>
            <thead><tr><th>Pendapatan</th><th class="amount">Nominal</th></tr></thead>
            <tbody>
              ${user.gajiPokok ? `<tr><td>Gaji Pokok</td><td class="amount">${formatRupiah(user.gajiPokok)}</td></tr>` : ''}
              ${user.feeSiswa ? `<tr><td>Honor Mengajar</td><td class="amount">${formatRupiah(user.feeSiswa)}</td></tr>` : ''}
              ${user.tunjanganTetap ? `<tr><td>Tunjangan Tetap</td><td class="amount">${formatRupiah(user.tunjanganTetap)}</td></tr>` : ''}
              ${user.tunjanganHadir ? `<tr><td>Tunjangan Hadir</td><td class="amount">${formatRupiah(user.tunjanganHadir)}</td></tr>` : ''}
              ${user.bonusOtomatis ? `<tr><td>Bonus Target</td><td class="amount">${formatRupiah(user.bonusOtomatis)}</td></tr>` : ''}
              ${user.bonusManual ? `<tr><td>Bonus Tambahan</td><td class="amount">${formatRupiah(user.bonusManual)}</td></tr>` : ''}
              ${customItems.filter(i => i.type === 'tunjangan').map(i => `<tr><td>${i.name || 'Tunjangan Lain'}</td><td class="amount">${formatRupiah(i.amount)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div>
          <table>
            <thead><tr><th>Potongan</th><th class="amount">Nominal</th></tr></thead>
            <tbody>
              ${user.potongan ? `<tr><td>Potongan Absen/Izin</td><td class="amount" style="color:#ef4444">${formatRupiah(user.potongan)}</td></tr>` : ''}
              ${customItems.filter(i => i.type === 'potongan').map(i => `<tr><td>${i.name || 'Potongan Lain'}</td><td class="amount" style="color:#ef4444">${formatRupiah(i.amount)}</td></tr>`).join('')}
              ${(!user.potongan && customItems.filter(i => i.type === 'potongan').length === 0) ? `<tr><td colspan="2" style="text-align: center; color: #94a3b8; padding-top: 20px;">Tidak ada potongan bulan ini. Good job!</td></tr>` : ''}
            </tbody>
          </table>
        </div>
      </div>
      <div class="total-box">
        <div class="total-title">TAKE HOME PAY</div>
        <div class="total-amount">${formatRupiah(totalBersih)}</div>
      </div>
      <div class="footer">
        <div>
          <p>Penerima,</p>
          <div class="sign-area">${user.nama}</div>
        </div>
        <div>
          <p>Disetujui Oleh,</p>
          <div class="sign-area">Manajemen ${namaKopSurat}</div>
        </div>
      </div>
    </body>
    </html>
  `
}
