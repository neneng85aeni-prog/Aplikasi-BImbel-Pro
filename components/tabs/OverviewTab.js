import { StatCard } from '../ui/StatCard'
import { BarcodePreview } from '../ui/BarcodePreview'
import { formatRupiah } from '../../lib/format'

export function OverviewTab({ overview, financeSummary, selectedBranch, employeeBarcodeIn, employeeBarcodeOut }) {
  return (
    <div className="grid gap-lg">
      <div className="grid grid-4">
        <StatCard label="Pemasukan hari ini" value={formatRupiah(overview.pemasukanHarian)} />
        <StatCard label="Pemasukan minggu ini" value={formatRupiah(overview.pemasukanMingguan)} />
        <StatCard label="Pemasukan bulan ini" value={formatRupiah(overview.pemasukanBulanan)} />
        <StatCard label="Cabang aktif" value={overview.totalCabang} meta={selectedBranch?.nama || 'Semua cabang'} />
      </div>
      <div className="premium-grid">
        <div className="glass-card">
          <h2 className="section-title">Snapshot keuangan</h2>
          <div className="mini-metrics">
            <div><span>Transaksi harian</span><b>{financeSummary.harian.transaksi}</b></div>
            <div><span>Cash</span><b>{formatRupiah(financeSummary.harian.cash)}</b></div>
            <div><span>QRIS</span><b>{formatRupiah(financeSummary.harian.qris)}</b></div>
          </div>
        </div>
        <div className="glass-card">
          <h2 className="section-title">Barcode pintu karyawan</h2>
          <p className="text-muted">Print satu barcode masuk dan satu barcode pulang lalu tempel di pintu. Sistem akan mengenali user dari session login.</p>
          <div className="grid grid-2">
            <BarcodePreview value={employeeBarcodeIn} title="Barcode masuk" compact />
            <BarcodePreview value={employeeBarcodeOut} title="Barcode pulang" compact />
          </div>
        </div>
      </div>
    </div>
  )
}
