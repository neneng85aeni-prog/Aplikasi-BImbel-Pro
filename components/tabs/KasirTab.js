import { useState } from 'react'
import { formatRupiah } from '../../lib/format'

export function KasirTab({
  branches, selectedBranchId, setSelectedBranchId, siswaOptions, selectedStudent,
  kasirForm, setKasirForm, studentScanInfo, scanStudentActive, setScanStudentActive,
  studentScanText, onSelectStudent, onSubmitKasir, inventoryTampil,
  showReceiptPopup, setShowReceiptPopup, lastReceipt,
  onPrintReceiptDesktop, onPrintReceiptAndroid, onSendReceiptWA
}) {
  const [manualType, setManualType] = useState('barang')
  const [manualItem, setManualItem] = useState({ inventory_id: '', nama: '', harga: '', qty: 1 })
  
  // === STATE BARU: MODE PENCARIAN SISWA ===
  const [searchMode, setSearchMode] = useState('scan'); 
  // === STATE BARU: Pancingan Keyboard HP ===
  const [siswaSearchTerm, setSiswaSearchTerm] = useState(''); 

  // --- LOGIKA FILTER SISWA MANUAL ---
  const filteredSiswaOptions = (siswaOptions || []).filter(s => 
    s.nama?.toLowerCase().includes(siswaSearchTerm.toLowerCase()) || 
    (s.branches?.nama || '').toLowerCase().includes(siswaSearchTerm.toLowerCase())
  );

  // --- LOGIKA PERHITUNGAN OTOMATIS POS ---
  const cart = kasirForm.cart || []
  const subtotal = cart.reduce((sum, item) => sum + (item.harga * item.qty), 0)
  
  let nilaiDiskon = 0
  if (kasirForm.diskon_tipe === 'persen') {
    nilaiDiskon = subtotal * ((Number(kasirForm.diskon) || 0) / 100)
  } else {
    nilaiDiskon = Number(kasirForm.diskon) || 0
  }
  
  const totalTagihan = Math.max(0, subtotal - nilaiDiskon)
  const nominalBayar = Number(kasirForm.nominal_bayar) || 0
  const kembalian = nominalBayar > 0 ? nominalBayar - totalTagihan : 0

  // --- FUNGSI KERANJANG & BATALKAN ---
  const addToCart = (item) => setKasirForm({ ...kasirForm, cart: [...cart, item] })
  const removeFromCart = (index) => setKasirForm({ ...kasirForm, cart: cart.filter((_, i) => i !== index) })
  
  const handleCancel = () => {
    onSelectStudent('') // Lepas siswa terpilih
    setKasirForm({ status: 'lunas', nominal: '', diskon: '', diskon_tipe: 'nominal', nominal_bayar: '', keterangan: '', metode_bayar: 'cash', program_id: '', jenis_transaksi: 'program', inventory_id: '', cart: [] })
  }

  const handleAddManual = () => {
    if (manualType === 'barang') {
      const inv = inventoryTampil.find(i => i.id === manualItem.inventory_id)
      if (!inv) return alert('Pilih barang dari gudang.')
      if (inv.stok < manualItem.qty) return alert(`Stok tidak cukup! Sisa: ${inv.stok}`)
      addToCart({ type: 'barang', inventory_id: inv.id, nama: inv.nama, harga: inv.harga, qty: manualItem.qty })
    } else {
      if (!manualItem.nama || !manualItem.harga) return alert('Nama dan Harga Jasa harus diisi.')
      addToCart({ type: 'jasa', nama: manualItem.nama, harga: Number(manualItem.harga), qty: manualItem.qty })
    }
    setManualItem({ inventory_id: '', nama: '', harga: '', qty: 1 })
  }

  return (
    <div className="grid gap-lg" style={{ gridTemplateColumns: '1.2fr 1fr', alignItems: 'start' }}>
      
      {/* KIRI: AREA INPUT & PEMILIHAN */}
      <div className="grid gap-lg">
        <div className="glass-card">
          <div className="btn-row" style={{ justifyContent: 'space-between', marginBottom: '15px' }}>
            <h2 className="section-title" style={{ margin: 0 }}>1. Pilih Siswa</h2>
            
            {/* OPSI SCAN ATAU MANUAL */}
            <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '12px' }}>
                <input type="radio" checked={searchMode === 'scan'} onChange={() => setSearchMode('scan')} /> Scan
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '12px' }}>
                <input type="radio" checked={searchMode === 'manual'} onChange={() => setSearchMode('manual')} /> Manual
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px' }}>
              <option value="">Semua Cabang (Filter Pencarian)</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.nama}</option>)}
            </select>
          </div>

          {/* TAMPILAN BERDASARKAN MODE PILIHAN */}
          {/* TAMPILAN BERDASARKAN MODE PILIHAN */}
          {searchMode === 'scan' ? (
            <div>
              <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '15px', padding: '12px' }} onClick={() => setScanStudentActive(!scanStudentActive)}>
                📷 {scanStudentActive ? 'Tutup Scanner' : 'Buka Scanner Barcode Siswa'}
              </button>
              {scanStudentActive && <div id="reader-siswa" style={{ width: '100%', maxWidth: '400px', margin: '0 auto 15px', borderRadius: '12px', overflow: 'hidden' }}></div>}
              {studentScanInfo && <div style={{ textAlign: 'center', fontSize: '13px', color: '#3b82f6', marginBottom: '10px' }}>{studentScanInfo}</div>}
            </div>
          ) : (
            <div className="form-row" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* === INI KOTAK BARU UNTUK MEMUNCULKAN KEYBOARD HP === */}
              <input 
                type="text" 
                placeholder="🔍 Ketik nama siswa di sini..." 
                value={siswaSearchTerm} 
                onChange={(e) => setSiswaSearchTerm(e.target.value)}
                style={{ 
                  padding: '12px', fontSize: '14px', borderRadius: '8px', 
                  border: '1px solid rgba(255,255,255,0.3)', 
                  background: 'rgba(255,255,255,0.05)', color: '#fff', width: '100%' 
                }}
              />
              
              {/* Dropdown ini otomatis memendek sesuai ketikan di atas */}
              <select value={selectedStudent?.id || ''} onChange={(e) => onSelectStudent(e.target.value)} style={{ padding: '12px', fontSize: '15px', width: '100%' }}>
                <option value="">-- Pilih dari Hasil ({filteredSiswaOptions.length} Siswa) --</option>
                {filteredSiswaOptions.map(s => <option key={s.id} value={s.id}>{s.nama} ({s.branches?.nama || 'Pusat'})</option>)}
              </select>
            </div>
          )}

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Status Siswa Terpilih:</span>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: selectedStudent ? '#3b82f6' : '#94a3b8', marginTop: '5px' }}>
              {selectedStudent ? `Siswa: ${selectedStudent.nama}` : 'Belum ada siswa terpilih.'}
            </div>
          </div>
        </div>

        <div className="glass-card">
          <h2 className="section-title">2. Tambah Item ke Keranjang</h2>
          
          {selectedStudent && selectedStudent.nominal > 0 && (
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginBottom: '20px', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px dashed #3b82f6' }}
              onClick={() => addToCart({ type: 'spp', nama: `SPP Bulanan (${selectedStudent.programNama || 'Bimbel'})`, harga: selectedStudent.nominal, qty: 1 })}
            >
              + Masukkan Tagihan SPP ({formatRupiah(selectedStudent.nominal)})
            </button>
          )}

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}><input type="radio" checked={manualType === 'barang'} onChange={() => setManualType('barang')} /> Barang Gudang</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}><input type="radio" checked={manualType === 'jasa'} onChange={() => setManualType('jasa')} /> Jasa / Lainnya</label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {manualType === 'barang' ? (
                <select style={{ flex: 1 }} value={manualItem.inventory_id} onChange={(e) => setManualItem({ ...manualItem, inventory_id: e.target.value })}>
                  <option value="">Pilih Barang...</option>
                  {inventoryTampil.map(i => <option key={i.id} value={i.id}>{i.nama} (Sisa: {i.stok} | {formatRupiah(i.harga)})</option>)}
                </select>
              ) : (
                <>
                  <input style={{ flex: 1 }} placeholder="Nama Item" value={manualItem.nama} onChange={(e) => setManualItem({ ...manualItem, nama: e.target.value })} />
                  <input style={{ flex: 1 }} type="number" placeholder="Harga" value={manualItem.harga} onChange={(e) => setManualItem({ ...manualItem, harga: e.target.value })} />
                </>
              )}
              <input type="number" style={{ width: '70px' }} value={manualItem.qty} onChange={(e) => setManualItem({ ...manualItem, qty: Number(e.target.value) || 1 })} min="1" />
              <button className="btn btn-secondary" onClick={handleAddManual}>Tambah</button>
            </div>
          </div>
        </div>
      </div>

      {/* KANAN: AREA PEMBAYARAN & STRUK */}
      <div className="glass-card" style={{ position: 'sticky', top: '20px' }}>
        <h2 className="section-title">3. Rincian Pembayaran</h2>
        
        <div style={{ minHeight: '150px', marginBottom: '20px', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '15px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', paddingTop: '40px' }}>Keranjang masih kosong</div>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '14px' }}>
                <div style={{ flex: 1 }}>
                  <b>{item.nama}</b>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>{item.qty} x {formatRupiah(item.harga)}</div>
                </div>
                <b style={{ marginRight: '15px' }}>{formatRupiah(item.harga * item.qty)}</b>
                <button style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer' }} onClick={() => removeFromCart(idx)}>×</button>
              </div>
            ))
          )}
        </div>

        <div className="grid gap-sm" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
            <span>Subtotal</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <span>Diskon / Potongan</span>
            <div style={{ display: 'flex', gap: '5px', width: '150px' }}>
              <input type="number" value={kasirForm.diskon} onChange={(e) => setKasirForm({ ...kasirForm, diskon: e.target.value })} style={{ width: '60%', padding: '6px' }} placeholder="0" />
              <select value={kasirForm.diskon_tipe} onChange={(e) => setKasirForm({ ...kasirForm, diskon_tipe: e.target.value })} style={{ width: '40%', padding: '0 5px' }}>
                <option value="nominal" style={{ color: '#000' }}>Rp</option>
                <option value="persen" style={{ color: '#000' }}>%</option>
              </select>
            </div>
          </div>
          {nilaiDiskon > 0 && <div style={{ textAlign: 'right', color: '#ef4444', fontSize: '13px' }}>- {formatRupiah(nilaiDiskon)}</div>}
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <b style={{ fontSize: '16px' }}>TOTAL TAGIHAN</b>
          <b style={{ fontSize: '24px', color: '#10b981' }}>{formatRupiah(totalTagihan)}</b>
        </div>

        <div className="grid grid-2" style={{ gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8' }}>Nominal Dibayar (Tunai)</label>
            <input type="number" value={kasirForm.nominal_bayar} onChange={(e) => setKasirForm({ ...kasirForm, nominal_bayar: e.target.value })} placeholder="Cth: 100000" style={{ fontSize: '16px', fontWeight: 'bold', padding: '12px' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8' }}>Kembalian</label>
            <div style={{ background: kembalian < 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: `1px solid ${kembalian < 0 ? '#ef4444' : '#10b981'}`, padding: '12px', borderRadius: '8px', color: kembalian < 0 ? '#ef4444' : '#10b981', fontWeight: 'bold', fontSize: '16px', textAlign: 'right' }}>
              {kembalian < 0 ? 'Kurang Bayar!' : formatRupiah(kembalian)}
            </div>
          </div>
        </div>

        <div className="grid grid-2" style={{ gap: '10px', marginBottom: '20px' }}>
          <select 
            value={kasirForm.metode_bayar} 
            onChange={(e) => setKasirForm({ ...kasirForm, metode_bayar: e.target.value })} 
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '15px',
              padding: '12px'
            }}
          >
            <option value="cash" style={{ color: '#000000' }}>Uang Tunai (Cash)</option>
            <option value="qris" style={{ color: '#000000' }}>Transfer / QRIS</option>
          </select>
          <input type="text" placeholder="Catatan Opsional" value={kasirForm.keterangan} onChange={(e) => setKasirForm({ ...kasirForm, keterangan: e.target.value })} />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handleCancel} style={{ padding: '15px', width: '30%' }}>Batalkan</button>
          <button className="btn btn-primary" onClick={onSubmitKasir} disabled={!selectedStudent || cart.length === 0} style={{ padding: '15px', flex: 1, fontSize: '16px' }}>
            💳 Proses Pembayaran
          </button>
        </div>
      </div>

      {/* POPUP CETAK STRUK */}
      {showReceiptPopup && lastReceipt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '400px', padding: '30px', textAlign: 'center' }}>
            <div style={{ fontSize: '50px', marginBottom: '10px' }}>✅</div>
            <h2 style={{ margin: '0 0 5px 0' }}>Transaksi Berhasil!</h2>
            <p className="text-muted" style={{ marginBottom: '20px' }}>Kembalian: <b style={{ color: '#10b981' }}>{formatRupiah(lastReceipt.kembalian || 0)}</b></p>
            <div className="btn-row column">
              <button className="btn btn-primary" onClick={() => onPrintReceiptDesktop()}>🖨️ Cetak Struk (Desktop/Kasir)</button>
              <button className="btn btn-primary" onClick={() => onPrintReceiptAndroid()} style={{ background: '#3b82f6', borderColor: '#3b82f6' }}>📱 Cetak Struk (Printer Android)</button>
              <button className="btn btn-primary" onClick={() => onSendReceiptWA()} style={{ background: '#10b981', borderColor: '#10b981' }}>💬 Kirim Struk via WA</button>
              <button className="btn btn-secondary" onClick={() => setShowReceiptPopup(false)}>Tutup Saja</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
