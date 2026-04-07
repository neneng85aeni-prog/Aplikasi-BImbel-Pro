ini kode overview,tolong edit sesuai yang kita bahas ya : import { useMemo } from 'react'
import { formatRupiah } from '../../lib/format'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

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
          img { width: 450px; height: 450px; border: 4px solid #1e293b; padding: 25px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          p { font-size: 20px; margin-top: 25px; color: #94a3b8; font-weight: bold; letter-spacing: 3px; }
          .footer { margin-top: 50px; font-size: 16px; color: #64748b; }
          @media print {
            body { height: auto; margin-top: 80px; }
          }
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
    if (w) {
      w.document.write(html)
      w.document.close()
    } else {
      alert('Popup diblokir browser! Tolong izinkan popup untuk mencetak.')
    }
  }

  // === MENGHITUNG DATA HARIAN (BULAN BERJALAN) ===
  const dailyData = useMemo(() => {
    const today = new Date();
    const currentMonthPrefix = today.toISOString().slice(0, 7);
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    const daysArray = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dayString = i < 10 ? `0${i}` : `${i}`;
      daysArray.push({
        tanggalFilter: `${currentMonthPrefix}-${dayString}`,
        labelTanggal: `${i}`,
        Pemasukan: 0,
        Pengeluaran: 0
      });
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

  // === DATA PIE CHART (SEBARAN PROGRAM) ===
  const programData = overview?.studentDistribution || [
    { name: 'Belum Ada Data', value: 1 } // Fallback jika data kosong
  ]; 
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="grid gap-lg">
      
      {/* BARIS 1: KARTU STATISTIK CEPAT (QUICK STATS) */}
      {stats && overview && (
        <div className="grid grid-4" style={{ gap: '15px' }}>
          <StatCard title="Total Siswa Aktif" value={stats.siswa || 0} unit="Anak" icon="👨‍🎓" color="#3b82f6" />
          <StatCard title="Pendapatan" value={formatRupiah(overview.monthlyRevenue || 0)} unit="Bulan Ini" icon="📈" color="#10b981" />
          <StatCard title="Pengeluaran" value={formatRupiah(overview.monthlyExpense || 0)} unit="Bulan Ini" icon="📉" color="#ef4444" />
          <StatCard title="Estimasi Profit Bersih" value={formatRupiah((overview.monthlyRevenue || 0) - (overview.monthlyExpense || 0))} unit="Bulan Ini" icon="💎" color="#8b5cf6" />
        </div>
      )}

      {/* BARIS 2: QR CODE & PIE CHART */}
      <div className="grid grid-2" style={{ gap: '20px', gridTemplateColumns: '1fr 1fr' }}>
         
         {/* KARTU KIRI: QR CODE ABSENSI */}
         <div className="glass-card" style={{ textAlign: 'center' }}>
            <h2 className="section-title">QR Code Kehadiran Pegawai</h2>
            <p className="text-muted" style={{ marginBottom: '20px', fontSize: '13px' }}>
              Cabang: <b>{selectedBranch?.nama || 'Semua Cabang'}</b>
            </p>
            <div className="grid grid-2" style={{ gap: '15px' }}>
               <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                 <h4 style={{ marginBottom: '10px', color: '#10b981', fontWeight: 'bold' }}>Masuk</h4>
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${employeeBarcodeIn}`} alt="QR Masuk" style={{ borderRadius: '8px', background: '#fff', padding: '5px' }} />
                 <button className="btn btn-primary btn-small" onClick={() => printQRCode('Masuk', employeeBarcodeIn, selectedBranch?.nama)} style={{ width: '100%', marginTop: '15px' }}>🖨️ Cetak</button>
               </div>
               <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                 <h4 style={{ marginBottom: '10px', color: '#ef4444', fontWeight: 'bold' }}>Pulang</h4>
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${employeeBarcodeOut}`} alt="QR Pulang" style={{ borderRadius: '8px', background: '#fff', padding: '5px' }} />
                 <button className="btn btn-secondary btn-small" onClick={() => printQRCode('Pulang', employeeBarcodeOut, selectedBranch?.nama)} style={{ width: '100%', marginTop: '15px' }}>🖨️ Cetak</button>
               </div>
            </div>
         </div>

         {/* KARTU KANAN: PIE CHART (SEBARAN PROGRAM) */}
         <div className="glass-card">
           <h2 className="section-title">Komposisi Program Belajar</h2>
           <p className="text-muted" style={{ marginBottom: '10px', fontSize: '13px' }}>
             Distribusi siswa aktif per program
           </p>
           <div style={{ width: '100%', height: '230px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={programData}
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {programData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip 
                   contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                   itemStyle={{ color: '#fff' }}
                 />
                 <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
               </PieChart>
             </ResponsiveContainer>
           </div>
         </div>

      </div>

      {/* BARIS 3: GRAFIK HARIAN (COMPOSED CHART MAS HAMZAH) */}
      <div className="glass-card">
        <h2 className="section-title">Tren Arus Kas Harian (Bulan Ini)</h2>
        <p className="text-muted" style={{ marginBottom: '20px', fontSize: '13px' }}>
          Pergerakan transaksi <b>{selectedBranch?.nama || 'Semua Cabang'}</b> dari tanggal 1 hingga akhir bulan.
        </p>
        
        <div style={{ width: '100%', height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dailyData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              
              <XAxis dataKey="labelTanggal" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `Rp${val/1000}k`} tickLine={false} axisLine={false} />
              
              <Tooltip 
                labelFormatter={(label) => `Tanggal ${label}`}
                formatter={(value) => formatRupiah(value)} 
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} 
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} 
                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} iconType="circle" />
              
              <Bar dataKey="Pemasukan" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={30} />

              <Line type="monotone" dataKey="Pemasukan" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Pengeluaran" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}

// === KOMPONEN KECIL: KARTU STATISTIK ===
function StatCard({ title, value, unit, icon, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', borderLeft: `5px solid ${color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</div>
        <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff' }}>{value}</div>
        <div style={{ fontSize: '11px', color: color, marginTop: '5px', fontWeight: 'bold' }}>{unit}</div>
      </div>
      <div style={{ fontSize: '35px', opacity: 0.8 }}>{icon}</div>
    </div>
  );
}
