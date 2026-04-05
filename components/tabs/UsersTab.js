import { formatRupiah } from '../../lib/format'
import { SALARY_TYPE_OPTIONS, ALL_MENU_KEYS, TAB_LABELS, INITIAL_USER_FORM, INITIAL_AVAILABILITY } from '../../lib/constants'

export function UsersTab({ userForm, setUserForm, users, branches, onSubmit, onReset, onEdit, onDelete, programs }) {
  
  // === FUNGSI HELPER: PEMBERSIH NOMOR TELEPON ===
  const formatNomorWA = (nomor) => {
    if (!nomor) return '';
    let cleaned = nomor.replace(/\s+/g, '').replace(/-/g, '').replace(/\./g, '');
    if (cleaned.startsWith('0')) {
      return '+62' + cleaned.slice(1);
    }
    if (cleaned.startsWith('62') && !cleaned.startsWith('+62')) {
      return '+' + cleaned;
    }
    return cleaned;
  };

  const handleTogglePermission = (key) => {
    const currentPerms = userForm.menu_permissions || []
    if (currentPerms.includes(key)) {
      setUserForm({ ...userForm, menu_permissions: currentPerms.filter(k => k !== key) })
    } else {
      setUserForm({ ...userForm, menu_permissions: [...currentPerms, key] })
    }
  }

  const handleSelectAll = () => {
    setUserForm({ ...userForm, menu_permissions: ALL_MENU_KEYS })
  }

  const handleClearAll = () => {
    setUserForm({ ...userForm, menu_permissions: ['overview'] }) 
  }

  return (
    <div className="grid gap-lg">
      <div className="glass-card">
        <h2 className="section-title">Manajemen Karyawan</h2>
        
        {/* KEMBALIKAN KE onSubmit BAWAAN AGAR TIDAK SILENT CRASH */}
        <form onSubmit={onSubmit} autoComplete="off">
          <div className="grid grid-2">
            <div className="form-row">
              <label>Nama Lengkap</label>
              <input type="text" value={userForm.nama} onChange={(e) => setUserForm({ ...userForm, nama: e.target.value })} required autoComplete="off" />
            </div>
            <div className="form-row">
              <label>Email (Untuk Login)</label>
              <input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required autoComplete="off" />
            </div>
          </div>
          
          <div className="grid grid-2">
            <div className="form-row">
              <label>Password {userForm.id && '(Kosongkan jika tidak diubah)'}</label>
              <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required={!userForm.id} autoComplete="new-password" />
            </div>
            <div className="form-row">
              <label>No. Telepon / WA</label>
              {/* SULAP NOMOR PINDAH KE SINI ✨ (Akan otomatis diformat saat diketik) */}
              <input 
                type="text" 
                value={userForm.no_telepon || ''} 
                onChange={(e) => setUserForm({ ...userForm, no_telepon: formatNomorWA(e.target.value) })} 
                placeholder="Cth: +628123456789" 
                required 
                autoComplete="off" 
              />
            </div>
          </div>
          
          <div className="grid grid-2">
            <div className="form-row">
              <label>Jabatan Utama (Role)</label>
              <input 
                type="text" 
                value={userForm.akses} 
                onChange={(e) => setUserForm({ ...userForm, akses: e.target.value.toUpperCase() })} 
                placeholder="Cth: MASTER, ADMIN, GURU, KASIR..." 
                required 
                autoComplete="off" 
              />
            </div>
            <div className="form-row">
              <label>Penempatan Cabang</label>
              <select value={userForm.branch_id || ''} onChange={(e) => setUserForm({ ...userForm, branch_id: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', color: 'inherit' }}>
                <option value="" style={{ color: 'black' }}>Pusat / Semua Cabang</option>
                {branches.map((b) => <option key={b.id} value={b.id} style={{ color: 'black' }}>{b.nama}</option>)}
              </select>
            </div>
          </div>
  {/* === KODE BARU: KHUSUS GURU (TEMPEL DI SINI) === */}
          {userForm.akses === 'GURU' && (
            <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#60a5fa' }}>🎓 Kompetensi & Jadwal Kerja Guru</h3>
              
              {/* Checkbox Program */}
              <div className="form-row" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>📚 Program yang Dikuasai</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                  {programs?.map(prog => (
                    <label key={prog.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px' }}>
                      <input 
                        type="checkbox" 
                        checked={userForm.programs_can_handle?.includes(prog.id)}
                        onChange={(e) => {
                          const current = userForm.programs_can_handle || [];
                          const next = e.target.checked ? [...current, prog.id] : current.filter(id => id !== prog.id);
                          setUserForm({ ...userForm, programs_can_handle: next });
                        }}
                      />
                      {prog.nama}
                    </label>
                  ))}
                </div>
              </div>

              {/* List Jadwal Kerja Harian */}
              <div className="form-row">
                <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>📅 Jadwal Ketersediaan</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(userForm.availability || []).map((avail, index) => (
                    <div key={avail.hari} style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                      padding: '8px 12px', background: avail.aktif ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '90px', cursor: 'pointer', fontSize: '13px' }}>
                        <input 
                          type="checkbox" 
                          checked={avail.aktif} 
                          onChange={(e) => {
                            const nextAvail = [...userForm.availability];
                            nextAvail[index].aktif = e.target.checked;
                            setUserForm({ ...userForm, availability: nextAvail });
                          }}
                        />
                        {avail.hari}
                      </label>
                      {avail.aktif ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <input type="time" value={avail.jam_masuk} onChange={(e) => {
                            const nextAvail = [...userForm.availability];
                            nextAvail[index].jam_masuk = e.target.value;
                            setUserForm({ ...userForm, availability: nextAvail });
                          }} style={{ padding: '4px', fontSize: '12px', background: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }} />
                          <span style={{ fontSize: '12px' }}>-</span>
                          <input type="time" value={avail.jam_pulang} onChange={(e) => {
                            const nextAvail = [...userForm.availability];
                            nextAvail[index].jam_pulang = e.target.value;
                            setUserForm({ ...userForm, availability: nextAvail });
                          }} style={{ padding: '4px', fontSize: '12px', background: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }} />
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Libur</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* === SELESAI KODE BARU === */}

          {/* CHECKLIST HAK AKSES MENU */}
          <div style={{ marginTop: '20px', marginBottom: '20px', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '15px' }}>Hak Akses Menu (Checklist)</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={handleSelectAll} className="btn btn-secondary btn-small" style={{ fontSize: '11px', padding: '6px 12px' }}>Centang Semua</button>
                <button type="button" onClick={handleClearAll} className="btn btn-danger btn-small" style={{ fontSize: '11px', padding: '6px 12px', background: 'transparent' }}>Kosongkan</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
              {ALL_MENU_KEYS.map((key) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <input 
                    type="checkbox" 
                    checked={userForm.menu_permissions?.includes(key) || false}
                    onChange={() => handleTogglePermission(key)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  {TAB_LABELS[key]}
                </label>
              ))}
            </div>
          </div>

          <h3 style={{ marginTop: '20px', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Setup Jam Kerja Standar</h3>
          <div className="grid grid-2">
            <div className="form-row">
              <label>Batas Jam Masuk</label>
              <input type="time" value={userForm.batas_jam_masuk || ''} onChange={(e) => setUserForm({ ...userForm, batas_jam_masuk: e.target.value })} required />
            </div>
            <div className="form-row">
              <label>Batas Jam Pulang</label>
              <input type="time" value={userForm.batas_jam_pulang || ''} onChange={(e) => setUserForm({ ...userForm, batas_jam_pulang: e.target.value })} required />
            </div>
          </div>

          <h3 style={{ marginTop: '20px', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Setup Gaji & Tunjangan</h3>
          <div className="form-row">
            <label>Sistem Gaji</label>
            <select value={userForm.salary_type || 'fixed'} onChange={(e) => setUserForm({ ...userForm, salary_type: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', color: 'inherit' }}>
              {SALARY_TYPE_OPTIONS.map((opt) => <option key={opt} value={opt} style={{ color: 'black' }}>{opt.replace('_', ' ').toUpperCase()}</option>)}
            </select>
          </div>

          <div className="grid grid-2">
            <div className="form-row">
              <label>Gaji Pokok (Bulan)</label>
              <input type="number" value={userForm.salary_fixed || ''} onChange={(e) => setUserForm({ ...userForm, salary_fixed: e.target.value })} placeholder="0" />
            </div>
            <div className="form-row">
              <label>Honor Mengajar (Fee per Siswa)</label>
              <input type="number" value={userForm.student_fee_daily || ''} onChange={(e) => setUserForm({ ...userForm, student_fee_daily: e.target.value })} placeholder="0" />
            </div>
          </div>

          <div className="grid grid-2">
            <div className="form-row">
              <label>Target Siswa (Bulan)</label>
              <input type="number" value={userForm.monthly_bonus_target || ''} onChange={(e) => setUserForm({ ...userForm, monthly_bonus_target: e.target.value })} placeholder="0" />
            </div>
            <div className="form-row">
              <label>Bonus Jika Capai Target</label>
              <input type="number" value={userForm.bonus_amount || ''} onChange={(e) => setUserForm({ ...userForm, bonus_amount: e.target.value })} placeholder="0" />
            </div>
          </div>

          <div className="btn-row" style={{ marginTop: '15px' }}>
            <button className="btn btn-primary" type="submit">{userForm.id ? '💾 Update Karyawan' : '💾 Simpan Karyawan'}</button>
            <button 
  className="btn btn-secondary" 
  type="button" 
  onClick={() => onReset({
    ...INITIAL_USER_FORM,
    // Kita buat salinan jadwal kosong yang benar-benar baru
    availability: INITIAL_AVAILABILITY.map(a => ({ ...a })),
    programs_can_handle: [] 
  })}
>
  Batal
</button>
          </div>
        </form>
      </div>

      <div className="glass-card">
        <h2 className="section-title">Daftar Karyawan</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nama</th><th>Email / WA</th><th>Jabatan</th><th>Cabang</th><th>Aksi</th></tr></thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id}>
                  <td><b>{item.nama}</b></td>
                  <td>{item.email}<br/><span className="text-muted" style={{color: '#10b981'}}>{item.no_telepon || 'Belum ada WA'}</span></td>
                  <td style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{item.akses}</td>
                  <td>{item.branch_nama || 'Pusat'}</td>
                  <td>
                    <div className="btn-row" style={{ flexWrap: 'nowrap' }}>
                      <button className="btn btn-secondary btn-small" onClick={() => onEdit(item)}>Edit</button>
                      <button className="btn btn-danger btn-small" onClick={() => onDelete(item.id, item.nama)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
