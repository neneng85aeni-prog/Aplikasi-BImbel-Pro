import { useState, useMemo } from 'react'
import { formatRupiah, formatTanggal } from '../../lib/format'

export function LaporanTab({ 
  financeSummary, pembayaran = [], branches = [], selectedBranchId, setSelectedBranchId, 
  searchTransaksi, setSearchTransaksi, onDeleteTransaksi,
  editTransaksiForm, setEditTransaksiForm, onSubmitEditTransaksi, onStartEditTransaksi,
  pengeluaran = [],
  onSendWA,
  canSeeStats
}) {
  // === STATE UNTUK PERIODE & PAGINATION ===
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // === 1. FILTER TRANSAKSI BERDASARKAN PERIODE & SEARCH (HARUS DI ATAS STATS) ===
  const filteredData = useMemo(() => {
    return (pembayaran || []).filter(item => {
      // Filter Tanggal
      const tgl = item.tanggal ? item.tanggal.slice(0, 10) : '';
      if (startDate && tgl < startDate) return false;
      if (endDate && tgl > endDate) return false;

      // Filter Search (Nama Siswa atau Keterangan)
      const searchLower = (searchTransaksi || '').toLowerCase();
      const namaSiswa = (item.siswa?.nama || '').toLowerCase();
      const ket = (item.keterangan || item.programs?.nama || '').toLowerCase();
      
      return namaSiswa.includes(searchLower) || ket.includes(searchLower);
    });
  }, [pembayaran, startDate, endDate, searchTransaksi]);

  // === 2. MENGHITUNG STATISTIK (DINAMIS MENGIKUTI FILTER) ===
  const stats = useMemo(() => {
    let rekap = { masuk: 0, keluar: 0 };

    // Hitung Pemasukan dari data yang sudah terfilter
    filteredData.forEach(p => {
      rekap.masuk += Number(p.nominal || 0);
    });

    // Hitung Pengeluaran yang sesuai periode
    (pengeluaran || []).filter(p => {
      const tgl = p.tanggal ? p.tanggal.slice(0, 10) : '';
      if (startDate && tgl < startDate) return false;
      if (endDate && tgl > endDate) return false;
      return true;
    }).forEach(p => {
      rekap.keluar += Number(p.nominal || p.jumlah || 0);
    });

    return rekap;
  }, [filteredData, pengeluaran, startDate, endDate]);

  // === 3. PAGINATION ===
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // === 4. FITUR DOWNLOAD CSV ===
  const handleDownload = () => {
    let csv = "Tanggal,Siswa,Kasir,Keterangan,Nominal\n";
    filteredData.forEach(t => {
      const tgl = formatTanggal(t.tanggal);
      const siswa = t.siswa?.nama || '-';
      const kasir = t.users?.nama || '-';
      const ket = (t.keterangan || t.programs?.nama || '').replace(/,/g, ' '); 
      const nom = t.nominal || 0;
      csv += `"${tgl}","${siswa}","${kasir}","${ket}","${nom}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Laporan_Transaksi.csv`;
    link.click();
  };

  return (
    <div className="grid gap-lg">
      
      {/* KOTAK STATISTIK DINAMIS */}
      <div className="grid grid-3 compact-stats" style={{ marginTop: '-10px' }}>
        <div className="glass-card" style={{ padding: '12px', borderLeft: '3px solid #3b82f6' }}>
          <p style={{ fontSize: '11px', margin: '0 0 8px 0', fontWeight: 'bold', color: '#94a3b8' }}>
            {startDate || endDate ? 'TOTAL PERIODE' : 'TOTAL HARI INI'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{fontSize: '12px'}}>Masuk:</span> 
            <b style={{fontSize: '13px', color: '#10b981'}}>{formatRupiah(stats.masuk)}</b>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{fontSize: '12px'}}>Keluar:</span> 
            <b style={{fontSize: '13px', color: '#ef4444'}}>{formatRupiah(stats.keluar)}</b>
          </div>
        </div>

        {canSeeStats && (
          <>
            <div className="glass-card" style={{ padding: '12px', borderLeft: '3px solid #8b5cf6' }}>
              <p style={{ fontSize: '11px', margin: '0 0 8px 0', fontWeight: 'bold', color: '#94a3b8' }}>LABA BERSIH</p>
              <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <b style={{ fontSize: '15px', color: stats.masuk - stats.keluar >= 0 ? '#10b981' : '#ef4444' }}>
                  {formatRupiah(stats.masuk - stats.keluar)}
                </b>
              </div>
            </div>
            
            <div className="glass-card" style={{ padding: '12px', borderLeft: '3px solid #f59e0b' }}>
              <p style={{ fontSize: '11px', margin: '0 0 8px 0', fontWeight: 'bold', color: '#94a3b8' }}>TRANSAKSI</p>
              <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <b style={{ fontSize: '18px', color: '#60a5fa' }}>{filteredData.length}</b>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Riwayat Transaksi</h2>
          <div className="btn-row">
            <input type="text" placeholder="Cari..." value={searchTransaksi} onChange={(e) => {setSearchTransaksi(e.target.value); setCurrentPage(1);}} style={{ padding: '8px', borderRadius: '6px' }} />
            <select value={selectedBranchId} onChange={(e) => {setSelectedBranchId(e.target.value); setCurrentPage(1);}} style={{ padding: '8px', borderRadius: '6px' }}>
              <option value="">Semua Cabang</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.nama}</option>)}
            </select>
          </div>
        </div>

        <div className="btn-row" style={{ flexWrap: 'wrap', marginBottom: '15px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Periode:</span>
            <input type="date" value={startDate} onChange={(e) => {setStartDate(e.target.value); setCurrentPage(1);}} style={{ padding: '6px', borderRadius: '4px', fontSize: '12px' }} />
            <span style={{color: '#94a3b8'}}>-</span>
            <input type="date" value={endDate} onChange={(e) => {setEndDate(e.target.value); setCurrentPage(1);}} style={{ padding: '6px', borderRadius: '4px', fontSize: '12px' }} />
            {(startDate || endDate) && (
              <button className="btn btn-secondary btn-small" onClick={() => {setStartDate(''); setEndDate(''); setCurrentPage(1);}}>Reset</button>
            )}
          </div>
          <button className="btn btn-primary btn-small" onClick={handleDownload} style={{ marginLeft: 'auto', background: '#10b981', borderColor: '#10b981', color: 'black' }}>
            ⬇️ Download CSV
          </button>
        </div>

        <div className="table-wrap" style={{ maxHeight: '500px', overflowY: 'auto', position: 'relative' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%' }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ background: '#1e293b', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>Tanggal</th>
                <th style={{ background: '#1e293b', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>Siswa</th>
                <th style={{ background: '#1e293b', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>Kasir</th>
                <th style={{ background: '#1e293b', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>Keterangan</th>
                <th style={{ background: '#1e293b', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>Nominal</th>
                <th style={{ background: '#1e293b', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: '500' }}>{formatTanggal(item.tanggal)}</div>
                    <div style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 'bold', marginTop: '2px' }}>
                      🕒 {item.created_at ? new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </div>
                  </td>
                  <td><b>{item.siswa?.nama}</b></td>
                  <td><span style={{ fontSize: '11px', color: '#94a3b8' }}>{item.users?.nama || '-'}</span></td>
                  <td>{item.keterangan || item.programs?.nama}</td>
                  <td><b style={{ color: '#10b981' }}>{formatRupiah(item.nominal)}</b></td>
                  <td>
                    <div className="btn-row" style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
                      <button className="btn btn-primary btn-small" onClick={() => onSendWA(item)} style={{ background: '#25d366', borderColor: '#25d366', color: 'white' }}>WA</button>
                      <button className="btn btn-secondary btn-small" onClick={() => onStartEditTransaksi(item)}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => onDeleteTransaksi(item.id, item.keterangan || item.siswa?.nama || 'Transaksi ini')}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }} className="text-muted">Tidak ada transaksi.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
            <button className="btn btn-secondary btn-small" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>◀ Prev</button>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Halaman {currentPage} dari {totalPages}</span>
            <button className="btn btn-secondary btn-small" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next ▶</button>
          </div>
        )}
      </div>

      {editTransaksiForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <form onSubmit={onSubmitEditTransaksi} className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '25px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <h2 className="section-title">Edit Transaksi</h2>
            <div className="form-row">
              <label>Keterangan</label>
              <input type="text" value={editTransaksiForm.keterangan} onChange={(e) => setEditTransaksiForm({ ...editTransaksiForm, keterangan: e.target.value })} required style={{ background: 'rgba(255,255,255,0.05)', color: 'white', width: '100%' }} />
            </div>
            <div className="form-row">
              <label>Nominal</label>
              <input type="number" value={editTransaksiForm.nominal} onChange={(e) => setEditTransaksiForm({ ...editTransaksiForm, nominal: e.target.value })} required style={{ background: 'rgba(255,255,255,0.05)', color: 'white', width: '100%' }} />
            </div>
            <div className="btn-row">
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Simpan</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditTransaksiForm(null)}>Batal</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
