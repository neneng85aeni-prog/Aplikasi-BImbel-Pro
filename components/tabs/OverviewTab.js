import { formatRupiah } from '../../lib/format'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export function OverviewTab({ overview, financeSummary, selectedBranch, employeeBarcodeIn, employeeBarcodeOut }) {
  return (
    <div className="grid gap-lg">
      <div className="grid grid-2">
         
         {/* KARTU 1: QR CODE ABSENSI (Menggunakan API aman tanpa library tambahan) */}
         <div className="glass-card" style={{ textAlign: 'center' }}>
            <h2 className="section-title">QR Code Absensi Karyawan</h2>
            <p className="text-muted" style={{ marginBottom: '20px', fontSize: '14px' }}>
              Cabang: <b>{selectedBranch?.nama || 'Pusat'}</b><br/>
              Scan barcode ini menggunakan HP karyawan.
            </p>
            <div className="grid grid-2" style={{ gap: '20px' }}>
               <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                 <h4 style={{ marginBottom: '10px', color: '#10b981', fontWeight: 'bold' }}>Masuk</h4>
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${employeeBarcodeIn}`} alt="QR Masuk" style={{ borderRadius: '8px', mixBlendMode: 'multiply' }} />
                 <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748b', wordBreak: 'break-all' }}>{employeeBarcodeIn}</div>
               </div>
               <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                 <h4 style={{ marginBottom: '10px', color: '#ef4444', fontWeight: 'bold' }}>Pulang</h4>
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${employeeBarcodeOut}`} alt="QR Pulang" style={{ borderRadius: '8px', mixBlendMode: 'multiply' }} />
                 <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748b', wordBreak: 'break-all' }}>{employeeBarcodeOut}</div>
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
