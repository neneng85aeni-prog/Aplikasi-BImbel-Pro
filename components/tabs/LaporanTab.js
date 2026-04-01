import { useState, useMemo } from 'react'
import { formatRupiah, formatTanggal } from '../../lib/format'

export function LaporanTab({ 
  financeSummary, pembayaran, branches, selectedBranchId, setSelectedBranchId, 
  searchTransaksi, setSearchTransaksi, onDeleteTransaksi,
  editTransaksiForm, setEditTransaksiForm, onSubmitEditTransaksi, onStartEditTransaksi,
  pengeluaran = [] // Ditambahkan untuk menghitung total keluar
}) {
  // === STATE BARU UNTUK PERIODE & PAGINATION ===
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // === MENGHITUNG STATISTIK HARIAN, MINGGUAN, BULANAN ===
  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const getMonday = (d) => {
      const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(new Date(d).setDate(diff)).toISOString().slice(0, 10);
    };
    const mondayStr = getMonday(today);
    const monthStr = todayStr.slice(0, 7); // Format YYYY-MM

    let rekap = { harianMasuk: 0, harianKeluar: 0, mingguanMasuk: 0, mingguanKeluar: 0, bulananMasuk: 0, bulananKeluar: 0 };

    // Hitung Uang Masuk
    pembayaran.forEach(p => {
      const tgl = p.tanggal ? p.tanggal.slice(0, 10) : '';
      const nominal = Number(p.nominal || p.jumlah_bayar || 0);
      if (tgl === todayStr) rekap.harianMasuk += nominal;
      if (tgl >= mondayStr) rekap.mingguanMasuk += nominal;
      if (tgl.startsWith(monthStr)) rekap.bulananMasuk += nominal;
    });

    // Hitung Uang Keluar
    pengeluaran.forEach(p => {
      const tgl = p.tanggal ? p.tanggal.slice(0, 10) : '';
      const nominal = Number(p.nominal || p.jumlah || 0);
      if (tgl === todayStr) rekap.harianKeluar += nominal;
      if (tgl >= mondayStr) rekap.mingguanKeluar += nominal;
      if (tgl.startsWith(monthStr)) rekap.bulananKeluar += nominal;
    });

    return rekap;
  }, [pembayaran, pengeluaran]);

  // === FILTER TRANSAKSI BERDASARKAN PERIODE ===
  const filteredData = useMemo(() => {
    return pembayaran.filter(item => {
      const tgl = item.tanggal ? item.tanggal.slice(0, 10) : '';
      if (startDate && tgl < startDate) return false;
      if (endDate && tgl > endDate) return false;
      return true;
    });
  }, [pembayaran, startDate, endDate]);

  // === PAGINATION (POTONG DATA PER 10) ===
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // === FITUR DOWNLOAD ===
  const handleDownload = () => {
    let csv = "Tanggal,Siswa,Keterangan,Nominal\n";
    filteredData.forEach(t => {
      const tgl = formatTanggal(t.tanggal);
      const siswa = t.siswa?.nama || '-';
      const ket = (t.keterangan || t.programs?.nama || '').replace(/,/g, ' '); // Hapus koma agar csv tidak rusak
      const nom = t.nominal || 0;
      csv += `"${tgl}","${siswa}","${ket}","${nom}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Laporan_Transaksi_${startDate || 'Semua'}_sd_${endDate || 'Semua'}.csv`;
    link.click();
  };

  return (
    <div className="grid gap-lg">
      
      {/* 1. STATISTIK UTAMA (KODE ASLI) */}
      

      {/* 2. TAMBAHAN: STATISTIK HARIAN, MINGGUAN, BULANAN */}
      <div className="grid grid-3 compact-stats" style={{ marginTop: '-10px' }}>
        <div className="glass-card" style={{ padding: '12px', borderLeft: '3px solid #3b82f6' }}>
          <p style={{ fontSize: '12px', margin: '0 0 8px 0', fontWeight: 'bold', color: '#94a3b8' }}>Hari Ini</p>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{fontSize: '12px'}}>Masuk:</span> <b style={{fontSize: '13px', color: '#10b981'}}>{formatRupiah(stats.harianMasuk)}</b></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{fontSize: '12px'}}>Keluar:</span> <b style={{fontSize: '13px', color: '#ef4444'}}>{formatRupiah(stats.harianKeluar)}</b></div>
        </div>
        <div className="glass-card" style={{ padding: '12px', borderLeft: '3px solid #8b5cf6' }}>
          <p style={{ fontSize: '12px', margin: '0 0 8px 0', fontWeight: 'bold', color: '#94a3b8' }}>Minggu Ini</p>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{fontSize: '12px'}}>Masuk:</span> <b style={{fontSize: '13px', color: '#10b981'}}>{formatRupiah(stats.mingguanMasuk)}</b></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{fontSize: '12px'}}>Keluar:</span> <b style={{fontSize: '13px', color: '#ef4444'}}>{formatRupiah(stats.mingguanKeluar)}</b></div>
        </div>
        <div className="glass-card" style={{ padding: '12px', borderLeft: '3px solid #f59e0b' }}>
          <p style={{ fontSize: '12px', margin: '0 0 8px 0', fontWeight: 'bold', color: '#94a3b8' }}>Bulan Ini</p>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{fontSize: '12px'}}>Masuk:</span> <b style={{fontSize: '13px', color: '#10b981'}}>{formatRupiah(stats.bulananMasuk)}</b></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{fontSize: '12px'}}>Keluar:</span> <b style={{fontSize: '13px', color: '#ef4444'}}>{formatRupiah(stats.bulananKeluar)}</b></div>
        </div>
      </div>

      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Riwayat Transaksi</h2>
          
          {/* KONTROL PENCARIAN & CABANG (KODE ASLI) */}
          <div className="btn-row">
            <input type="text" placeholder="Cari..." value={searchTransaksi} onChange={(e) => {setSearchTransaksi(e.target.value); setCurrentPage(1);}} style={{ padding: '8px', borderRadius: '6px' }} />
            <select value={selectedBranchId} onChange={(e) => {setSelectedBranchId(e.target.value); setCurrentPage(1);}} style={{ padding: '8px', borderRadius: '6px' }}>
              <option value="">Semua Cabang</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.nama}</option>)}
            </select>
          </div>
        </div>

        {/* TAMBAHAN: FILTER PERIODE & DOWNLOAD */}
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

        <div className="table-wrap">
          <table>
            <div className="table-wrap" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead><tr><th>Tanggal</th><th>Siswa</th><th>Keterangan</th><th>Nominal</th><th>Aksi</th></tr></thead>
            <tbody>
              {/* PEMBARUAN: Menggunakan data yang sudah dipotong per 10 (paginatedData) */}
              {paginatedData.map((item) => (
                <tr key={item.id}>
                  <td>{formatTanggal(item.tanggal)}</td>
                  <td><b>{item.siswa?.nama}</b></td>
                  <td>{item.keterangan || item.programs?.nama}</td>
                  <td><b style={{ color: '#10b981' }}>{formatRupiah(item.nominal)}</b></td>
                  <td>
                    <div className="btn-row">
                      <button className="btn btn-secondary btn-small" onClick={() => onStartEditTransaksi(item)}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => onDeleteTransaksi(item.id, item.keterangan || item.siswa?.nama || 'Transaksi ini')}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }} className="text-muted">Tidak ada transaksi.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* TAMBAHAN: TOMBOL PAGINATION (HALAMAN) */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
            <button className="btn btn-secondary btn-small" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>◀ Prev</button>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Halaman {currentPage} dari {totalPages}</span>
            <button className="btn btn-secondary btn-small" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next ▶</button>
          </div>
        )}
      </div>

      {/* KODE MODAL EDIT (KODE ASLI) */}
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
