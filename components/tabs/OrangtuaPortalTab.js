import { useMemo, useState } from 'react'
import { formatRupiah } from '../../lib/format'

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase()
}

function formatTanggalIndo(value) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return String(value)
  }
}

function formatTanggalJamIndo(value) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return String(value)
  }
}

function addOneMonth(dateValue) {
  const base = dateValue ? new Date(dateValue) : new Date()
  if (Number.isNaN(base.getTime())) return null
  const next = new Date(base)
  next.setMonth(next.getMonth() + 1)
  return next
}

function getPaymentInfo(siswa, pembayaran = [], perkembangan = []) {
  const siswaPembayaran = pembayaran
    .filter((item) => item.siswa_id === siswa.id)
    .sort((a, b) => String(b.tanggal || b.created_at || '').localeCompare(String(a.tanggal || a.created_at || '')))

  const latestPayment = siswaPembayaran[0] || null
  const programNama = siswa.programs?.nama || siswa.programNama || ''
  const programDeskripsi = siswa.programs?.deskripsi || ''
  const nominalProgram = Number(siswa.programs?.nominal || siswa.nominal || 0)

  const matchSesi = String(programNama).match(/(\d+)\s*x/i)
  if (matchSesi) {
    const sesiPerPaket = Number(matchSesi[1]) || 0
    const riwayatHadirLama = Number(siswa.sesi_awal || 0)
    const hadirAplikasi = perkembangan.filter((item) => item.siswa_id === siswa.id).length
    const totalDiikuti = riwayatHadirLama + hadirAplikasi
    const kuotaBawaanLama = riwayatHadirLama === 0 ? 0 : Math.ceil(riwayatHadirLama / sesiPerPaket) * sesiPerPaket
    const paketDibeliKasir = siswaPembayaran.filter((item) => !siswa.program_id || item.program_id === siswa.program_id).length
    const totalKuota = kuotaBawaanLama + (paketDibeliKasir * sesiPerPaket)
    const sisaSesi = totalKuota - totalDiikuti

    return {
      mode: 'sesi',
      label: sisaSesi <= 0 ? 'Kuota habis / perlu pembayaran' : sisaSesi <= 1 ? 'Sisa 1 sesi lagi' : `Sisa ${sisaSesi} sesi`,
      detail: `Total hadir ${totalDiikuti} sesi dari kuota ${totalKuota || 0} sesi.`,
      nominal: nominalProgram,
      latestPayment
    }
  }

  const isBulanan = String(programDeskripsi).toLowerCase().includes('bulanan') || String(programNama).toLowerCase().includes('bulanan')
  if (isBulanan) {
    const nextDue = addOneMonth(latestPayment?.tanggal || latestPayment?.created_at || siswa.created_at)
    return {
      mode: 'bulanan',
      label: nextDue ? `Perkiraan jatuh tempo ${formatTanggalIndo(nextDue)}` : 'Jadwal pembayaran bulanan belum dapat dihitung',
      detail: latestPayment ? `Pembayaran terakhir ${formatTanggalIndo(latestPayment.tanggal || latestPayment.created_at)}.` : 'Belum ada riwayat pembayaran yang tercatat.',
      nominal: nominalProgram,
      latestPayment
    }
  }

  return {
    mode: 'umum',
    label: latestPayment ? 'Pembayaran terakhir tercatat' : 'Belum ada riwayat pembayaran',
    detail: latestPayment ? `Pembayaran terakhir ${formatTanggalIndo(latestPayment.tanggal || latestPayment.created_at)}.` : 'Silakan hubungi admin untuk informasi jatuh tempo.',
    nominal: nominalProgram,
    latestPayment
  }
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', borderBottom: '1px solid rgba(148,163,184,0.18)', padding: '8px 0' }}>
      <span className="text-muted">{label}</span>
      <b style={{ textAlign: 'right' }}>{value || '-'}</b>
    </div>
  )
}

