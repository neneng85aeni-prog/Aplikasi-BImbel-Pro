import { formatRupiah } from '../../lib/format'
import { PAYMENT_METHOD_OPTIONS, PAYMENT_STATUS_OPTIONS } from '../../lib/constants'

export function KasirTab({ 
  branches, selectedBranchId, setSelectedBranchId, siswaOptions, selectedStudent, 
  kasirForm, setKasirForm, studentScanInfo, scanStudentActive, setScanStudentActive, 
  studentScanText, onSelectStudent, onSubmitKasir, onPrintReceiptDesktop, onPrintReceiptAndroid, 
  onSendReceiptWA, programs, inventoryTampil, showReceiptPopup, setShowReceiptPopup, lastReceipt
}) {
  
  // Kalkulasi Real-Time untuk Diskon & Total Bayar
  const isBarang = kasirForm.jenis_transaksi === 'barang';
  const selectedItem = isBarang ? inventoryTampil.find(i => i.id === kasirForm.inventory_id) : null;
  const basePrice = isBarang ? (selectedItem?.harga || 0) : (Number(kasirForm.nominal) || 0);
  const diskon = Number(kasirForm.diskon) || 0;
  const totalBayar = Math.max(0, basePrice - diskon);

  return (
    <div className="grid gap-lg">
      <div className="glass-card">
        <div className="btn-row" style={{ justifyContent: 'space-between' }}>
          <h2 className="section-title">Pencatatan Kasir</h2>
          <div className="form-row slim"><label>Cabang</label><select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}><option value="">Semua cabang</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select></div>
        </div>

        <div className="grid grid-2">
          {/* KIRI: SCAN SISWA */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 className="section-title" style={{ fontSize: '16px', marginBottom: '16px' }}>1. Pilih / Scan Siswa</h3>
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
            {studentScanText && <div className="text-muted" style={{ fontSize: '13px', marginBottom: '10px' }}>Hasil Scan Terakhir: {studentScanText}</div>}
            
            <div style={{ textAlign: 'center', margin: '15px 0', fontSize: '12px', fontWeight: 'bold' }} className="text-muted">ATAU CARI MANUAL</div>
            
            <div className="form-row">
              <select value={selectedStudent?.id || ''} onChange={(e) => onSelectStudent(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'inherit' }}>
                <option value="" style={{ color: '#000' }}>-- Ketik/Pilih Nama Siswa --</option>
                {siswaOptions.map((item) => <option key={item.id} value={item.id} style={{ color: '#000' }}>{item.nama} ({item.branches?.nama || 'Pusat'})</option>)}
              </select>
            </div>
            
            <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent' }}>
              <span className="text-muted" style={{ fontSize: '12px' }}>Status Siswa:</span><br/>
              <b style={{ fontSize: '15px' }}>{studentScanInfo}</b>
            </div>
          </div>

          {/* KANAN: FORM TRANSAKSI */}
          <div>
            <form onSubmit={onSubmitKasir} className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
              <h3 className="section-title" style={{ fontSize: '16px', marginBottom: '16px' }}>2. Detail Transaksi</h3>
              
              <div className="form-row">
                <label>Jenis Transaksi</label>
                <div style={{ display: 'flex', gap: '20px', padding: '10px 0', background: 'transparent' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    <input type="radio" name="jenis" value="program" checked={kasirForm.jenis_transaksi === 'program' || !kasirForm.jenis_transaksi} onChange={(e) => setKasirForm({ ...kasirForm, jenis_transaksi: e.target.value })} /> Jasa Program (SPP)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    <input type="radio" name="jenis" value="barang" checked={kasirForm.jenis_transaksi === 'barang'} onChange={(e) => setKasirForm({ ...kasirForm, jenis_transaksi: e.target.value })} /> Beli Barang (Fisik)
                  </label>
                </div>
              </div>

              {kasirForm.jenis_transaksi === 'barang' ? (
                <div className="form-row">
                  <label>Pilih Barang (Stok & Harga otomatis)</label>
                  <select value={kasirForm.inventory_id || ''} onChange={(e) => setKasirForm({ ...kasirForm, inventory_id: e.target.value })} required style={{ background: 'rgba(255,255,255,0.05)', color: 'inherit' }}>
                    <option value="" style={{ color: '#000' }}>-- Pilih Barang --</option>
                    {inventoryTampil.map((item) => (
                      <option key={item.id} value={item.id} disabled={item.stok < 1} style={{ color: '#000' }}>
                        {item.nama} - {formatRupiah(item.harga)} {item.stok < 1 ? '(HABIS)' : `(Sisa: ${item.stok})`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="form-row"><label>Nominal Dasar Program (Rp)</label><input type="number" value={kasirForm.nominal} onChange={(e) => setKasirForm({ ...kasirForm, nominal: e.target.value })} placeholder={`Saran: ${selectedStudent?.nominal || '0'}`} required /></div>
                  <div className="form-row"><label>Keterangan Tambahan</label><input type="text" value={kasirForm.keterangan} onChange={(e) => setKasirForm({ ...kasirForm, keterangan: e.target.value })} placeholder="Cth: SPP Bulan Agustus" /></div>
                </>
              )}

              {/* INPUT DISKON */}
              <div className="form-row">
                <label>Diskon / Potongan Harga (Rp)</label>
                <input type="number" value={kasirForm.diskon} onChange={(e) => setKasirForm({ ...kasirForm, diskon: e.target.value })} placeholder="0 (Kosongkan jika tidak ada diskon)" />
              </div>

              {/* KOTAK KALKULASI TOTAL */}
              <div style={{ padding: '15px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px' }}>
                  <span className="text-muted">Subtotal:</span> <b>{formatRupiah(basePrice)}</b>
                </div>
                {diskon > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#ef4444', fontSize: '13px' }}>
                    <span>Diskon:</span> <b>-{formatRupiah(diskon)}</b>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '18px' }}>
                  <span>Total Bayar:</span> <b style={{ color: '#10b981' }}>{formatRupiah(totalBayar)}</b>
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-row"><label>Metode</label><select value={kasirForm.metode_bayar} onChange={(e) => setKasirForm({ ...kasirForm, metode_bayar: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', color: 'inherit' }}>{PAYMENT_METHOD_OPTIONS.map((opt) => <option key={opt} value={opt} style={{ color: '#000' }}>{opt.toUpperCase()}</option>)}</select></div>
                <div className="form-row"><label>Status</label><select value={kasirForm.status} onChange={(e) => setKasirForm({ ...kasirForm, status: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', color: 'inherit' }}>{PAYMENT_STATUS_OPTIONS.map((opt) => <option key={opt} value={opt} style={{ color: '#000' }}>{opt.replace('_', ' ').toUpperCase()}</option>)}</select></div>
              </div>

              <div className="btn-row" style={{ marginTop: '20px' }}>
                <button className="btn btn-primary" type="submit" disabled={!selectedStudent} style={{ flex: 1, padding: '14px', fontSize: '15px' }}>💳 Simpan Transaksi</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* POPUP STRUK KASIR */}
      {showReceiptPopup && lastReceipt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '30px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>✅</div>
            <h2 style={{ margin: '0 0 5px 0', color: '#10b981' }}>Transaksi Berhasil!</h2>
            <p className="text-muted" style={{ marginBottom: '20px' }}>Pembayaran atas nama <b>{lastReceipt.nama}</b> telah tersimpan di sistem.</p>
            
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '12px', textAlign: 'left', marginBottom: '25px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span className="text-muted">Item:</span> <b>{lastReceipt.programNama}</b></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><span className="text-muted">Subtotal:</span> <b>{formatRupiah(lastReceipt.subtotal)}</b></div>
              {lastReceipt.diskon > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#ef4444' }}><span>Diskon:</span> <b>-{formatRupiah(lastReceipt.diskon)}</b></div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', marginTop: '5px', paddingTop: '5px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}><span className="text-muted">Total Bayar:</span> <b style={{ color: '#10b981', fontSize: '15px' }}>{formatRupiah(lastReceipt.nominal)}</b></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', marginTop: '10px' }}><span className="text-muted">Metode:</span> <b>{lastReceipt.metode_bayar.toUpperCase()}</b></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">Status:</span> <b style={{ color: lastReceipt.status === 'lunas' ? '#10b981' : '#ef4444' }}>{lastReceipt.status.toUpperCase()}</b></div>
            </div>

            <h3 style={{ fontSize: '12px', marginBottom: '10px', color: '#94a3b8' }}>Aksi Cetak / Kirim Struk:</h3>
            <div className="btn-row column" style={{ gap: '10px' }}>
              <button type="button" className="btn btn-primary" onClick={() => onSendReceiptWA()} style={{ background: '#10b981', borderColor: '#10b981', padding: '12px', fontSize: '15px' }}>💬 Kirim via WhatsApp</button>
              <div className="btn-row" style={{ width: '100%' }}>
                <button type="button" className="btn btn-secondary" onClick={() => onPrintReceiptDesktop()} style={{ flex: 1 }}>🖨️ Print Desktop</button>
                <button type="button" className="btn btn-secondary" onClick={() => onPrintReceiptAndroid()} style={{ flex: 1 }}>📱 Print Android</button>
              </div>
              <button type="button" className="btn btn-danger" onClick={() => setShowReceiptPopup(false)} style={{ marginTop: '10px', background: 'transparent', color: '#ef4444' }}>Tutup & Layani Siswa Lain</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
