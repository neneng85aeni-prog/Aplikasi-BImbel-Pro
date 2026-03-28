import { useState } from 'react'
import { formatRupiah } from '../../lib/format'
import { PAYMENT_METHOD_OPTIONS, PAYMENT_STATUS_OPTIONS } from '../../lib/constants'

export function KasirTab({ 
  branches, selectedBranchId, setSelectedBranchId, siswaOptions, selectedStudent, 
  kasirForm, setKasirForm, studentScanInfo, scanStudentActive, setScanStudentActive, 
  studentScanText, onSelectStudent, onSubmitKasir, onPrintReceiptDesktop, onPrintReceiptAndroid, 
  onSendReceiptWA, inventoryTampil, showReceiptPopup, setShowReceiptPopup, lastReceipt
}) {
  
  const [tempType, setTempType] = useState('barang')
  const [tempInvId, setTempInvId] = useState('')
  const [tempNama, setTempNama] = useState('')
  const [tempHarga, setTempHarga] = useState('')
  const [tempQty, setTempQty] = useState(1)

  const cart = kasirForm.cart || []
  const basePrice = cart.reduce((sum, item) => sum + (item.harga * item.qty), 0)
  const diskon = Number(kasirForm.diskon) || 0
  const totalBayar = Math.max(0, basePrice - diskon)

  function handleAddToCart() {
    let newItem = { id: Date.now(), type: tempType, qty: Number(tempQty) }
    if (tempType === 'barang') {
      const inv = inventoryTampil.find(i => i.id === tempInvId)
      if (!inv) return alert('Pilih barang terlebih dahulu!')
      if (inv.stok < tempQty) return alert(`Stok ${inv.nama} tidak mencukupi! (Sisa: ${inv.stok})`)
      newItem.nama = inv.nama
      newItem.harga = inv.harga
      newItem.inventory_id = inv.id
    } else {
      if (!tempNama || !tempHarga) return alert('Nama dan nominal program harus diisi!')
      newItem.nama = tempNama
      newItem.harga = Number(tempHarga)
    }
    setKasirForm({ ...kasirForm, cart: [...cart, newItem] })
    setTempInvId(''); setTempNama(''); setTempHarga(''); setTempQty(1);
  }

  function handleRemoveFromCart(id) {
    setKasirForm({ ...kasirForm, cart: cart.filter(item => item.id !== id) })
  }

  return (
    <div className="grid gap-lg">
      <div className="glass-card">
        <div className="btn-row" style={{ justifyContent: 'space-between' }}>
          <h2 className="section-title">Pencatatan Kasir (Multi-Item)</h2>
          <div className="form-row slim"><label>Cabang</label><select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}><option value="">Semua cabang</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select></div>
        </div>

        <div className="grid grid-2">
          {/* KIRI: SCAN SISWA */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 className="section-title" style={{ fontSize: '16px', marginBottom: '16px' }}>1. Pilih Siswa</h3>
            <div style={{ marginBottom: '16px' }}>
              {!scanStudentActive ? (
                <button type="button" className="btn btn-secondary" onClick={() => setScanStudentActive(true)} style={{ width: '100%', padding: '12px' }}>📷 Mulai Scan Barcode Siswa</button>
              ) : (
                <div className="scanner-container">
                  <div id="reader-siswa" style={{ width: '100%' }}></div>
                  <button type="button" className="btn btn-danger" onClick={() => setScanStudentActive(false)} style={{ width: '100%', marginTop: '10px' }}>Tutup Scanner</button>
                </div>
              )}
            </div>
            
            <div style={{ textAlign: 'center', margin: '15px 0', fontSize: '12px', fontWeight: 'bold' }} className="text-muted">ATAU CARI MANUAL</div>
            
            <div className="form-row">
              <select value={selectedStudent?.id || ''} onChange={(e) => onSelectStudent(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}>
                <option value="" style={{ color: '#000' }}>-- Ketik/Pilih Nama Siswa --</option>
                {siswaOptions.map((item) => <option key={item.id} value={item.id} style={{ color: '#000' }}>{item.nama} ({item.branches?.nama || 'Pusat'})</option>)}
              </select>
            </div>
            
            <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent' }}>
              <span className="text-muted" style={{ fontSize: '12px' }}>Status Siswa:</span><br/>
              <b style={{ fontSize: '15px', color: '#3b82f6' }}>{studentScanInfo}</b>
            </div>
          </div>

          {/* KANAN: KERANJANG & PEMBAYARAN */}
          <div>
            <div className="glass-card" style={{ padding: '20px', marginBottom: '20px', background: 'rgba(0,0,0,0.2)' }}>
              <h3 className="section-title" style={{ fontSize: '16px', marginBottom: '16px' }}>2. Keranjang Belanja</h3>
              
              {/* TOMBOL PINTAS TAMBAH SPP (HANYA MUNCUL JIKA SISWA DIPILIH) */}
              {selectedStudent && (
                <div style={{ marginBottom: '15px' }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (cart.find(c => c.type === 'spp')) return alert('SPP sudah ada di keranjang!');
                      setKasirForm({ ...kasirForm, cart: [...cart, { id: Date.now(), type: 'spp', nama: `SPP ${selectedStudent.programNama}`, harga: selectedStudent.nominal, qty: 1 }] })
                    }}
                    style={{ width: '100%', padding: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px dashed #3b82f6', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    + Masukkan SPP {selectedStudent.programNama} ({formatRupiah(selectedStudent.nominal)})
                  </button>
                </div>
              )}

              {cart.length > 0 ? (
                <table style={{ width: '100%', marginBottom: '15px', fontSize: '13px' }}>
                  <thead><tr><th style={{ textAlign: 'left' }}>Item</th><th>Qty</th><th>Harga</th><th>Sub</th><th></th></tr></thead>
                  <tbody>
                    {cart.map(c => (
                      <tr key={c.id}>
                        <td>{c.nama}</td>
                        <td style={{ textAlign: 'center' }}>x{c.qty}</td>
                        <td style={{ textAlign: 'right' }}>{formatRupiah(c.harga)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatRupiah(c.harga * c.qty)}</td>
                        <td style={{ textAlign: 'center' }}><button type="button" onClick={() => handleRemoveFromCart(c.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', marginBottom: '15px', color: '#94a3b8', fontSize: '13px' }}>Keranjang kosong. Tambahkan SPP atau barang di bawah.</div>
              )}

              {/* FORM TAMBAH ITEM */}
              <div style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '13px' }}><input type="radio" checked={tempType === 'barang'} onChange={() => setTempType('barang')} /> Barang Fisik</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '13px' }}><input type="radio" checked={tempType === 'program'} onChange={() => setTempType('program')} /> Jasa / Lainnya</label>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  {tempType === 'barang' ? (
                    <select value={tempInvId} onChange={(e) => setTempInvId(e.target.value)} style={{ flex: 2, padding: '8px', background: 'rgba(255,255,255,0.1)', color: 'inherit', border: '1px solid rgba(255,255,255,0.2)' }}>
                      <option value="" style={{ color: '#000' }}>Pilih Barang...</option>
                      {inventoryTampil.map((item) => <option key={item.id} value={item.id} disabled={item.stok < 1} style={{ color: '#000' }}>{item.nama} - {formatRupiah(item.harga)} {item.stok < 1 ? '(HABIS)' : `(${item.stok})`}</option>)}
                    </select>
                  ) : (
                    <div style={{ flex: 2, display: 'flex', gap: '5px' }}>
                      <input type="text" placeholder="Keterangan" value={tempNama} onChange={(e) => setTempNama(e.target.value)} style={{ width: '60%', padding: '8px' }} />
                      <input type="number" placeholder="Rp" value={tempHarga} onChange={(e) => setTempHarga(e.target.value)} style={{ width: '40%', padding: '8px' }} />
                    </div>
                  )}
                  <input type="number" value={tempQty} onChange={(e) => setTempQty(e.target.value)} min="1" style={{ width: '60px', padding: '8px', textAlign: 'center' }} title="Jumlah" />
                  <button type="button" onClick={handleAddToCart} className="btn btn-secondary btn-small" style={{ padding: '8px 12px' }}>+ Tambah</button>
                </div>
              </div>
            </div>

            {/* FORM PEMBAYARAN */}
            <form onSubmit={onSubmitKasir} className="glass-card" style={{ padding: '20px' }}>
              <h3 className="section-title" style={{ fontSize: '16px', marginBottom: '16px' }}>3. Pembayaran</h3>
              
              <div className="grid grid-2">
                <div className="form-row"><label>Diskon / Potongan (Rp)</label><input type="number" value={kasirForm.diskon} onChange={(e) => setKasirForm({ ...kasirForm, diskon: e.target.value })} placeholder="0" /></div>
                <div className="form-row"><label>Catatan Opsional</label><input type="text" value={kasirForm.keterangan} onChange={(e) => setKasirForm({ ...kasirForm, keterangan: e.target.value })} placeholder="Cth: Lunas via Transfer" /></div>
              </div>

              {/* KOTAK TOTAL */}
              <div style={{ padding: '15px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px' }}><span className="text-muted">Total Belanja:</span> <b>{formatRupiah(basePrice)}</b></div>
                {diskon > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#ef4444', fontSize: '13px' }}><span>Diskon:</span> <b>-{formatRupiah(diskon)}</b></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '18px' }}><span>Total Bayar:</span> <b style={{ color: '#10b981' }}>{formatRupiah(totalBayar)}</b></div>
              </div>

              <div className="grid grid-2">
                <div className="form-row"><label>Metode</label><select value={kasirForm.metode_bayar} onChange={(e) => setKasirForm({ ...kasirForm, metode_bayar: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', color: 'inherit' }}>{PAYMENT_METHOD_OPTIONS.map((opt) => <option key={opt} value={opt} style={{ color: '#000' }}>{opt.toUpperCase()}</option>)}</select></div>
                <div className="form-row"><label>Status</label><select value={kasirForm.status} onChange={(e) => setKasirForm({ ...kasirForm, status: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', color: 'inherit' }}>{PAYMENT_STATUS_OPTIONS.map((opt) => <option key={opt} value={opt} style={{ color: '#000' }}>{opt.replace('_', ' ').toUpperCase()}</option>)}</select></div>
              </div>

              <div className="btn-row" style={{ marginTop: '20px' }}>
                <button className="btn btn-primary" type="submit" disabled={!selectedStudent || cart.length === 0} style={{ flex: 1, padding: '14px', fontSize: '15px' }}>💳 Proses Transaksi</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* POPUP STRUK KASIR */}
      {showReceiptPopup && lastReceipt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '30px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>✅</div>
            <h2 style={{ margin: '0 0 5px 0', color: '#10b981' }}>Transaksi Berhasil!</h2>
            <p className="text-muted" style={{ marginBottom: '20px', fontSize: '13px' }}>Pembayaran atas nama <b>{lastReceipt.nama}</b> telah tersimpan.</p>
            
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '12px', textAlign: 'left', marginBottom: '25px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.05)' }}>
              {lastReceipt.cart?.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>{c.nama} <span className="text-muted">(x{c.qty})</span></span> <b>{formatRupiah(c.harga * c.qty)}</b></div>
              ))}
              <div style={{ borderTop: '1px dashed rgba(255,255,255,0.2)', margin: '8px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span className="text-muted">Subtotal:</span> <b>{formatRupiah(lastReceipt.subtotal)}</b></div>
              {lastReceipt.diskon > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#ef4444' }}><span>Diskon:</span> <b>-{formatRupiah(lastReceipt.diskon)}</b></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.1)' }}><span className="text-muted">Total Bayar:</span> <b style={{ color: '#10b981', fontSize: '16px' }}>{formatRupiah(lastReceipt.nominal)}</b></div>
            </div>

            <div className="btn-row column" style={{ gap: '10px' }}>
              <button type="button" className="btn btn-primary" onClick={() => onSendReceiptWA()} style={{ background: '#10b981', borderColor: '#10b981', padding: '12px' }}>💬 Kirim via WhatsApp</button>
              <div className="btn-row" style={{ width: '100%' }}>
                <button type="button" className="btn btn-secondary" onClick={() => onPrintReceiptDesktop()} style={{ flex: 1 }}>🖨️ Desktop</button>
                <button type="button" className="btn btn-secondary" onClick={() => onPrintReceiptAndroid()} style={{ flex: 1 }}>📱 Android</button>
              </div>
              <button type="button" className="btn btn-danger" onClick={() => setShowReceiptPopup(false)} style={{ marginTop: '10px', background: 'transparent', color: '#ef4444' }}>Tutup & Layani Siswa Lain</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
