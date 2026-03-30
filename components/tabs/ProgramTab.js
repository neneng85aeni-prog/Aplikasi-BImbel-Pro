import { useState } from 'react'
import { formatRupiah } from '../../lib/format'
import { INITIAL_PROGRAM_FORM } from '../../lib/constants'

export function ProgramTab({ programForm, setProgramForm, programs, onSubmit, onReset, onEdit, onDelete }) {
  
  // STATE LOKAL UNTUK PENCARIAN
  const [searchQuery, setSearchQuery] = useState('');

  // FILTER PENCARIAN PROGRAM
  const filteredPrograms = programs.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.nama?.toLowerCase().includes(q) ||
      item.deskripsi?.toLowerCase().includes(q) ||
      String(item.nominal).includes(q)
    );
  });

  return (
    // MENGGUNAKAN FLEXBOX: Form dapat 1 bagian, Tabel dapat 2 bagian (Lebih Lebar)
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
      
      {/* KIRI: FORM INPUT (Proporsional, tidak terlalu kecil) */}
      <div className="glass-card" style={{ flex: '1 1 300px', maxWidth: '100%' }}>
        <h2 className="section-title">Form Program</h2>
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <label>Nama Program</label>
            <input 
              type="text" 
              value={programForm.nama} 
              onChange={(e) => setProgramForm({ ...programForm, nama: e.target.value })} 
              required 
            />
          </div>
          <div className="form-row">
            <label>Deskripsi (Opsional)</label>
            <textarea 
              value={programForm.deskripsi || ''} 
              onChange={(e) => setProgramForm({ ...programForm, deskripsi: e.target.value })} 
              rows="3"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'inherit', border: '1px solid rgba(255,255,255,0.2)' }}
            />
          </div>
          <div className="form-row">
            <label>Biaya / Nominal (Rp)</label>
            <input 
              type="number" 
              value={programForm.nominal} 
              onChange={(e) => setProgramForm({ ...programForm, nominal: e.target.value })} 
              required 
            />
          </div>
          <div className="btn-row" style={{ marginTop: '20px' }}>
            <button className="btn btn-primary" type="submit">{programForm.id ? 'Update Program' : 'Simpan Program'}</button>
            <button className="btn btn-secondary" type="button" onClick={() => onReset(INITIAL_PROGRAM_FORM)}>Batal</button>
          </div>
        </form>
      </div>

      {/* KANAN: TABEL DAFTAR PROGRAM (Lebih Lebar) */}
      <div className="glass-card" style={{ flex: '2 1 550px', maxWidth: '100%' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Daftar Program Bimbel</h2>
          
          {/* KOLOM PENCARIAN */}
          <input 
            type="text" 
            placeholder="🔍 Cari program..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              padding: '10px 14px', 
              borderRadius: '8px', 
              width: '100%', 
              maxWidth: '300px',
              border: '1px solid rgba(255,255,255,0.2)', 
              background: 'rgba(255,255,255,0.05)', 
              color: 'inherit',
              fontSize: '14px'
            }}
          />
        </div>

        <div className="table-wrap">
          <table style={{ minWidth: '500px' }}>
            <thead>
              <tr>
                <th>Nama Program</th>
                <th>Deskripsi</th>
                <th>Biaya</th>
                <th style={{ width: '140px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrograms.map((item) => (
                <tr key={item.id}>
                  <td><b>{item.nama}</b></td>
                  <td className="text-muted">{item.deskripsi || '-'}</td>
                  <td style={{ fontWeight: 'bold', color: '#10b981' }}>{formatRupiah(item.nominal)}</td>
                  <td>
                    {/* TOMBOL EDIT & HAPUS MENYAMPING (HORIZONTAL) */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
                      <button className="btn btn-secondary btn-small" onClick={() => onEdit(item)}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => onDelete(item.id, item.nama)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPrograms.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    {searchQuery ? 'Data pencarian tidak ditemukan.' : 'Belum ada data program.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  )
}
