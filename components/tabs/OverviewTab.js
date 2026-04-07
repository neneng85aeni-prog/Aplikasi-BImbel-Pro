import { useMemo } from 'react'
import { formatRupiah } from '../../lib/format'
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts'

export function OverviewTab({ stats, overview, financeSummary, selectedBranch, employeeBarcodeIn, employeeBarcodeOut, pembayaran = [], pengeluaran = [] }) {
  
  // === FUNGSI PRINT QR CODE ===
  function printQRCode(title, qrData, branchName) {
    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Print QR ${title}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; color: #1e293b; }
          h1 { font-size: 48px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
          h2 { font-size: 28px; color: #64748b; margin-bottom: 40px; }
          img { width: 450px; height: 450px; border: 4px solid #1e293b; padding: 25px; border-radius: 24px; }
          @media print { body { height: auto; margin-top: 80px; } }
        </style>
      </head>
      <body onload="window.print()">
        <h1>SCAN ABSENSI ${title.toUpperCase()}</h1>
        <h2>${branchName || 'BIMBEL PRO PUSAT'}</h2>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${qrData}" />
      </body>
      </html>
    `
    const w = window.open('', '_blank', 'width=800,height=900');
    w?.document.write(html); w?.document.close();
  }

  // === MENGHITUNG DATA HARIAN (BULAN BERJALAN) ===
  const dailyData = useMemo(() => {
    const today = new Date();
    const currentMonthPrefix = today.toISOString().slice(0, 7);
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysArray = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dayString = i < 10 ? `0${i}` : `${i}`;
      daysArray.push({ tanggalFilter: `${currentMonthPrefix}-${dayString}`, labelTanggal: `${i}`, Pemasukan: 0, Pengeluaran: 0 });
    }
    const branchId = selectedBranch?.id;
    pembayaran.forEach(p => {
      if (branchId && p.branch_id !== branchId && p.siswa?.branch_id !== branchId) return;
      const tglFull = p.tanggal ? p.tanggal.slice(0, 10) : '';
      if (tglFull.startsWith(currentMonthPrefix)) {
        const index = daysArray.findIndex(d => d.tanggalFilter === tglFull);
        if (index !== -1) daysArray[index].Pemasukan += Number(p.nominal || p.jumlah_bayar || 0);
      }
    });
    pengeluaran.forEach(p => {
      if (branchId && p.branch_id !== branchId) return;
      const tglFull = p.tanggal ? p.tanggal.slice(0, 10) : '';
      if (tglFull.startsWith(currentMonthPrefix)) {
        const index = daysArray.findIndex(d => d.tanggalFilter === tglFull);
        if (index !== -1) daysArray[index].Pengeluaran += Number(p.nominal || p.jumlah || 0);
      }
    });
    return daysArray;
  }, [pembayaran, pengeluaran, selectedBranch]);

  // === KONFIGURASI PIE CHART (WARNA & LEGEND) ===
  const COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
    '#14b8a6', '#facc15', '#a855f7', '#fb7185', '#2dd4bf',
    '#94a3b8', '#475569', '#52525b', '#0ea5e9', '#6d28d9'
  ];

  const renderCustomLegend = (value, entry) => (
    <span style={{ color: '#94a3b8', fontSize: '11px', marginLeft: '5px' }}>
      {value} <b style={{ color: '#fff' }}>( {entry.payload.value} )</b>
    </span>
  );

  const programData = overview?.studentDistribution || [{ name: 'Data Kosong', value: 0 }];

  return (
    <div className="grid gap-lg">
      
      {/* BARIS 1: KARTU STATISTIK (QUICK STATS) */}
      {stats && overview && (
        <div className="grid grid-4" style={{ gap: '15px' }}>
          <StatCard title="Total Siswa" value={stats.siswa || 0} unit="Anak Aktif" icon="👨‍🎓" color="#3b82f6" />
          <StatCard title="Pemasukan" value={formatRupiah(overview.monthlyRevenue || 0)} unit="Bulan Ini" icon="📈" color="#10b981" />
          <StatCard title="Pengeluaran" value={formatRupiah(overview.monthlyExpense || 0)} unit="Bulan Ini" icon="📉" color="#ef4444" />
          <StatCard title="Estimasi Profit" value={formatRupiah((overview.monthlyRevenue || 0) - (overview.monthlyExpense || 0))} unit="Laba Bersih" icon="💎" color="#8b5cf6" />
        </div>
      )}

      {/* BARIS 2: QR CODE & PIE CHART PROGRAM */}
      <div className="grid grid-2" style={{ gap: '20px', gridTemplateColumns: '1.2fr 1.8fr' }}>
         
         {/* KARTU QR CODE */}
         <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
            <h2 className="section-title">QR Absensi</h2>
            <p className="text-muted" style={{ marginBottom: '15px', fontSize: '12px' }}>{selectedBranch?.nama || 'Pusat'}</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
               <div style={{ background: '#fff', padding: '10px', borderRadius: '12px' }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${employeeBarcodeIn}`} width="100" height="100" />
                  <div style={{ color: '#000', fontSize: '10px', fontWeight: 'bold', marginTop: '5px' }}>MASUK</div>
               </div>
               <div style={{ background: '#fff', padding: '10px', borderRadius: '12px' }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${employeeBarcodeOut}`} width="100" height="100" />
                  <div style={{ color: '#000', fontSize: '10px', fontWeight: 'bold', marginTop: '5px' }}>PULANG</div>
               </div>
            </div>
            <button className="btn btn-primary btn-small" onClick={() => printQRCode('Absensi', employeeBarcodeIn, selectedBranch?.nama)}>🖨️ Cetak QR</button>
         </div>

         {/* KARTU PIE CHART (DENGAN SCROLLABLE LEGEND) */}
         <div className="glass-card">
           <h2 className="section-title">Program Belajar</h2>
           <div style={{ width: '100%', height: '280px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={programData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                   {programData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(0,0,0,0.2)" />)}
                 </Pie>
                 <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
                 <Legend 
                    layout="vertical" align="right" verticalAlign="middle" 
                    formatter={renderCustomLegend} 
                    wrapperStyle={{ paddingLeft: '20px', maxHeight: '250px', overflowY: 'auto' }} 
                 />
               </PieChart>
             </ResponsiveContainer>
           </div>
         </div>

      </div>

      {/* BARIS 3: GRAFIK HARIAN */}
      <div className="glass-card">
        <h2 className="section-title">Tren Arus Kas Harian (Bulan Ini)</h2>
        <div style={{ width: '100%', height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              <XAxis dataKey="labelTanggal" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `Rp${val/1000}k`} tickLine={false} axisLine={false} />
              <Tooltip 
                formatter={(value) => formatRupiah(value)} 
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} 
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
              <Bar dataKey="Pemasukan" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
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
    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', borderLeft: `5px solid ${color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', margin: '5px 0' }}>{value}</div>
        <div style={{ fontSize: '10px', color: color, fontWeight: 'bold' }}>{unit}</div>
      </div>
      <div style={{ fontSize: '30px', opacity: 0.5 }}>{icon}</div>
    </div>
  );
}
