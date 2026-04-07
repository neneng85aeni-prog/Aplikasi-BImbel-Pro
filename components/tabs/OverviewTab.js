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
  siswa = [], perkembangan = [] // Tambahkan ini agar bisa hitung absen hari ini
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
          .footer { margin-top: 50px; font-size: 16px; color: #64748b; }
          @media print { body { height: auto; margin-top: 80px; } }
        </style>
      </head>
      <body onload="window.print()">
        <h1>SCAN ABSENSI ${title.toUpperCase()}</h1>
        <h2>${branchName || 'BIMBEL PRO PUSAT'}</h2>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${qrData}" alt="QR Code" />
        <p>KODE: ${qrData}</p>
        <div class="footer">Arahkan kamera HP Anda ke QR Code ini menggunakan aplikasi Bimbel Pro.</div>
      </body>
      </html>
    `
    const w = window.open('', '_blank', 'width=800,height=900')
    if (w) { w.document.write(html); w.document.close(); }
  }

  // === LOGIKA BARU: HITUNG ABSENSI HARI INI ===
  const attendanceToday = useMemo(() => {
    const hariMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayName = hariMap[new Date().getDay()];
    const todayStr = new Date().toISOString().slice(0, 10);
    const branchId = selectedBranch?.id;

    // 1. Siswa yang SEHARUSNYA datang hari ini (berdasarkan jadwal)
    const targetSiswa = (siswa || []).filter(s => {
      const matchBranch = !branchId || s.branch_id === branchId;
      const matchDay = s.hari?.includes(todayName);
      return matchBranch && matchDay;
    });

    // 2. Siswa yang SUDAH input perkembangan hari ini
    const actualHadir = (perkembangan || []).filter(p => {
      const isToday = p.tanggal?.startsWith(todayStr);
      const isTargetBranch = !branchId || p.siswa?.branch_id === branchId || p.branch_id === branchId;
      return isToday && isTargetBranch;
    });

    const targetCount = targetSiswa.length;
    const hadirCount = actualHadir.length;
    const persen = targetCount > 0 ? Math.round((hadirCount / targetCount) * 100) : 0;

    return [
      { name: 'Target Jadwal', value: targetCount, fill: 'rgba(255,255,255,0.1)' },
      { name: 'Aktual Hadir', value: hadirCount, fill: '#10b981' },
      { percentage: persen, target: targetCount, hadir: hadirCount }
    ];
  }, [siswa, perkembangan, selectedBranch]);

  // === DATA KEUANGAN HARIAN ===
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
        if (index !== -1) daysArray[index].Pemasukan += Number(p.nominal || 0);
      }
    });
    pengeluaran.forEach(p => {
      if (branchId && p.branch_id !== branchId) return;
      const tglFull = p.tanggal ? p.tanggal.slice(0, 10) : '';
      if (tglFull.startsWith(currentMonthPrefix)) {
        const index = daysArray.findIndex(d => d.tanggalFilter === tglFull);
        if (index !== -1) daysArray[index].Pengeluaran += Number(p.nominal || 0);
      }
    });
    return daysArray;
  }, [pembayaran, pengeluaran, selectedBranch]);

  // Warna Pie Chart
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];
  const renderCustomLegend = (value, entry) => (
    <span style={{ color: '#94a3b8', fontSize: '11px', marginLeft: '5px' }}>
      {value} <b style={{ color: '#fff' }}>({entry.payload.value})</b>
    </span>
  );

  return (
    <div className="grid gap-lg">
      
      {/* BARIS 1: KARTU STATISTIK */}
      {stats && overview && (
        <div className="grid grid-4" style={{ gap: '15px' }}>
          <StatCard title="Total Siswa" value={stats.siswa || 0} unit="Anak Aktif" icon="👨‍🎓" color="#3b82f6" />
          <StatCard title="Pendapatan" value={formatRupiah(overview.monthlyRevenue || 0)} unit="Bulan Ini" icon="📈" color="#10b981" />
          <StatCard title="Pengeluaran" value={formatRupiah(overview.monthlyExpense || 0)} unit="Bulan Ini" icon="📉" color="#ef4444" />
          <StatCard title="Estimasi Profit" value={formatRupiah((overview.monthlyRevenue || 0) - (overview.monthlyExpense || 0))} unit="Bulan Ini" icon="💎" color="#8b5cf6" />
        </div>
      )}

      {/* BARIS 2: MONITORING KEHADIRAN & QR CODE */}
      <div className="grid grid-3" style={{ gap: '20px', gridTemplateColumns: '1fr 1fr 1fr' }}>
         
         {/* KIRI: GAUGE KEHADIRAN HARI INI */}
         <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <h2 className="section-title" style={{ position: 'absolute', top: '15px', left: '20px' }}>Kehadiran Hari Ini</h2>
            <div style={{ width: '100%', height: '180px', marginTop: '30px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" barSize={15} data={[attendanceToday[1]]} startAngle={180} endAngle={180 - (attendanceToday[2].percentage * 1.8)}>
                  <RadialBar background clockWise dataKey="value" cornerRadius={10} fill="#10b981" />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ textAlign: 'center', marginTop: '-40px' }}>
               <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{attendanceToday[2].percentage}%</div>
               <div style={{ fontSize: '12px', color: '#94a3b8' }}>{attendanceToday[2].hadir} / {attendanceToday[2].target} Siswa Hadir</div>
            </div>
         </div>

         {/* TENGAH: QR CODE */}
         <div className="glass-card" style={{ textAlign: 'center' }}>
            <h4 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '15px' }}>Cetak QR Absensi</h4>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
               <div style={{ padding: '10px', background: 'white', borderRadius: '10px' }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${employeeBarcodeIn}`} alt="IN" style={{ width: '80px' }} />
               </div>
               <div style={{ padding: '10px', background: 'white', borderRadius: '10px' }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${employeeBarcodeOut}`} alt="OUT" style={{ width: '80px' }} />
               </div>
            </div>
            <button className="btn btn-primary btn-small" onClick={() => printQRCode('Absensi', employeeBarcodeIn, selectedBranch?.nama)} style={{ marginTop: '15px', width: '100%' }}>🖨️ Cetak Kertas Absen</button>
         </div>

         {/* KANAN: PIE CHART PROGRAM */}
         <div className="glass-card">
           <h4 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '10px' }}>Program Belajar</h4>
           <div style={{ width: '100%', height: '180px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={overview?.studentDistribution || []} innerRadius={40} outerRadius={55} paddingAngle={2} dataKey="value">
                   {(overview?.studentDistribution || []).map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                 </Pie>
                 <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
               </PieChart>
             </ResponsiveContainer>
           </div>
         </div>
      </div>

      {/* BARIS 3: GRAFIK HARIAN */}
      <div className="glass-card">
        <h2 className="section-title">Tren Arus Kas Harian</h2>
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="labelTanggal" stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} tickFormatter={(v) => `Rp${v/1000}k`} />
              <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px' }} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
              <Bar dataKey="Pemasukan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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
    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', borderLeft: `5px solid ${color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>{title}</div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', margin: '5px 0' }}>{value}</div>
        <div style={{ fontSize: '10px', color: color, fontWeight: 'bold' }}>{unit}</div>
      </div>
      <div style={{ fontSize: '30px', opacity: 0.5 }}>{icon}</div>
    </div>
  );
}
