import { useMemo } from 'react'
import { formatRupiah } from '../../lib/format'
import { 
  ComposedChart, 
  BarChart, // <--- BARU (Tambahkan ini)
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
  Cell 
} from 'recharts'

export function OverviewTab({ stats, overview, financeSummary, selectedBranch, employeeBarcodeIn, employeeBarcodeOut, pembayaran = [], pengeluaran = [], siswa = [], perkembangan = [] }) {
  
  // === 1. FUNGSI PRINT / SAVE PDF ===
  function printQRCode(title, qrData, branchName) {
    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Cetak QR ${title}</title>
        <style>
          body { font-family: 'Arial', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
          .container { border: 2px dashed #ccc; padding: 50px; border-radius: 20px; }
          h1 { font-size: 54px; margin-bottom: 10px; color: #1e293b; }
          h2 { font-size: 32px; color: #64748b; margin-bottom: 40px; }
          img { width: 500px; height: 500px; border: 5px solid #000; padding: 20px; border-radius: 20px; }
          .code-text { font-size: 24px; margin-top: 30px; font-weight: bold; color: #1e293b; }
          @media print { @page { size: A4; margin: 0; } body { height: 95vh; } }
        </style>
      </head>
      <body onload="window.print()">
        <div class="container">
          <h1>ABSENSI ${title.toUpperCase()}</h1>
          <h2>${branchName || 'BIMBEL PRO PUSAT'}</h2>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${qrData}" />
          <div class="code-text">KODE: ${qrData}</div>
        </div>
      </body>
      </html>
    `
    const w = window.open('', '_blank');
    w?.document.write(html); w?.document.close();
  }

  // === LOGIKA HITUNG KPI KEHADIRAN (VERSI SUPER AMAN) ===
  const attendanceKPI = useMemo(() => {
    // 1. Setel Waktu ke WIB (Waktu Indonesia Barat) biar akurat
    const wibTime = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
    const hariMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    // getUTCDay() digunakan karena kita sudah menambahkan +7 Jam (WIB) secara manual
    const todayName = hariMap[wibTime.getUTCDay()]; 
    const todayStr = wibTime.toISOString().slice(0, 10); 
    
    const branchId = selectedBranch?.id;

    // 2. Hitung Target: Siswa yang jadwalnya hari ini
    const targetSiswa = (siswa || []).filter(s => {
      const matchBranch = !branchId || s.branch_id === branchId;
      
      let matchDay = false;
      // Cek dengan aman: Apakah datanya Array atau Teks biasa?
      if (Array.isArray(s.hari)) {
        matchDay = s.hari.some(h => h?.toLowerCase() === todayName.toLowerCase());
      } else if (typeof s.hari === 'string') {
        matchDay = s.hari.toLowerCase().includes(todayName.toLowerCase());
      }
      
      return matchBranch && matchDay;
    });

    // 3. Hitung Aktual: Siswa yang sudah diabsen hari ini
    const actualHadir = (perkembangan || []).filter(p => {
      const isToday = p.tanggal && p.tanggal.startsWith(todayStr);
      const isTargetBranch = !branchId || p.branch_id === branchId || p.siswa?.branch_id === branchId;
      return isToday && isTargetBranch;
    });

    return [
      {
        name: todayName, // Akan memunculkan "Selasa"
        Target: targetSiswa.length,
        Aktual: actualHadir.length
      }
    ];
  }, [siswa, perkembangan, selectedBranch]);

  // === 3. DATA KEUANGAN HARIAN ===
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

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];
  
  const renderCustomLegend = (value, entry) => (
    <span style={{ color: '#94a3b8', fontSize: '11px', marginLeft: '5px' }}>
      {value} <b style={{ color: '#fff' }}>( {entry.payload.value} )</b>
    </span>
  );

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

      {/* BARIS 2: KPI, QR & PIE (UBAH MENJADI GRID 3) */}
      <div className="grid grid-3" style={{ gap: '20px', gridTemplateColumns: '1fr 0.9fr 1.8fr' }}>
         
         {/* KARTU 1: KPI KEHADIRAN (BARU) */}
         <div className="glass-card">
            <h2 className="section-title" style={{ fontSize: '14px' }}>KPI Kehadiran Siswa</h2>
            <p className="text-muted" style={{ fontSize: '11px', marginBottom: '15px' }}>Target Jadwal vs Aktual Datang</p>
            <div style={{ width: '100%', height: '180px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceKPI} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8" />
                     <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8" />
                     <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} />
                     <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                     <Bar dataKey="Target" fill="rgba(59, 130, 246, 0.3)" radius={[4, 4, 0, 0]} barSize={40} />
                     <Bar dataKey="Aktual" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* KARTU 2: QR ABSENSI */}
         <div className="glass-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 className="section-title" style={{ fontSize: '14px', marginBottom: '15px' }}>QR Absensi</h2>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
               
               {/* QR MASUK */}
               <div style={{ background: '#fff', padding: '10px', borderRadius: '12px', width: '45%' }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${employeeBarcodeIn}`} width="100%" />
                  <div style={{ color: '#000', fontSize: '10px', fontWeight: 'bold', marginTop: '5px' }}>MASUK</div>
                  <button 
                     className="btn btn-primary btn-small" 
                     onClick={() => printQRCode('Masuk', employeeBarcodeIn, selectedBranch?.nama)}
                     style={{ marginTop: '10px', width: '100%', fontSize: '10px', padding: '5px' }}
                  >
                     🖨️ Cetak
                  </button>
               </div>

               {/* QR PULANG */}
               <div style={{ background: '#fff', padding: '10px', borderRadius: '12px', width: '45%' }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${employeeBarcodeOut}`} width="100%" />
                  <div style={{ color: '#000', fontSize: '10px', fontWeight: 'bold', marginTop: '5px' }}>PULANG</div>
                  <button 
                     className="btn btn-secondary btn-small" 
                     onClick={() => printQRCode('Pulang', employeeBarcodeOut, selectedBranch?.nama)}
                     style={{ marginTop: '10px', width: '100%', fontSize: '10px', padding: '5px', background: '#ef4444', color: 'white', border: 'none' }}
                  >
                     🖨️ Cetak
                  </button>
               </div>

            </div>
         </div>

         {/* KARTU 3: PIE CHART PROGRAM */}
         <div className="glass-card">
           <h2 className="section-title" style={{ fontSize: '14px' }}>Komposisi Program</h2>
           <div style={{ width: '100%', height: '240px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie 
                    data={overview?.studentDistribution || []} 
                    cx="30%" 
                    cy="50%" 
                    innerRadius={65} 
                    outerRadius={85} 
                    paddingAngle={2} 
                    dataKey="value"
                 >
                   {(overview?.studentDistribution || []).map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(0,0,0,0.2)" />)}
                 </Pie>
                 <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '11px' }} />
                 <Legend 
                    layout="vertical" 
                    align="right" 
                    verticalAlign="middle" 
                    formatter={renderCustomLegend} 
                    wrapperStyle={{ width: '60%', paddingLeft: '10px', maxHeight: '220px', overflowY: 'auto' }} 
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
