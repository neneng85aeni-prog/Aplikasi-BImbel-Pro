import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function PengingatAbsenTab({ siswa = [], perkembangan = [] }) {
  const [jumlahBolos, setJumlahBolos] = useState(3)
  const [siswaBolosList, setSiswaBolosList] = useState([])
  const [loading, setLoading] = useState(false)
  const [pesanStatus, setPesanStatus] = useState('')
  const [logPeringatan, setLogPeringatan] = useState(new Map())

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
      d.setDate(d.getDate() - 1)

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
      if (!s?.id) continue

      const nomorWaOrtu = normalisasiNomorWa(s.no_wa_ortu || s.wa_ortu || s.no_hp || s.no_wa)
      if (!nomorWaOrtu) continue

      const hariJadwalSiswa = String(s.hari || '').split(',').map(normalisasiHari).filter(Boolean)
      if (hariJadwalSiswa.length === 0) continue

      const jadwalTerakhir = ambilJadwalTerakhir(hariJadwalSiswa, jumlahBolos)
      if (jadwalTerakhir.length < jumlahBolos) continue

      const tidakHadirSemua = jadwalTerakhir.every((tgl) => !perkembanganSet.has(`${String(s.id)}|${tgl}`))

      if (tidakHadirSemua) {
        // --- KODE DIAGNOSTIK: KITA INTIP ISI STATUSNYA ---
        const cekNamaKolomStatus = s.status_siswa !== undefined ? 'status_siswa' : (s.status !== undefined ? 'status' : 'tidak_ketemu');
        const isiStatusAsli = s.status_siswa || s.status || 'KOSONG/UNDEFINED';

        hasilFilter.push({
          ...s,
          nomorWaFormat: nomorWaOrtu,
          detailAbsen: jadwalTerakhir.join(', '),
          // Taruh info penyelidikan ke dalam objek siswa
          debugNamaKolom: cekNamaKolomStatus,
          debugIsiStatus: String(isiStatusAsli)
        })
      }
    }

    setSiswaBolosList(hasilFilter)
  }, [jumlahBolos, siswa, perkembangan])

  const kirimPeringatanTunggal = async (s) => {
    if (!window.confirm(`Kirim pengingat untuk ananda ${s.nama}?`)) return
    setLoading(true)
    const pesanText = `Assalamu'alaikum Ayah/Bunda, kami perhatikan ananda *${s.nama}* tidak hadir dalam ${jumlahBolos} jadwal berturut-turut (${s.detailAbsen}).`
    try {
      await supabase.from('wa_queue').insert([{ no_wa: s.nomorWaFormat, pesan: pesanText, status: 'pending' }])
      await supabase.from('wa_log').insert([{ no_wa: s.nomorWaFormat, kategori: 'peringatan_bolos_3x' }])
      setPesanStatus(`✅ Sukses`)
      fetchWaLog()
    } catch (err) {
      setPesanStatus('❌ Gagal')
    } finally {
      setLoading(false)
      setTimeout(() => setPesanStatus(''), 3000)
    }
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="glass-card" style={{ marginBottom: '20px', padding: '20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
        <h2 style={{ color: '#ef4444' }}>🔍 Mode Penyelidikan Kolom Status</h2>
        <p>Tabel di bawah sedang menampilkan data mentah dari database untuk melacak kenapa siswa nonaktif tetap muncul.</p>
      </div>

      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                <th style={{ padding: '12px' }}>Nama Siswa</th>
                <th style={{ padding: '12px', color: '#f43f5e' }}>⚠️ NAMA KOLOM</th>
                <th style={{ padding: '12px', color: '#f43f5e' }}>⚠️ ISI STATUS ASLI</th>
                <th style={{ padding: '12px' }}>Tanggal Kosong</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {siswaBolosList.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center' }}>Tidak ada data.</td></tr>
              ) : (
                siswaBolosList.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{s.nama}</td>
                    <td style={{ padding: '12px', color: '#f43f5e', fontWeight: 'bold' }}>{s.debugNamaKolom}</td>
                    <td style={{ padding: '12px', color: '#22d3ee', fontWeight: 'bold' }}>"{s.debugIsiStatus}"</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{s.detailAbsen}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button className="btn btn-secondary btn-small" onClick={() => kirimPeringatanTunggal(s)}>💬 Kirim WA</button>
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
