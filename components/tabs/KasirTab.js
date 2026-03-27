import { formatRupiah } from '../../lib/format'
import { PAYMENT_METHOD_OPTIONS, PAYMENT_STATUS_OPTIONS } from '../../lib/constants'

export function KasirTab({ 
  branches, selectedBranchId, setSelectedBranchId, siswaOptions, selectedStudent, 
  kasirForm, setKasirForm, studentScanInfo, scanStudentActive, setScanStudentActive, 
  studentScanText, onSelectStudent, onSubmitKasir, onPrintReceiptDesktop, onPrintReceiptAndroid, 
  onSendReceiptWA, programs, inventoryTampil 
}) {
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
              <select value={selectedStudent?.id || ''} onChange={(e) => onSelectStudent(e.target.value)} style={{ width: '100%' }}>
                <option value="">-- Ketik/Pilih Nama Siswa --</option>
                {siswaOptions.map((item) => <option key={item.id} value={item.id}>{item.nama} ({item.branches?.nama || 'Pusat'})</option>)}
              </select>
            </div>
            
            <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
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
                <div style={{ display: 'flex', gap: '20px', padding: '10px 0' }}>
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
                  <select value={kasirForm.inventory_id || ''} onChange={(e) => setKasirForm({ ...kasirForm, inventory_id: e.target.value })} required>
                    <option value="">-- Pilih Barang --</option>
                    {inventoryTampil.map((item) => (
                      <option key={item.id} value={item.id} disabled={item.stok < 1}>
                        {item.nama} - {formatRupiah(item.harga)} {item.stok < 1 ? '(HABIS)' : `(Sisa: ${item.stok})`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="form-row"><label>Nominal Pembayaran (Rp)</label><input type="number" value={kasirForm.nominal} onChange={(e) => setKasirForm({ ...kasirForm, nominal: e.target.value })} placeholder={`Saran: ${selectedStudent?.nominal || '0'}`} required /></div>
                  <div className="form-row"><label>Keterangan Tambahan</label><input type="text" value={kasirForm.keterangan} onChange={(e) => setKasirForm({ ...kasirForm, keterangan: e.target.value })} placeholder="Cth: SPP Bulan Agustus" /></div>
                </>
              )}

              <div className="grid grid-2">
                <div className="form-row"><label>Metode</label><select value={kasirForm.metode_bayar} onChange={(e) => setKasirForm({ ...kasirForm, metode_bayar: e.target.value })}>{PAYMENT_METHOD_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}</select></div>
                <div className="form-row"><label>Status</label><select value={kasirForm.status} onChange={(e) => setKasirForm({ ...kasirForm, status: e.target.value })}>{PAYMENT_STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt.replace('_', ' ').toUpperCase()}</option>)}</select></div>
              </div>

              <div className="btn-row" style={{ marginTop: '20px' }}>
                <button className="btn btn-primary" type="submit" disabled={!selectedStudent} style={{ flex: 1, padding: '14px', fontSize: '15px' }}>💳 Simpan Transaksi</button>
              </div>
            </form>

            {/* AREA TOMBOL PRINT & WA */}
            <div className="glass-card" style={{ textAlign: 'center', padding: '20px' }}>
              <h3 className="text-muted" style={{ fontSize: '13px', marginBottom: '15px' }}>Cetak Struk Transaksi Terakhir</h3>
              <div className="btn-row" style={{ justifyContent: 'center' }}>
                <button type="button" className="btn btn-secondary btn-small" onClick={() => onPrintReceiptDesktop()}>Print Desktop 🖨️</button>
                <button type="button" className="btn btn-secondary btn-small" onClick={() => onPrintReceiptAndroid()}>Print Android 📱</button>
                <button type="button" className="btn btn-primary btn-small" onClick={() => onSendReceiptWA()} style={{ background: '#10b981', borderColor: '#10b981' }}>Kirim WA 💬</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
