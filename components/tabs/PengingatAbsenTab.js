import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function PengingatAbsenTab({ siswa = [], perkembangan = [] }) {
  const [jumlahBolos, setJumlahBolos] = useState(3)
  const [siswaBolosList, setSiswaBolosList] = useState([])
  const [loading, setLoading] = useState(false)
  const [pesanStatus, setPesanStatus] = useState('')
  const [logPeringatan, setLogPeringatan] = useState(new Map())

  // Ambil data log histori dari wa_log agar kita tahu siapa yang sudah diingatkan
  const fetchWaLog = async () => {
    const { data, error } = await supabase
      .from('wa_log')
      .select('no_wa, created_at')
      .eq('kategori', 'peringatan_bolos_3x')
      .order('created_at', { ascending: false })

    if (!error && data) {
      const mapLog = new Map()
      data.forEach(log => {
        if (!mapLog.has(log.no_wa)) {
          mapLog.set(log.no_wa, new Date(log.created_at).toLocaleDateString('id-ID'))
        }
      })
      setLogPeringatan(mapLog)
    }
  }

  useEffect(() => {
    fetchWaLog()
  }, [])

  // Efek untuk menghitung ulang daftar siswa bolos saat filter jumlah bolos diubah
  useEffect(() => {
    if (!Array.isArray(siswa) || !Array.isArray(perkembangan) || siswa.length === 0) return

    const formatTanggalLokal = (dateObj) => {
      const tahun = dateObj.getFullYear()
      const bulan = String(dateObj.getMonth() + 1).padStart(2, '0')
      const tanggal = String(dateObj.getDate()).padStart(2, '0')
      return `${tahun}-${bulan}-${tanggal}`
    }

    const normalisasiHari = (nilai) => {
      const teks = String(nilai || '').trim().toLowerCase()
      const mapHari = {
        minggu: 'minggu', ahad: 'minggu', senin: 'senin', selasa: 'selasa',
        rabu: 'rabu', kamis: 'kamis', jumat: 'jumat', "jum'at": 'jumat', sabtu: 'sabtu'
      }
      return mapHari[teks] || teks
    }

    const getNamaHari = (dateObj) => {
      const namaHari = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']
      return namaHari[dateObj.getDay()]
    }

    const normalisasiNomorWa = (nomor) => {
      let hasil = String(nomor || '').replace(/\D/g, '')
      if (!hasil) return ''
      if (hasil.startsWith('0')) hasil = `62${hasil.slice(1)}`
      if (hasil.startsWith('8')) hasil = `62${hasil}`
      return hasil
    }

    const ambilJadwalTerakhir = (hariJadwalSiswa, jumlah) => {
      const jadwalTerakhir = []
      const d = new Date()
      d.setDate(d.getDate() - 1) // Mulai dari kemarin

      let mundur = 0
      while (jadwalTerakhir.length < jumlah && mundur < 60) {
        const namaHari = getNamaHari(d)
        if (hariJadwalSiswa.includes(namaHari)) {
          jadwalTerakhir.push(formatTanggalLokal(d))
        }
        d.setDate(d.getDate() - 1)
        mundur += 1
      }
      return jadwalTerakhir
    }

    const perkembanganSet = new Set(
      perkembangan
        .filter((p) => p?.siswa_id && p?.tanggal)
        .map((p) => `${String(p.siswa_id)}|${String(p.tanggal).slice(0, 10)}`)
    )

    const hasilFilter = []

    for (const s of siswa) {
      if (!s?.id || String(s.status || '').toLowerCase() === 'nonaktif') continue

      const nomorWaOrtu = normalisasiNomorWa(s.no_wa_ortu || s.wa_ortu || s.no_hp || s.no_wa)
      if (!nomorWaOrtu) continue

      const hariJadwalSiswa = String(s.hari || '').split(',').map(normalisasiHari).filter(Boolean)
      if (hariJadwalSiswa.length === 0) continue

      const jadwalTerakhir = ambilJadwalTerakhir(hariJadwalSiswa, jumlahBolos)
      if (jadwalTerakhir.length < jumlahBolos) continue

      const tidakHadirSemua = jadwalTerakhir.every((tgl) => !perkembanganSet.has(`${String(s.id)}|${tgl}`))

      if (tidakHadirSemua) {
        hasilFilter.push({
          ...s,
          nomorWaFormat: nomorWaOrtu,
          detailAbsen: jadwalTerakhir.join(', ')
        })
      }
    }

    setSiswaBolosList(hasilFilter)
  }, [jumlahBolos, siswa, perkembangan])

  // Kirim Tunggal (Satu Siswa)
  const kirimPeringatanTunggal = async (s) => {
    if (!window.confirm(`Kirim pengingat untuk ananda ${s.nama}?`)) return
    
    setLoading(true)
    const pesanText = `Assalamu'alaikum Ayah/Bunda, kami perhatikan ananda *${s.nama}* tidak hadir dalam ${jumlahBolos} jadwal berturut-turut (${s.detailAbsen}). Apakah ada kendala atau ada yang bisa kami bantu? Mohon informasinya ya, terima kasih.`
    
    try {
      // 1. Masukkan ke wa_queue
      await supabase.from('wa_queue').insert([{ no_wa: s.nomorWaFormat, pesan: pesanText, status: 'pending' }])
      // 2. Masukkan ke wa_log
      await supabase.from('wa_log').insert([{ no_wa: s.nomorWaFormat, kategori: 'peringatan_bolos_3x' }])
      
      setPesanStatus(`✅ Sukses menambahkan antrean WA untuk ${s.nama}`)
      fetchWaLog()
    } catch (err) {
      setPesanStatus('❌ Gagal mengirim pengingat')
    } finally {
      setLoading(false)
      setTimeout(() => setPesanStatus(''), 3000)
    }
  }

  // Kirim Masal (Semua yang Terfilter)
  const kirimPeringatanMasal = async () => {
    if (siswaBolosList.length === 0) return
    if (!window.confirm(`Apakah Anda yakin ingin memasukkan SEMUA (${siswaBolosList.length}) siswa terfilter ke antrean wa_queue?`)) return

    setLoading(true)
    const queueData = []
    const logData = []

    siswaBolosList.forEach(s => {
      const pesanText = `Assalamu'alaikum Ayah/Bunda, kami perhatikan ananda *${s.nama}* tidak hadir dalam ${jumlahBolos} jadwal berturut-turut (${s.detailAbsen}). Apakah ada kendala atau ada yang bisa kami bantu? Mohon informasinya ya, terima kasih.`
      queueData.push({ no_wa: s.nomorWaFormat, pesan: pesanText, status: 'pending' })
      logData.push({ no_wa: s.nomorWaFormat, kategori: 'peringatan_bolos_3x' })
    })

    try {
      if (queueData.length > 0) {
        await supabase.from('wa_queue').insert(queueData)
        await supabase.from('wa_log').insert(logData)
        setPesanStatus(`🚀 Berhasil memasukkan ${queueData.length} siswa ke wa_queue secara masal!`)
        fetchWaLog()
      }
    } catch (err) {
      setPesanStatus('❌ Gagal mengeksekusi pengiriman masal')
    } finally {
      setLoading(false)
      setTimeout(() => setPesanStatus(''), 4000)
    }
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="glass-card" style={{ marginBottom: '20px', padding: '20px' }}>
        <h2>🔔 Panel Pengingat Absen Siswa</h2>
        <p className="text-muted" style={{ marginBottom: '20px' }}>
          Cari dan saring data siswa yang tidak hadir tanpa konfirmasi berdasarkan jumlah pertemuan berturut-turut.
        </p>

        {pesanStatus && (
          <div style={{ padding: '12px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', marginBottom: '15px' }}>
            {pesanStatus}
          </div>
        )}

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div className="form-group" style={{ maxWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Minimal Tidak Hadir (Kali):</label>
            <input 
              type="number" 
              min="1"
              value={jumlahBolos} 
              onChange={(e) => setJumlahBolos(Math.max(1, parseInt(e.target.value) || 1))} 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '16px', fontWeight: 'bold' }} 
            />
          </div>

          {siswaBolosList.length > 0 && (
            <button 
              className="btn btn-primary" 
              onClick={kirimPeringatanMasal} 
              disabled={loading}
              style={{ height: '45px', background: '#eab308', color: '#000', fontWeight: 'bold' }}
            >
              🚀 Masukkan Semua ({siswaBolosList.length}) ke wa_queue
            </button>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>Siswa Terdeteksi Bolos ({siswaBolosList.length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                <th style={{ padding: '12px' }}>Nama Siswa</th>
                <th style={{ padding: '12px' }}>Jadwal Hari</th>
                <th style={{ padding: '12px' }}>Tanggal Kosong</th>
                <th style={{ padding: '12px' }}>Histori Pengingat</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {siswaBolosList.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                    🎉 Bersih! Tidak ada siswa yang bolos sebanyak {jumlahBolos} kali berturut-turut.
                  </td>
                </tr>
              ) : (
                siswaBolosList.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', id: 'row-siswa' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{s.nama}</td>
                    <td style={{ padding: '12px', color: '#cbd5e1' }}>{s.hari}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#ef4444' }}>{s.detailAbsen}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      {logPeringatan.has(s.nomorWaFormat) ? (
                        <span style={{ color: '#22c55e', background: 'rgba(34, 197, 94, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                          Sudah Diingatkan ({logPeringatan.get(s.nomorWaFormat)})
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Belum Pernah</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button 
                        className="btn btn-secondary btn-small" 
                        disabled={loading} 
                        onClick={() => kirimPeringatanTunggal(s)}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        💬 Kirim WA
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
