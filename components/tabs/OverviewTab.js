'use client'

import { useMemo, useState } from 'react'
import { formatRupiah } from '../../lib/format'
import { 
  ComposedChart, 
  BarChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LabelList
} from 'recharts'

export function OverviewTab({ stats, overview, financeSummary, selectedBranch, employeeBarcodeIn, employeeBarcodeOut, pembayaran = [], pengeluaran = [], siswa = [], perkembangan = [] }) {
  
  // === 1. URUTKAN DATA: TERBESAR PALING ATAS ===
  const sortedDistribution = useMemo(() => {
    // Kita ambil data, lalu urutkan berdasarkan 'value' dari besar ke kecil
    return [...(overview?.studentDistribution || [])].sort((a, b) => b.value - a.value);
  }, [overview?.studentDistribution]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

  // === 2. CUSTOM LEGEND UNTUK TAMPILAN DETAIL DI BAWAH ===
  const renderCustomLegend = (value, entry) => (
    <span style={{ color: '#94a3b8', fontSize: '11px', marginLeft: '5px' }}>
      {value} <b style={{ color: '#fff' }}>( {entry.payload.value} )</b>
    </span>
  );

  // --- Fungsi Cetak QR & Logika KPI (Tetap Sama) ---
  function printQRCode(title, qrData, branchName) {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Cetak QR ${title}</title><style>body { font-family: 'Arial', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }.container { border: 2px dashed #ccc; padding: 50px; border-radius: 20px; }h1 { font-size: 54px; margin-bottom: 10px; color: #1e293b; }h2 { font-size: 32px; color: #64748b; margin-bottom: 40px; }img { width: 500px; height: 500px; border: 5px solid #000; padding: 20px; border-radius: 20px; }.code-text { font-size: 24px; margin-top: 30px; font-weight: bold; color: #1e293b; }@media print { @page { size: A4; margin: 0; } body { height: 95vh; } }</style></head><body onload="window.print()"><div class="container"><h1>ABSENSI ${title.toUpperCase()}</h1><h2>${branchName || 'BIMBEL PRO PUSAT'}</h2><img src="https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${qrData}" /><div class="code-text">KODE: ${qrData}</div></div></body></html>`;
    const w = window.open('', '_blank'); w?.document.write(html); w?.document.close();
  }

  const [periodeGrafik, setPeriodeGrafik] = useState(() => {
    const hariIni = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
    const tujuhHariLalu = new Date(hariIni.getTime() - (6 * 24 * 60 * 60 * 1000));
    return { mulai: tujuhHariLalu.toISOString().slice(0, 10), selesai: hariIni.toISOString().slice(0, 10) };
  });

  const attendanceKPI = useMemo(() => {
    const dataGrafik = [];
    const branchId = selectedBranch?.id;
    const hariMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const start = new Date(periodeGrafik.mulai);
    const end = new Date(periodeGrafik.selesai);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const currentDate = new Date(d);
      const namaHariIni = hariMap[currentDate.getUTCDay()];
      const tanggalStrIni = currentDate.toISOString().slice(0, 10);
      const labelTgl = `${currentDate.getDate()}/${currentDate.getMonth() + 1}`;
      const targetSiswa = (siswa || []).filter(s => {
        if (s.status === 'nonaktif' || s.status === 'Nonaktif') return false;
        const matchBranch = !branchId || s.branch_id === branchId;
        let matchDay = false;
        if (Array.isArray(s.hari)) { matchDay = s.hari.some(h => h?.toLowerCase() === namaHariIni.toLowerCase()); } 
        else if (typeof s.hari === 'string') { matchDay = s.hari.toLowerCase().includes(namaHariIni.toLowerCase()); }
        return matchBranch && matchDay;
      });
      const actualHadir = (perkembangan || []).filter(p => {
        const isTanggalCocok = p.tanggal && p.tanggal.startsWith(tanggalStrIni);
        const isTargetBranch = !branchId || p.branch_id === branchId || p.siswa?.branch_id === branchId;
        return isTanggalCocok && isTargetBranch;
      });
      const targetCount = targetSiswa.length;
      const aktualCount = actualHadir.length;
      const persenHitung = targetCount > 0 ? Math.round((aktualCount / targetCount) * 100) : 0;
      dataGrafik.push({ name: labelTgl, hari: namaHariIni, Target: targetCount, Aktual: aktualCount, Persen: persenHitung });
    }
    return dataGrafik;
  }, [siswa, perkembangan, selectedBranch, periodeGrafik]);

  const dailyData = useMemo(() => {
    const today = new Date();
    const currentMonthPrefix = today.toISOString().slice(0, 7);
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysArray = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dStr = i < 10 ? `0${i}` : `${i}`;
      daysArray.push({ labelTanggal: `${i}`, dateKey: `${currentMonthPrefix}-${dStr}`, Pemasukan: 0, Pengeluaran: 0 });
    }
    const branchId = selectedBranch?.id;
    pembayaran.forEach(p => {
      if (branchId && p.branch_id !== branchId) return;
      const d = p.tanggal?.slice(0, 10);
      const idx = daysArray.findIndex(item => item.dateKey === d);
      if (idx !== -1) daysArray[idx].Pemasukan += Number(p.nominal || 0);
    });
    pengeluaran.forEach(p => {
      if (branchId && p.branch_id !== branchId) return;
      const d = p.tanggal?.slice(0, 10);
      const idx = daysArray.findIndex(item => item.dateKey === d);
      if (idx !== -1) daysArray[idx].Pengeluaran += Number(p.nominal || 0);
    });
    return daysArray;
  }, [pembayaran, pengeluaran, selectedBranch]);

  const renderPersentase = (props) => {
    const { x, y, width, value } = props; 
    if (!value || value === 0) return null;
    return <text x={x + width / 2} y={y - 8} fill="#10b981" textAnchor="middle" fontSize={11} fontWeight="bold">{value}%</text>;
  };

  return (
    <div className="grid gap-lg">
      
      {/* STATS ATAS */}
      {stats && overview && (
        <div className="grid grid-4" style={{ gap: '15px' }}>
          <StatCard title="Total Siswa" value={stats.siswa || 0} unit="Anak" icon="👨‍🎓" color="#3b82f6" />
          <StatCard title="Pemasukan" value={formatRupiah(overview.monthlyRevenue || 0)} unit="Bulan Ini" icon="📈" color="#10b981" />
          <StatCard title="Pengeluaran" value={formatRupiah(overview.monthlyExpense || 0)} unit="Bulan Ini" icon="📉" color="#ef4444" />
          <StatCard title="Estimasi Profit" value={formatRupiah((overview.monthlyRevenue || 0) - (overview.monthlyExpense || 0))} unit="Laba Bersih" icon="💎" color="#8b5cf6" />
        </div>
      )}

      {/* BARIS 2 */}
      <div className="grid grid-3" style={{ gap: '20px', gridTemplateColumns: '2.2fr 0.8fr 1fr' }}>
         
         {/* KARTU 1: KPI */}
         <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 className="section-title" style={{ fontSize: '14px', margin: 0 }}>KPI Kehadiran Siswa</h2>
                <p className="text-muted" style={{ fontSize: '11px', margin: '5px 0 15px 0' }}>Target Jadwal vs Aktual Datang</p>
              </div>
              <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                <input type="date" value={periodeGrafik.mulai} onChange={e => setPeriodeGrafik({...periodeGrafik, mulai: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '2px 5px', fontSize: '11px' }} />
                <span style={{ color: '#94a3b8', fontSize: '11px', alignSelf: 'center' }}>-</span>
                <input type="date" value={periodeGrafik.selesai} onChange={e => setPeriodeGrafik({...periodeGrafik, selesai: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '2px 5px', fontSize: '11px' }} />
              </div>
            </div>
            <div style={{ width: '100%', height: '240px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceKPI} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8" />
                     <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8" />
                     <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} />
                     <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                     <Bar dataKey="Target" fill="rgba(59, 130, 246, 0.3)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                     <Bar dataKey="Aktual" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        <LabelList dataKey="Persen" content={renderPersentase} />
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* KARTU 2: QR */}
         <div className="glass-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 className="section-title" style={{ fontSize: '14px', marginBottom: '15px' }}>QR Absensi</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
               <div style={{ background: '#fff', padding: '10px', borderRadius: '12px', width: '80%', maxWidth: '140px' }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${employeeBarcodeIn}`} width="100%" alt="QR Masuk" />
                  <div style={{ color: '#000', fontSize: '10px', fontWeight: 'bold', marginTop: '5px' }}>MASUK</div>
                  <button className="btn btn-primary btn-small" onClick={() => printQRCode('Masuk', employeeBarcodeIn, selectedBranch?.nama)} style={{ marginTop: '10px', width: '100%', fontSize: '10px', padding: '5px' }}>🖨️ Cetak</button>
               </div>
               <div style={{ background: '#fff', padding: '10px', borderRadius: '12px', width: '80%', maxWidth: '140px' }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${employeeBarcodeOut}`} width="100%" alt="QR Pulang" />
                  <div style={{ color: '#000', fontSize: '10px', fontWeight: 'bold', marginTop: '5px' }}>PULANG</div>
                  <button className="btn btn-secondary btn-small" onClick={() => printQRCode('Pulang', employeeBarcodeOut, selectedBranch?.nama)} style={{ marginTop: '10px', width: '100%', fontSize: '10px', padding: '5px', background: '#ef4444', color: 'white', border: 'none' }}>🖨️ Cetak</button>
               </div>
            </div>
         </div>

         {/* KARTU 3: PIE CHART PROGRAM (DIPERBAIKI) */}
         <div className="glass-card">
           <h2 className="section-title" style={{ fontSize: '14px' }}>Komposisi Program</h2>
           
           <div style={{ width: '100%', height: '320px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie 
                    data={sortedDistribution} 
                    cx="50%" 
                    cy="38%"         /* Posisi vertikal agar tidak mepet atas/bawah */
                    innerRadius={0}    /* Set ke 0 agar jadi BULAT SOLID (Belah Kue) */
                    outerRadius={60}   /* Diperkecil sedikit agar tidak terpotong di layar mana pun */
                    dataKey="value"
                    stroke="rgba(0,0,0,0.3)" /* Garis pemisah antar kue */
                 >
                   {sortedDistribution.map((e, i) => (
                     <Cell key={i} fill={COLORS[i % COLORS.length]} />
                   ))}
                 </Pie>
                 
                 {/* PERBAIKAN TOOLTIP: Ditambahkan itemStyle agar teks menjadi putih */}
                 <Tooltip 
                    contentStyle={{ 
                      background: '#1e293b', 
                      border: 'none', 
                      borderRadius: '8px', 
                      fontSize: '11px',
                      color: '#fff' 
                    }} 
                    itemStyle={{ color: '#fff' }} /* Memaksa teks di dalam tooltip berwarna putih */
                 />
                 
                 <Legend 
                    layout="vertical" 
                    align="center" 
                    verticalAlign="bottom" 
                    formatter={renderCustomLegend} 
                    wrapperStyle={{ 
                       width: '100%', 
                       maxHeight: '120px', 
                       overflowY: 'auto', 
                       paddingTop: '10px',
                       bottom: '0px'
                    }} 
                 />
               </PieChart>
             </ResponsiveContainer>
           </div>
         </div>
      </div>

      {/* GRAFIK HARIAN */}
      <div className="glass-card">
        <h2 className="section-title">Tren Arus Kas Harian</h2>
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              <XAxis dataKey="labelTanggal" stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} tickFormatter={(val) => `Rp${val/1000}k`} />
              <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px' }} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
              <Bar dataKey="Pemasukan" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Line type="monotone" dataKey="Pemasukan" stroke="#10b981" strokeWidth={3} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}

function StatCard({ title, value, unit, icon, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', borderLeft: `5px solid ${color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>{title}</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', margin: '3px 0' }}>{value}</div>
        <div style={{ fontSize: '10px', color: color }}>{unit}</div>
      </div>
      <div style={{ fontSize: '24px', opacity: 0.4 }}>{icon}</div>
    </div>
  );
}
