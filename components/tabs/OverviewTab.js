import { formatRupiah } from '../../lib/format'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export function OverviewTab({ overview, financeSummary, selectedBranch, employeeBarcodeIn, employeeBarcodeOut }) {
  
  // Fungsi Canggih untuk Print QR Code Seukuran A4
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

  return (
    <div className="grid gap-lg">
      <div className="grid grid-2">
         
         {/* KARTU 1: QR CODE ABSENSI (Sekarang Bisa Di-Print) */}
         <div className="glass-card" style={{ textAlign: 'center' }}>
            <h2 className="section-title">QR Code Absensi Karyawan</h2>
            <p className="text-muted" style={{ marginBottom: '20px', fontSize: '14px' }}>
              Cabang: <b>{selectedBranch?.nama || 'Pusat'}</b><br/>
              Cetak dan tempel barcode ini di cabang Anda.
            </p>
            <div className="grid grid-2" style={{ gap: '20px' }}>
               <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                 <h4 style={{ marginBottom: '10px', color: '#10b981', fontWeight: 'bold' }}>QR Masuk</h4>
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${employeeBarcodeIn}`} alt="QR Masuk" style={{ borderRadius: '8px', mixBlendMode: 'multiply' }} />
                 <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748b', wordBreak: 'break-all', marginBottom: '15px' }}>{employeeBarcodeIn}</div>
                 <button className="btn btn-primary btn-small" onClick={() => printQRCode('Masuk', employeeBarcodeIn, selectedBranch?.nama)} style={{ width: '100%' }}>🖨️ Print A4</button>
               </div>
               <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                 <h4 style={{ marginBottom: '10px', color: '#10b981', fontWeight: 'bold' }}>QR Pulang</h4>
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${employeeBarcodeOut}`} alt="QR Pulang" style={{ borderRadius: '8px', mixBlendMode: 'multiply' }} />
                 <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748b', wordBreak: 'break-all', marginBottom: '15px' }}>{employeeBarcodeOut}</div>
                 <button className="btn btn-secondary btn-small" onClick={() => printQRCode('Pulang', employeeBarcodeOut, selectedBranch?.nama)} style={{ width: '100%' }}>🖨️ Print A4</button>
               </div>
            </div>
         </div>

         {/* KARTU 2: GRAFIK PERFORMA CABANG */}
         <div className="glass-card">
           <h2 className="section-title">Grafik Performa Antar Cabang</h2>
           <p className="text-muted" style={{ marginBottom: '20px', fontSize: '13px' }}>Perbandingan Pemasukan & Pengeluaran Total</p>
           
           {financeSummary.byBranch.length > 0 ? (
             <div style={{ width: '100%', height: '280px' }}>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={financeSummary.byBranch} margin={{ top: 5, right: 10, left: 15, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                   <XAxis dataKey="nama" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `Rp${val/1000}k`} tickLine={false} axisLine={false} />
                   <Tooltip 
                     formatter={(value) => formatRupiah(value)} 
                     cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} 
                     contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }} 
                     itemStyle={{ color: '#fff' }}
                   />
                   <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} iconType="circle" />
                   <Bar dataKey="pemasukan" name="Pemasukan" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} />
                   <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={50} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
           ) : (
             <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
               Belum ada data cabang untuk ditampilkan.
             </div>
           )}
         </div>

      </div>
    </div>
  )
}
