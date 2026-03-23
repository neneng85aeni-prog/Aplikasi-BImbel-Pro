import { formatTanggal } from '../../lib/format'

export function PerkembanganTab({
  user,
  perkembanganForm,
  setPerkembanganForm,
  siswaTampil,
  guruOptions,
  perkembanganHistory,
  selectedProgressStudent,
  progressInputMode,
  setProgressInputMode,
  scanStudentActive,
  setScanStudentActive,
  studentScanInfo,
  onSelectProgressStudent,
  onSubmit,
}) {
  return (
    <div className="grid grid-2 gap-lg">
      <div className="glass-card">
        <div className="btn-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 className="section-title">Perkembangan siswa + absensi harian</h2>
            <p className="text-muted">Guru cukup scan sekali sehari atau pilih manual. Saat siswa dipilih, absensi hadir hari itu otomatis diproses untuk guru yang membimbing.</p>
          </div>
          <div className="pill-row">
            <button type="button" className={`tab ${progressInputMode === 'scan' ? 'active' : ''}`} onClick={() => setProgressInputMode('scan')}>Scan barcode</button>
            <button type="button" className={`tab ${progressInputMode === 'manual' ? 'active' : ''}`} onClick={() => setProgressInputMode('manual')}>Input manual</button>
          </div>
        </div>

        {progressInputMode === 'scan' ? (
          <>
            <div id="reader-siswa" className="reader-box" />
            <p className="text-muted" style={{ marginTop: 12 }}>{studentScanInfo}</p>
            <div className="btn-row">
              <button className="btn btn-primary" type="button" onClick={() => setScanStudentActive(true)}>{scanStudentActive ? 'Scanning...' : 'Start scanning'}</button>
              <button className="btn btn-secondary" type="button" onClick={() => setScanStudentActive(false)}>Stop</button>
            </div>
          </>
        ) : (
          <div className="form-row" style={{ marginTop: 16 }}>
            <label>Pilih siswa manual</label>
            <select value={perkembanganForm.siswa_id} onChange={(e) => onSelectProgressStudent(e.target.value, 'manual')}>
              <option value="">Cari / pilih siswa</option>
              {siswaTampil.map((item) => <option key={item.id} value={item.id}>{item.nama} • {item.branch_nama || item.branches?.nama || '-'} • {item.kelas || '-'}</option>)}
            </select>
          </div>
        )}

        {selectedProgressStudent ? (
          <div className="helper-box" style={{ marginTop: 18 }}>
            <b>{selectedProgressStudent.nama}</b> • {selectedProgressStudent.branch_nama || selectedProgressStudent.branches?.nama || '-'} • Program {selectedProgressStudent.programs?.nama || '-'}<br />
            Guru default: {selectedProgressStudent.guru_default_nama || selectedProgressStudent.users?.nama || '-'}
          </div>
        ) : null}

        <form onSubmit={onSubmit} style={{ marginTop: 18 }}>
          <div className="grid grid-2">
            <div className="form-row">
              <label>Tanggal sesi</label>
              <input type="date" value={perkembanganForm.tanggal} onChange={(e) => setPerkembanganForm({ ...perkembanganForm, tanggal: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Guru yang handle hari ini</label>
              <select value={perkembanganForm.guru_handle_id} onChange={(e) => setPerkembanganForm({ ...perkembanganForm, guru_handle_id: e.target.value })}>
                <option value="">Pilih guru</option>
                {guruOptions.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}
              </select>
            </div>
          </div>
          {user?.akses === 'guru' ? <div className="helper-box" style={{ marginBottom: 14 }}>Saat guru login, scan/pilih siswa otomatis akan memakai guru yang sedang login sebagai guru handle hari ini.</div> : null}
          <div className="form-row">
            <label>Catatan perkembangan hari ini</label>
            <textarea value={perkembanganForm.catatan} onChange={(e) => setPerkembanganForm({ ...perkembanganForm, catatan: e.target.value })} placeholder="Contoh: review pecahan, perlu penguatan pembagian, PR halaman 21 nomor 1-5." />
          </div>
          <div className="btn-row">
            <button className="btn btn-primary" type="submit">Simpan perkembangan hari ini</button>
            <button className="btn btn-secondary" type="button" onClick={() => setPerkembanganForm((prev) => ({ ...prev, catatan: '' }))}>Kosongkan catatan</button>
          </div>
        </form>
      </div>

      <div className="glass-card">
        <div className="btn-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="section-title">Perkembangan sebelumnya</h2>
            <p className="text-muted">Riwayat terbaru siswa yang sedang dipilih agar guru mudah melanjutkan materi.</p>
          </div>
          <span className="badge">{perkembanganHistory.length} riwayat</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Siswa</th>
                <th>Guru</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {perkembanganHistory.length ? perkembanganHistory.map((item) => (
                <tr key={item.id}>
                  <td>{formatTanggal(item.tanggal)}</td>
                  <td>{item.siswa?.nama || '-'}</td>
                  <td>{item.users?.nama || '-'}</td>
                  <td>{item.catatan}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="text-muted">Pilih atau scan siswa untuk melihat riwayat perkembangan sebelumnya.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
