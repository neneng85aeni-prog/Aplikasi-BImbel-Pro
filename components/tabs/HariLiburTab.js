import React, { useState, useEffect } from 'react'
// Sesuaikan path import supabase jika berbeda (misal: '../../lib/supabase')
import { supabase } from '../../lib/supabase' 

export function HariLiburTab() {
  const [liburList, setLiburList] = useState([])
  const [tanggal, setTanggal] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [loading, setLoading] = useState(false)
  const [pesan, setPesan] = useState('')

  useEffect(() => {
    fetchLibur()
  }, [])

  const fetchLibur = async () => {
    const { data, error } = await supabase
      .from('hari_libur')
      .select('*')
      .order('tanggal', { ascending: false })
    
    if (!error && data) {
      setLiburList(data)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!tanggal || !keterangan) {
      setPesan('⚠️ Tanggal dan Keterangan wajib diisi!')
      return
    }

    setLoading(true)
    const { error } = await supabase
      .from('hari_libur')
      .insert([{ tanggal, keterangan }])
    setLoading(false)

    if (error) {
      setPesan('❌ Gagal menyimpan data. Pastikan tanggal belum pernah diinput.')
    } else {
      setPesan('✅ Hari libur berhasil ditambahkan!')
      setTanggal('')
      setKeterangan('')
      fetchLibur()
    }

    setTimeout(() => setPesan(''), 3000)
  }

  const handleDelete = async (id, ket) => {
    if (!window.confirm(`Yakin ingin menghapus hari libur: ${ket}?`)) return
    
    const { error } = await supabase.from('hari_libur').delete().eq('id', id)
    if (!error) {
      fetchLibur()
    }
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="glass-card" style={{ marginBottom: '20px', padding: '20px' }}>
        <h2 style={{ marginBottom: '15px' }}>🗓️ Input Hari Libur (Tanggal Merah)</h2>
        <p className="text-muted" style={{ marginBottom: '20px' }}>
          Siswa tidak akan dianggap bolos jika jadwal absen mereka bertepatan dengan tanggal di bawah ini.
        </p>

        {pesan && (
          <div style={{ padding: '10px', background: pesan.includes('✅') ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: 'white', borderRadius: '8px', marginBottom: '15px' }}>
            {pesan}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Tanggal Libur</label>
            <input 
              type="date" 
              value={tanggal} 
              onChange={(e) => setTanggal(e.target.value)} 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }} 
            />
          </div>
          <div style={{ flex: 2, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Keterangan (Cth: Libur Idul Fitri)</label>
            <input 
              type="text" 
              placeholder="Masukkan keterangan libur..." 
              value={keterangan} 
              onChange={(e) => setKeterangan(e.target.value)} 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }} 
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '10px 20px', height: '42px' }}>
            {loading ? 'Menyimpan...' : '➕ Tambah Libur'}
          </button>
        </form>
      </div>

      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>Daftar Hari Libur</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '12px' }}>Tanggal</th>
                <th style={{ padding: '12px' }}>Keterangan</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {liburList.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Belum ada data hari libur.</td>
                </tr>
              ) : (
                liburList.map((libur) => (
                  <tr key={libur.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px' }}>{libur.tanggal}</td>
                    <td style={{ padding: '12px' }}>{libur.keterangan}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button className="btn btn-danger btn-small" onClick={() => handleDelete(libur.id, libur.keterangan)}>
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
