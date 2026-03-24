import { PAYMENT_METHOD_OPTIONS, PAYMENT_STATUS_OPTIONS } from '../../lib/constants'
import { formatRupiah } from '../../lib/format'

export function KasirTab({ branches, selectedBranchId, setSelectedBranchId, siswaOptions, selectedStudent, kasirForm, setKasirForm, studentScanInfo, scanStudentActive, setScanStudentActive, studentScanText, onSelectStudent, onSubmitKasir, onPrintReceipt }) {
  return (
    <div className="grid grid-2">
      <div className="glass-card">
        <h2 className="section-title">Transaksi kasir premium</h2>
        <p className="text-muted">Menu kasir sekarang fokus ke pembayaran. Absensi siswa dipisah ke menu <b>Absensi Siswa</b>.</p>
        <div className="form-row"><label>Filter cabang</label><select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}><option value="">Semua cabang</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select></div>
        <div className="form-row"><label>Pilih siswa manual</label><select value={selectedStudent?.id || ''} onChange={(e) => onSelectStudent(e.target.value)}><option value="">Pilih siswa</option>{siswaOptions.map((item) => <option key={item.id} value={item.id}>{item.nama} - {item.branches?.nama || '-'} </option>)}</select></div>
        <div className="form-row"><label>Atau scan barcode siswa</label><div id="reader-siswa" className="reader-box" /></div>
        <p className="text-muted">{studentScanInfo}</p>
        <div className="btn-row"><button className="btn btn-secondary" type="button" onClick={() => setScanStudentActive(true)}>{scanStudentActive ? 'Scanning...' : 'Start scanning'}</button><button className="btn btn-secondary" type="button" onClick={() => setScanStudentActive(false)}>Stop</button></div>
        {selectedStudent ? <div className="soft-panel" style={{ marginTop: 16 }}><div className="kv"><b>Siswa</b><span>{selectedStudent.nama}</span></div><div className="kv"><b>Cabang</b><span>{selectedStudent.branches?.nama || '-'}</span></div><div className="kv"><b>Program</b><span>{selectedStudent.programNama}</span></div><div className="kv"><b>Biaya default</b><span>{formatRupiah(selectedStudent.nominal)}</span></div><div className="kv"><b>Barcode scan</b><span>{studentScanText || '-'}</span></div></div> : null}
      </div>
      <div className="glass-card">
        <h2 className="section-title">Input pembayaran</h2>
        <div className="grid grid-2">
          <div className="form-row"><label>Status</label><select value={kasirForm.status} onChange={(e) => setKasirForm({ ...kasirForm, status: e.target.value })}>{PAYMENT_STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
          <div className="form-row"><label>Metode bayar</label><select value={kasirForm.metode_bayar} onChange={(e) => setKasirForm({ ...kasirForm, metode_bayar: e.target.value })}>{PAYMENT_METHOD_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
        </div>
        <div className="form-row"><label>Nominal</label><input type="number" value={kasirForm.nominal} onChange={(e) => setKasirForm({ ...kasirForm, nominal: e.target.value })} /></div>
        <div className="form-row"><label>Keterangan</label><textarea value={kasirForm.keterangan} onChange={(e) => setKasirForm({ ...kasirForm, keterangan: e.target.value })} /></div>
        <div className="btn-row"><button className="btn btn-primary" type="button" onClick={onSubmitKasir}>Simpan transaksi</button><button className="btn btn-secondary" type="button" onClick={() => onPrintReceipt()}><button className="btn btn-secondary" type="button" onClick={() => onPrintReceipt()}>Print Desktop</button><button className="btn btn-primary" type="button" onClick={() => onPrintReceipt()}>Print Android</button></button></div>
        <p className="text-muted">Jika status belum lunas, transaksi tetap tercatat untuk laporan keuangan.</p>
      </div>
    </div>
  )
}
