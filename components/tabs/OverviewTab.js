import { useMemo } from 'react'
import { formatRupiah } from '../../lib/format'
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar 
} from 'recharts'

export function OverviewTab({ 
  stats, overview, financeSummary, selectedBranch, 
  employeeBarcodeIn, employeeBarcodeOut, 
  pembayaran = [], pengeluaran = [], 
  siswa = [], perkembangan = [] 
}) {
  
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
          img { width: 450px; height: 450px; border: 4px solid #1e293b; padding: 25px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          p { font-size: 20px; margin-top: 25px; color: #94a3b8; font-weight: bold; letter-spacing: 3px; }
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

  // === 1. LOGIKA ABSENSI HARI INI (DIPERBAIKI) ===
  const attendanceToday = useMemo(() => {
    const hariMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const now = new Date();
    const todayName = hariMap[now.getDay()];
    const todayStr = now.toISOString().slice(0, 10);
    const branchId = selectedBranch?.id;

    // Filter Target: Siswa yang jadwalnya ada kata "Selasa" (misal)
    const targetSiswa = (siswa || []).filter(s => {
      const matchBranch = !branchId || s.branch_id === branchId;
      const matchDay = s.hari && s.hari.toLowerCase().includes(todayName.toLowerCase());
      return matchBranch && matchDay;
    });

    // Filter Aktual: Cek di tabel perkembangan hari ini
    const actualHadir = (perkembangan || []).filter(p => {
      const isToday = p.tanggal && p.tanggal.startsWith(todayStr);
      const isTargetBranch = !branchId || p.branch_id === branchId || p.siswa?.branch_id === branchId;
      return isToday && isTargetBranch;
    });

    const targetCount = targetSiswa.length;
    const hadirCount = actualHadir.length;
    const persen = targetCount > 0 ? Math.min(100, Math.round((hadirCount / targetCount) * 100)) : 0;

    return { target: targetCount, hadir: hadirCount, percentage: persen };
  }, [siswa, perkembangan, selectedBranch]);

  // === 2. DATA KEUANGAN HARIAN ===
  const dailyData = useMemo(() => {
    const today = new Date();
    const currentMonthPrefix = today.toISOString().slice(0, 7);
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysArray = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = i < 10 ? `0${i}` : `${i}`;
      daysArray.push({ labelTanggal: `${i}`, dateKey: `${currentMonthPrefix}-${dayStr}`, Pemasukan: 0, Pengeluaran: 0 });
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

  // === 3. KONFIGURASI PIE CHART (WARNA & LEGEND KEMBALI) ===
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

  return (
    <div className="grid gap-lg">
      
      {/* KARTU STATISTIK ATAS */}
      {stats && overview && (
        <div className="grid grid-4" style={{ gap: '15px' }}>
          <StatCard title="Total Siswa" value={stats.siswa || 0} unit="Anak Aktif" icon="👨‍🎓" color="#3b82f6" />
          <StatCard title="Pemasukan" value={formatRupiah(overview.monthlyRevenue || 0)} unit="Bulan Ini" icon="📈" color="#10b981" />
          <StatCard title="Pengeluaran" value={formatRupiah(overview.monthlyExpense || 0)} unit="Bulan Ini" icon="📉" color="#ef4444" />
          <StatCard title="Estimasi Profit" value={formatRupiah((overview.monthlyRevenue || 0) - (overview.monthlyExpense || 0))} unit="Laba Bersih" icon="💎" color="#8b5cf6" />
        </div>
      )}

      {/* BARIS TENGAH: MONITORING & PROGRAM */}
      <div className="grid grid-3" style={{ gap: '20px', gridTemplateColumns: '1.2fr 1fr 1.5fr' }}>
         
         {/* MONITORING KEHADIRAN */}
         <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h4 style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '10px' }}>Kehadiran Hari Ini</h4>
            <div style={{ width: '100%', height: '160px', position: 'relative' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={[{v:100}]} innerRadius={55} outerRadius={70} dataKey="v" stroke="none" fill="rgba(255,255,255,0.05)" />
                     <Pie 
                        data={[{v: attendanceToday.percentage}, {v: 100 - attendanceToday.percentage}]} 
                        innerRadius={55} outerRadius={70} startAngle={90} endAngle={-270} dataKey="v" stroke="none"
                     >
                        <Cell fill="#10b981" />
                        <Cell fill="transparent" />
                     </Pie>
                  </PieChart>
               </ResponsiveContainer>
               <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{attendanceToday.percentage}%</div>
               </div>
            </div>
            <div style={{ fontSize: '12px', marginTop: '10px', fontWeight: 'bold' }}>
               {attendanceToday.hadir} dari {attendanceToday.target} Siswa Hadir
            </div>
         </div>

         {/* CETAK QR */}
         <div className="glass-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px' }}>
               <div style={{ background: '#fff', padding: '5px', borderRadius: '8px' }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${employeeBarcodeIn}`} width="60" />
               </div>
               <div style={{ background: '#fff', padding: '5px', borderRadius: '8px' }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${employeeBarcodeOut}`} width="60" />
               </div>
            </div>
            <button className="btn btn-primary btn-small" onClick={() => printQRCode('Absensi', employeeBarcodeIn, selectedBranch?.nama)}>🖨️ Cetak QR</button>
         </div>

         {/* PIE CHART PROGRAM (DENGAN NAMA & JUMLAH) */}
         <div className="glass-card">
           <h4 style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '15px' }}>Program Belajar</h4>
           <div style={{ width: '100%', height: '220px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={overview?.studentDistribution || []} innerRadius={50} outerRadius={65} paddingAngle={2} dataKey="value">
                   {(overview?.studentDistribution || []).map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                 </Pie>
                 <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '11px' }} />
                 <Legend layout="vertical" align="right" verticalAlign="middle" formatter={renderCustomLegend} wrapperStyle={{ paddingLeft: '10px', maxHeight: '200px', overflowY: 'auto' }} />
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="labelTanggal" stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `Rp${v/1000}k`} />
              <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px' }} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
              <Bar dataKey="Pemasukan" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
              <Line type="monotone" dataKey="Pemasukan" stroke="#10b981" strokeWidth={2} dot={false} />
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
