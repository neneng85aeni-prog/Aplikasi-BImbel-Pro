import { useState } from 'react'
import { INITIAL_BRANCH_FORM } from '../../lib/constants'
import { printBarcodeCard } from '../ui/BarcodePreview'
import { supabase } from '../../lib/supabase'

function safeFileName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'qris'
}

export function CabangTab({ branchForm, setBranchForm, branches, onSubmit, onReset, onEdit, onDelete }) {
  const [uploadingQris, setUploadingQris] = useState(false)
  const [qrisUploadMessage, setQrisUploadMessage] = useState('')

  async function handleUploadQris(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!supabase) {
      setQrisUploadMessage('Supabase belum terhubung.')
      return
    }

    if (!file.type.startsWith('image/')) {
      setQrisUploadMessage('File QRIS harus berupa gambar PNG/JPG/WebP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setQrisUploadMessage('Ukuran gambar QRIS maksimal 5 MB.')
      return
    }

    setUploadingQris(true)
    setQrisUploadMessage('Mengupload QRIS...')

    try {
      const ext = file.name.split('.').pop() || 'png'
      const branchCode = safeFileName(branchForm.kode || branchForm.nama || 'cabang')
      const path = `${branchCode}/qris-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase
        .storage
        .from('qris')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('qris').getPublicUrl(path)
      const publicUrl = data?.publicUrl || ''

      if (!publicUrl) throw new Error('Gagal mengambil link public QRIS.')

      setBranchForm({
        ...branchForm,
        qris_image_url: publicUrl,
        payment_qris_url: publicUrl,
      })

      setQrisUploadMessage('QRIS berhasil diupload. Jangan lupa klik Simpan/Update cabang.')
    } catch (error) {
      setQrisUploadMessage(error.message || 'Upload QRIS gagal.')
    } finally {
      setUploadingQris(false)
      event.target.value = ''
    }
  }

  return (
    <div className="grid grid-2">
      {/* KOTAK KIRI: FORM CABANG */}
      <div className="glass-card">
        <h2 className="section-title">Pengaturan cabang</h2>
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <label>Nama cabang</label>
            <input value={branchForm.nama} onChange={(e) => setBranchForm({ ...branchForm, nama: e.target.value })} required />
          </div>

          <div className="form-row">
            <label>Kode cabang</label>
            <input value={branchForm.kode} onChange={(e) => setBranchForm({ ...branchForm, kode: e.target.value.toUpperCase() })} placeholder="CBG-01" required />
          </div>

          <div className="form-row">
            <label>Alamat</label>
            <textarea value={branchForm.alamat} onChange={(e) => setBranchForm({ ...branchForm, alamat: e.target.value })} />
          </div>

          {/* === LINK GRUP WA === */}
          <div className="form-row" style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '16px' }}>
            <label style={{ color: '#60a5fa' }}>🔗 Link Grup WA (Otomatis)</label>
            <input 
              type="url" 
              placeholder="Cth: https://chat.whatsapp.com/xxx" 
              value={branchForm.link_grup || ''} 
              onChange={(e) => setBranchForm({ ...branchForm, link_grup: e.target.value })} 
              style={{ marginTop: '4px' }}
            />
            <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', display: 'block', lineHeight: '1.4' }}>
              Link ini akan otomatis dikirimkan via WA ke setiap siswa baru yang mendaftar di cabang ini.
            </span>
          </div>

          {/* === PEMBAYARAN ORANG TUA === */}
          <div style={{ background: 'rgba(16, 185, 129, 0.06)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.22)', marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '16px' }}>💳 Pengaturan Pembayaran Orang Tua</h3>
            <p className="text-muted" style={{ marginTop: 0, fontSize: '12px', lineHeight: 1.5 }}>
              Data ini akan tampil di Portal Orang Tua saat memilih menu Bayar Sekarang.
            </p>

            <div className="form-row">
              <label>Upload QRIS</label>
              <input type="file" accept="image/*" onChange={handleUploadQris} disabled={uploadingQris} />
              {qrisUploadMessage ? (
                <span style={{ fontSize: '11px', color: qrisUploadMessage.includes('berhasil') ? '#10b981' : '#f59e0b', marginTop: '6px', display: 'block' }}>
                  {qrisUploadMessage}
                </span>
              ) : null}
            </div>

            {branchForm.qris_image_url ? (
              <div style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: '110px 1fr', gap: '12px', alignItems: 'center' }}>
                <img
                  src={branchForm.qris_image_url}
                  alt="Preview QRIS"
                  style={{ width: '110px', height: '110px', objectFit: 'contain', background: '#fff', padding: '6px', borderRadius: '10px' }}
                />
                <div>
                  <b style={{ fontSize: '13px' }}>QRIS aktif</b>
                  <div className="text-muted" style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                    {branchForm.qris_image_url}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="form-row">
              <label>Link gambar QRIS</label>
              <input
                value={branchForm.qris_image_url || ''}
                onChange={(e) => setBranchForm({ ...branchForm, qris_image_url: e.target.value, payment_qris_url: e.target.value })}
                placeholder="Otomatis terisi setelah upload QRIS"
              />
            </div>

            <div className="form-row">
              <label>Nama merchant QRIS</label>
              <input
                value={branchForm.qris_merchant_name || ''}
                onChange={(e) => setBranchForm({ ...branchForm, qris_merchant_name: e.target.value })}
                placeholder="Contoh: Bimbel Top Pangkalan"
              />
            </div>

            <div className="form-row">
              <label>Nama bank</label>
              <input
                value={branchForm.bank_name || ''}
                onChange={(e) => setBranchForm({ ...branchForm, bank_name: e.target.value })}
                placeholder="Contoh: BCA / BRI / Mandiri"
              />
            </div>

            <div className="form-row">
              <label>Nomor rekening</label>
              <input
                value={branchForm.bank_account_number || ''}
                onChange={(e) => setBranchForm({ ...branchForm, bank_account_number: e.target.value })}
                placeholder="Nomor rekening transfer"
              />
            </div>

            <div className="form-row">
              <label>Atas nama rekening</label>
              <input
                value={branchForm.bank_account_name || ''}
                onChange={(e) => setBranchForm({ ...branchForm, bank_account_name: e.target.value })}
                placeholder="Nama pemilik rekening"
              />
            </div>

            <div className="form-row">
              <label>WhatsApp konfirmasi pembayaran</label>
              <input
                value={branchForm.payment_whatsapp || ''}
                onChange={(e) => setBranchForm({ ...branchForm, payment_whatsapp: e.target.value })}
                placeholder="Contoh: 6281234567890"
              />
            </div>

            <div className="form-row">
              <label>Catatan pembayaran</label>
              <textarea
                value={branchForm.payment_note || ''}
                onChange={(e) => setBranchForm({ ...branchForm, payment_note: e.target.value })}
                placeholder="Contoh: Setelah transfer/QRIS, klik Konfirmasi via WhatsApp dan kirim bukti pembayaran."
              />
            </div>
          </div>

          <div className="form-row">
            <label>Barcode pintu masuk karyawan</label>
            <input value={branchForm.employee_barcode_in} onChange={(e) => setBranchForm({ ...branchForm, employee_barcode_in: e.target.value })} />
          </div>

          <div className="form-row">
            <label>Barcode pintu pulang karyawan</label>
            <input value={branchForm.employee_barcode_out} onChange={(e) => setBranchForm({ ...branchForm, employee_barcode_out: e.target.value })} />
          </div>

          <div className="btn-row">
            <button className="btn btn-primary" type="submit">{branchForm.id ? '💾 Update cabang' : '💾 Simpan cabang'}</button>
            <button className="btn btn-secondary" type="button" onClick={() => onReset(INITIAL_BRANCH_FORM)}>Reset</button>
          </div>
        </form>
      </div>

      {/* KOTAK KANAN: DAFTAR CABANG */}
      <div className="glass-card">
        <h2 className="section-title">Daftar cabang</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cabang</th>
                <th>Kode</th>
                <th>Pembayaran</th>
                <th>Barcode pintu</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((item) => (
                <tr key={item.id}>
                  <td>
                    <b>{item.nama}</b>
                    <div className="text-muted" style={{ fontSize: '12px' }}>{item.alamat || '-'}</div>
                    {item.link_grup && (
                      <div style={{ fontSize: '10px', color: '#10b981', marginTop: '4px' }}>
                        ✓ Link WA Aktif
                      </div>
                    )}
                  </td>
                  <td>{item.kode}</td>
                  <td>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                      QRIS: {item.qris_image_url ? '✓ Aktif' : '-'}
                    </div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                      Bank: {item.bank_name || '-'} {item.bank_account_number ? `• ${item.bank_account_number}` : ''}
                    </div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                      WA: {item.payment_whatsapp || '-'}
                    </div>
                  </td>
                  <td>
                    <div className="text-muted" style={{ fontSize: '11px' }}>IN: {item.employee_barcode_in || '-'}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>OUT: {item.employee_barcode_out || '-'}</div>
                  </td>
                  <td>
                    <div className="btn-row" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <button className="btn btn-secondary btn-small" type="button" onClick={() => onEdit(item)}>Edit</button>
                      <button className="btn btn-secondary btn-small" type="button" onClick={() => printBarcodeCard({ title: `Barcode Pintu ${item.nama}`, subtitle: `IN: ${item.employee_barcode_in} | OUT: ${item.employee_barcode_out}`, value: `${item.employee_barcode_in} / ${item.employee_barcode_out}` })}>Print</button>
                      <button className="btn btn-danger btn-small" type="button" onClick={() => onDelete(item.id, item.nama)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {branches.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-muted">Belum ada data cabang.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