export function OrangtuaPortalTab({ user, siswa = [], perkembangan = [], absensiSiswa = [], pembayaran = [] }) {
  const [query, setQuery] = useState('')
  const [selectedSiswaId, setSelectedSiswaId] = useState('')

  const siswaOptions = useMemo(() => {
    const q = normalizeText(query)
    const rows = Array.isArray(siswa) ? siswa : []
    if (!q) return rows
    return rows.filter((item) => {
      const text = [item.nama, item.nama_ortu, item.no_hp, item.kode_qr, item.kelas, item.programs?.nama, item.branches?.nama]
        .map(normalizeText)
        .join(' ')
      return text.includes(q)
    })
  }, [siswa, query])

  const selectedSiswa = useMemo(() => {
    if (selectedSiswaId) return siswaOptions.find((item) => item.id === selectedSiswaId) || null
    return siswaOptions.length === 1 ? siswaOptions[0] : null
  }, [siswaOptions, selectedSiswaId])

  const perkembanganSiswa = useMemo(() => {
    if (!selectedSiswa) return []
    return perkembangan
      .filter((item) => item.siswa_id === selectedSiswa.id)
      .sort((a, b) => String(b.tanggal || b.created_at || '').localeCompare(String(a.tanggal || a.created_at || '')))
  }, [perkembangan, selectedSiswa])

  const absensiSiswaTerpilih = useMemo(() => {
    if (!selectedSiswa) return []
    return absensiSiswa
      .filter((item) => item.siswa_id === selectedSiswa.id)
      .sort((a, b) => String(b.tanggal || b.created_at || '').localeCompare(String(a.tanggal || a.created_at || '')))
  }, [absensiSiswa, selectedSiswa])

  const pembayaranSiswa = useMemo(() => {
    if (!selectedSiswa) return []
    return pembayaran
      .filter((item) => item.siswa_id === selectedSiswa.id)
      .sort((a, b) => String(b.tanggal || b.created_at || '').localeCompare(String(a.tanggal || a.created_at || '')))
  }, [pembayaran, selectedSiswa])

  const paymentInfo = selectedSiswa ? getPaymentInfo(selectedSiswa, pembayaran, perkembangan) : null
  const role = normalizeText(user?.akses)
  const isParent = ['orangtua', 'ortu', 'parent', 'wali'].includes(role)

  return (
    <div className="flex flex-col gap-lg">
      <div className="glass-card">
        <div className="eyebrow">Portal Orang Tua</div>
        <h2 className="section-title">Pencarian Data Siswa</h2>
        <p className="text-muted">
          Lihat perkembangan belajar, jadwal masuk, kehadiran, dan informasi pembayaran siswa.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'end', marginTop: '14px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span className="text-muted">Cari nama siswa / kode QR / nomor HP</span>
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setSelectedSiswaId('') }}
              placeholder={isParent ? 'Data dibatasi sesuai nomor orang tua' : 'Contoh: Aisyah / 628xxx / QR001'}
            />
          </label>
          <button className="btn btn-secondary" type="button" onClick={() => { setQuery(''); setSelectedSiswaId('') }}>
            Reset
          </button>
        </div>

        {siswaOptions.length > 1 && (
          <div style={{ marginTop: '12px' }}>
            <select value={selectedSiswaId} onChange={(event) => setSelectedSiswaId(event.target.value)}>
              <option value="">Pilih siswa</option>
              {siswaOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nama} • {item.programs?.nama || '-'} • {item.branches?.nama || '-'}
                </option>
              ))}
            </select>
          </div>
        )}

        {siswaOptions.length === 0 && (
          <div style={{ marginTop: '16px', padding: '14px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            Data siswa tidak ditemukan. {isParent ? 'Pastikan nomor telepon akun orang tua sama dengan nomor HP di data siswa.' : 'Coba kata kunci lain.'}
          </div>
        )}
      </div>

      {selectedSiswa && (
        <>
          <div className="grid grid-3">
            <div className="glass-card">
              <div className="eyebrow">Siswa</div>
              <h2 className="section-title">{selectedSiswa.nama}</h2>
              <InfoRow label="Program" value={selectedSiswa.programs?.nama || '-'} />
              <InfoRow label="Kelas" value={selectedSiswa.kelas || '-'} />
              <InfoRow label="Cabang" value={selectedSiswa.branches?.nama || selectedSiswa.branch_nama || '-'} />
              <InfoRow label="Guru" value={selectedSiswa.users?.nama || selectedSiswa.guru_default_nama || '-'} />
            </div>

            <div className="glass-card">
              <div className="eyebrow">Jadwal Masuk</div>
              <h2 className="section-title">Jadwal Belajar</h2>
              <InfoRow label="Hari" value={selectedSiswa.hari || '-'} />
              <InfoRow label="Jam" value={selectedSiswa.jam_mulai || '-'} />
              <InfoRow label="Kode QR" value={selectedSiswa.kode_qr || selectedSiswa.id || '-'} />
            </div>

            <div className="glass-card">
              <div className="eyebrow">Pembayaran</div>
              <h2 className="section-title">Status Tagihan</h2>
              <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.25)', marginBottom: '10px' }}>
                <b>{paymentInfo?.label || '-'}</b>
                <p className="text-muted" style={{ margin: '6px 0 0' }}>{paymentInfo?.detail || '-'}</p>
              </div>
              <InfoRow label="Nominal Program" value={paymentInfo?.nominal ? formatRupiah(paymentInfo.nominal) : '-'} />
              <InfoRow label="Bayar Terakhir" value={paymentInfo?.latestPayment ? formatRupiah(paymentInfo.latestPayment.nominal || 0) : '-'} />
            </div>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <div className="eyebrow">Perkembangan</div>
                <h2 className="section-title">Riwayat Perkembangan Siswa</h2>
              </div>
              <span className="text-muted">Total: {perkembanganSiswa.length} catatan</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Guru</th>
                    <th>Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {perkembanganSiswa.slice(0, 20).map((item) => (
                    <tr key={item.id}>
                      <td>{formatTanggalIndo(item.tanggal || item.created_at)}</td>
                      <td>{item.users?.nama || '-'}</td>
                      <td style={{ whiteSpace: 'normal', minWidth: '260px' }}>{item.catatan || '-'}</td>
                    </tr>
                  ))}
                  {perkembanganSiswa.length === 0 && (
                    <tr><td colSpan="3" className="text-muted">Belum ada catatan perkembangan.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="glass-card">
              <div className="eyebrow">Kehadiran</div>
              <h2 className="section-title">Hadir Kapan Saja</h2>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Mode</th>
                      <th>Status</th>
                      <th>Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absensiSiswaTerpilih.slice(0, 20).map((item) => (
                      <tr key={item.id}>
                        <td>{formatTanggalIndo(item.tanggal || item.created_at)}</td>
                        <td>{item.mode || '-'}</td>
                        <td>{item.status || 'hadir'}</td>
                        <td>{item.catatan || '-'}</td>
                      </tr>
                    ))}
                    {absensiSiswaTerpilih.length === 0 && perkembanganSiswa.slice(0, 10).map((item) => (
                      <tr key={`perkembangan-${item.id}`}>
                        <td>{formatTanggalIndo(item.tanggal || item.created_at)}</td>
                        <td>perkembangan</td>
                        <td>hadir</td>
                        <td>Terisi catatan perkembangan</td>
                      </tr>
                    ))}
                    {absensiSiswaTerpilih.length === 0 && perkembanganSiswa.length === 0 && (
                      <tr><td colSpan="4" className="text-muted">Belum ada data kehadiran.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-card">
              <div className="eyebrow">Pembayaran</div>
              <h2 className="section-title">Riwayat Pembayaran</h2>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Keterangan</th>
                      <th>Nominal</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pembayaranSiswa.slice(0, 20).map((item) => (
                      <tr key={item.id}>
                        <td>{formatTanggalIndo(item.tanggal || item.created_at)}</td>
                        <td>{item.keterangan || item.programs?.nama || '-'}</td>
                        <td>{formatRupiah(item.nominal || 0)}</td>
                        <td>{item.status || 'lunas'}</td>
                      </tr>
                    ))}
                    {pembayaranSiswa.length === 0 && (
                      <tr><td colSpan="4" className="text-muted">Belum ada riwayat pembayaran.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
