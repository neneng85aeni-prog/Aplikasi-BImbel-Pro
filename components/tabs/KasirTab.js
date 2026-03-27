import { formatRupiah } from '../../lib/format'
import { PAYMENT_METHOD_OPTIONS, PAYMENT_STATUS_OPTIONS } from '../../lib/constants'

export function KasirTab({ 
  branches, selectedBranchId, setSelectedBranchId, siswaOptions, selectedStudent, 
  kasirForm, setKasirForm, studentScanInfo, scanStudentActive, setScanStudentActive, 
  studentScanText, onSelectStudent, onSubmitKasir, onPrintReceiptDesktop, onPrintReceiptAndroid, 
  programs, inventoryTampil 
}) {
  return (
    <div className="grid gap-lg">
      <div className="glass-card">
        <div className="btn-row" style={{ justifyContent: 'space-between' }}>
          <h2 className="section-title">Pencatatan Kasir</h2>
          <div className="form-row slim"><label>Cabang</label><select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}><option value="">Semua cabang</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select></div>
        </div>

        <div className="grid grid-2">
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '16px', fontWeight: 'bold' }}>1. Pilih / Scan Siswa</h3>
            <div style={{ marginBottom: '16px' }}>
              {!scanStudentActive ? (
                <button className="btn btn-secondary" onClick={() => setScanStudentActive(true)} style={{ width: '100%', padding: '12px' }}>📷 Mulai Scan Barcode Siswa</button>
              ) : (
                <div className="scanner-container">
                  <div id="reader-siswa" style={{ width: '100%' }}></div>
                  <button className="btn btn-danger" onClick={() => setScanStudentActive(false)} style={{ width: '100%', marginTop: '10px' }}>Tutup Scanner</button>
                </div>
              )}
            </div>
            {studentScanText && <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>Hasil Scan Terakhir: {studentScanText}</div>}
            
            <div style={{ textAlign: 'center', margin: '15px 0', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8' }}>ATAU CARI MANUAL</div>
            
            <select value={selectedStudent?.id || ''} onChange={(e) => onSelectStudent(e.target.value)} style={{ width: '100%', padding: '10px' }}>
              <option value="">-- Ketik/Pilih Nama Siswa --</option>
              {siswaOptions.map((item) => <option key={item.id} value={item.id}>{item.nama} ({item.branches?.nama || 'Pusat'})</option>)}
            </select>
            
            <div style={{ marginTop: '20px', padding: '15px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Status Siswa:</span><br/>
              <b>{studentScanInfo}</b>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '14px', marginBottom: '16px', fontWeight: 'bold' }}>2. Detail Transaksi</h3>
            <form onSubmit={onSubmitKasir} className="glass-card" style={{ padding: '20px', background: '#fff' }}>
              <div className="form-row">
                <label>Jenis Transaksi</label>
                <div style={{ display: 'flex', gap: '15px', background: '#f1f5f9', padding: '10px', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input type="radio" name="jenis" value="program" checked={kasirForm.jenis_transaksi === 'program' || !kasirForm.jenis_transaksi} onChange={(e) => setKasirForm({ ...kasirForm, jenis_transaksi: e.target.value })} /> Jasa Program (SPP)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
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

              <div className="btn-row" style={{ marginTop: '15px' }}>
                <button className="btn btn-primary" type="submit" disabled={!selectedStudent} style={{ flex: 1, padding: '14px' }}>💳 Simpan Transaksi</button>
              </div>
            </form>

            <div className="glass-card" style={{ marginTop: '20px', textAlign: 'center', background: '#f8fafc' }}>
              <h3 style={{ fontSize: '13px', marginBottom: '10px', color: '#64748b' }}>Cetak Struk Transaksi Terakhir</h3>
              <div className="btn-row" style={{ justifyContent: 'center' }}>
                <button className="btn btn-secondary btn-small" onClick={() => onPrintReceiptDesktop()}>Print Desktop 🖨️</button>
                <button className="btn btn-secondary btn-small" onClick={() => onPrintReceiptAndroid()}>Print Android 📱</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
