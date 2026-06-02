import { useEffect, useRef, useState } from 'react'
import { Banner } from './ui/Banner'
import { StatCard } from './ui/StatCard'
import { TAB_LABELS } from '../lib/constants'
import { formatRupiah } from '../lib/format'
import { OverviewTab } from './tabs/OverviewTab'
import { CabangTab } from './tabs/CabangTab'
import { ProgramTab } from './tabs/ProgramTab'
import { UsersTab } from './tabs/UsersTab'
import { PermissionsTab } from './tabs/PermissionsTab'
import { SiswaTab } from './tabs/SiswaTab'
import { AbsensiSiswaTab } from './tabs/AbsensiSiswaTab'
import { KasirTab } from './tabs/KasirTab'
import { PerkembanganTab } from './tabs/PerkembanganTab'
import { KaryawanTab } from './tabs/KaryawanTab'
import { JadwalTab } from './tabs/JadwalTab';
import { ReviewsTab } from './tabs/ReviewsTab'
import { LaporanTab } from './tabs/LaporanTab'
import { PayrollTab } from './tabs/PayrollTab'
import { DownloadTab } from './tabs/DownloadTab'
import { PengeluaranTab } from './tabs/PengeluaranTab'
import { LaporanGuruTab } from './tabs/LaporanGuruTab'
import { InventoryTab } from './tabs/InventoryTab'
import { MaintenanceTab } from './tabs/MaintenanceTab'
import { supabase } from '../lib/supabase' 
// Catatan: Jika file supabase Mbak namanya beda, misal '../lib/supabaseClient', tinggal disesuaikan ya.

export function Dashboard({ state, actions }) {
  const { user, activeTab, message, errorMsg, loadingData, visibleTabs, stats, overview, financeSummary } = state
  const deteksiBolos3HariRef = useRef(false)

  // --- OTOMATIS: DETEKSI SISWA TIDAK HADIR 3 JADWAL BERTURUT-TURUT ---
  useEffect(() => {
    if (!Array.isArray(state.siswaTampil) || !Array.isArray(state.perkembanganTampil)) return
    if (state.siswaTampil.length === 0) return

    // Hindari double insert saat React StrictMode / refresh state berkali-kali.
    if (deteksiBolos3HariRef.current) return

    const formatTanggalLokal = (dateObj) => {
      const tahun = dateObj.getFullYear()
      const bulan = String(dateObj.getMonth() + 1).padStart(2, '0')
      const tanggal = String(dateObj.getDate()).padStart(2, '0')
      return `${tahun}-${bulan}-${tanggal}`
    }

    const normalisasiHari = (nilai) => {
      const teks = String(nilai || '').trim().toLowerCase()
      const mapHari = {
        minggu: 'minggu', ahad: 'minggu',
        senin: 'senin',
        selasa: 'selasa',
        rabu: 'rabu',
        kamis: 'kamis',
        jumat: 'jumat', "jum'at": 'jumat',
        sabtu: 'sabtu'
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

    const ambilTigaJadwalTerakhir = (hariJadwalSiswa, setLibur) => {
      const tigaJadwalTerakhir = []
      const d = new Date()

      // Mulai dari kemarin agar sistem tidak menganggap siswa absen padahal jadwal hari ini belum selesai.
      d.setDate(d.getDate() - 1)

      let mundur = 0
      while (tigaJadwalTerakhir.length < 3 && mundur < 31) {
        const tglString = formatTanggalLokal(d)
        const namaHari = getNamaHari(d)
        
        // JIKA hari ini masuk jadwal siswa DAN TANGGAL INI BUKAN HARI LIBUR, baru dihitung
        if (hariJadwalSiswa.includes(namaHari) && !setLibur.has(tglString)) {
          tigaJadwalTerakhir.push(tglString)
        }
        
        d.setDate(d.getDate() - 1)
        mundur += 1
      }

      return tigaJadwalTerakhir
    }

    const tanggalHariIni = formatTanggalLokal(new Date())
    const sessionKey = `deteksi-bolos-3hari-${state.selectedBranchId || 'semua-cabang'}-${tanggalHariIni}`
    if (typeof window !== 'undefined' && window.sessionStorage?.getItem(sessionKey) === 'selesai') return

   const jalankanDeteksiBolos = async () => {
      deteksiBolos3HariRef.current = true

      // --- TAMBAHAN BARU: AMBIL DURASI DARI WA_SETTINGS ---
      // Kita set default 7 hari dulu untuk berjaga-jaga jika tabel wa_settings belum terbaca
      let batasWaktuISO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: settings, error: settingsError } = await supabase
        .from('wa_settings')
        .select('nilai_hari')
        .eq('nama_setting', 'durasi_peringatan_bolos')
        .single();
      
      if (!settingsError && settings && settings.nilai_hari) {
        batasWaktuISO = new Date(Date.now() - settings.nilai_hari * 24 * 60 * 60 * 1000).toISOString();
      }
      const batasWaktuDateObj = new Date(batasWaktuISO);
      // --- AKHIR TAMBAHAN BARU ---
// --- AMBIL DATA HARI LIBUR ---
      const { data: dataLibur } = await supabase.from('hari_libur').select('tanggal');
      const setLibur = new Set(dataLibur?.map(l => l.tanggal) || []);
     
      const waQueue = Array.isArray(state.waQueueTampil) ? state.waQueueTampil : []

      // Dibuat Set supaya pengecekan hadir lebih cepat dan tanggalnya tidak rawan salah timezone.
      const perkembanganSet = new Set(
        state.perkembanganTampil
          .filter((p) => p?.siswa_id && p?.tanggal)
          .map((p) => `${String(p.siswa_id)}|${String(p.tanggal).slice(0, 10)}`)
      )

      for (const siswa of state.siswaTampil) {
        if (!siswa?.id) continue
        if (String(siswa.status || '').toLowerCase() === 'nonaktif') continue

        // Data CSV siswa memakai no_hp, jadi no_hp wajib ikut dicek.
        const nomorWaOrtu = normalisasiNomorWa(siswa.no_wa_ortu || siswa.wa_ortu || siswa.no_hp || siswa.no_wa)
        if (!nomorWaOrtu) continue

        const hariJadwalSiswa = String(siswa.hari || '')
          .split(',')
          .map(normalisasiHari)
          .filter(Boolean)

        if (hariJadwalSiswa.length === 0) continue

        const tigaJadwalTerakhir = ambilTigaJadwalTerakhir(hariJadwalSiswa, setLibur)
        if (tigaJadwalTerakhir.length < 3) continue

        const tidakHadirTigaJadwal = tigaJadwalTerakhir.every((tgl) => {
          return !perkembanganSet.has(`${String(siswa.id)}|${tgl}`)
        })

        if (!tidakHadirTigaJadwal) continue

        const namaSiswa = String(siswa.nama || '').trim()
        const infoTanggalAbsen = `tidak hadir dalam 3 jadwal berturut-turut (${tigaJadwalTerakhir.join(', ')})`

        // Cek lokal dulu agar tidak spam jika data wa_queue sudah ada di state (Kode Asli Dipertahankan)
        const sudahAdaDiQueueLokal = waQueue.some((q) => {
          const createdAt = q?.created_at ? new Date(q.created_at) : null
          const masihBaru = createdAt && !Number.isNaN(createdAt.getTime()) && createdAt >= batasWaktuDateObj
          const pesanQueue = String(q?.pesan || '')

          return (
            String(q?.no_wa || '') === nomorWaOrtu &&
            pesanQueue.includes(namaSiswa) &&
            pesanQueue.includes(infoTanggalAbsen) &&
            masihBaru
          )
        })
        if (sudahAdaDiQueueLokal) continue

        // --- MODIFIKASI: Cek langsung ke wa_log (Bukan lagi ke wa_queue) ---
        const { data: logLama, error: cekLogError } = await supabase
          .from('wa_log')
          .select('id')
          .eq('no_wa', nomorWaOrtu)
          .eq('kategori', 'peringatan_bolos_3x')
          .gte('created_at', batasWaktuISO)
          .limit(1)

        if (cekLogError) {
          console.error('[Deteksi absen 3 hari] Gagal cek wa_log:', cekLogError)
          continue
        }

        const sudahAdaDiDatabaseLog = Array.isArray(logLama) && logLama.length > 0
        if (sudahAdaDiDatabaseLog) continue
        // --- AKHIR MODIFIKASI ---

        // Kode Asli Dipertahankan
        const pesan = `Assalamu'alaikum Ayah/Bunda, kami perhatikan ananda *${namaSiswa}* ${infoTanggalAbsen}. Apakah ada kendala atau ada yang bisa kami bantu? Mohon informasinya ya, terima kasih.`

        const { error: insertError } = await supabase
          .from('wa_queue')
          .insert([{ no_wa: nomorWaOrtu, pesan, status: 'pending' }])

        if (insertError) {
          console.error(`[Deteksi absen 3 hari] Gagal input ${siswa.nama} ke wa_queue:`, insertError)
          continue
        }

        // --- TAMBAHAN BARU: Catat pengiriman ke wa_log permanen ---
        const { error: insertLogError } = await supabase
          .from('wa_log')
          .insert([{ no_wa: nomorWaOrtu, kategori: 'peringatan_bolos_3x' }])
        
        if (insertLogError) {
          console.error(`[Deteksi absen 3 hari] Gagal catat log untuk: ${siswa.nama}`, insertLogError)
        }
        // --- AKHIR TAMBAHAN BARU ---

        console.log(`[Deteksi absen 3 hari] Masuk wa_queue & wa_log: ${siswa.nama}`)
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage?.setItem(sessionKey, 'selesai')
      }
    }
    jalankanDeteksiBolos().finally(() => {
      deteksiBolos3HariRef.current = false
    })
  }, [state.siswaTampil, state.perkembanganTampil, state.waQueueTampil, state.selectedBranchId])
  // --- AKHIR LOGIKA OTOMATIS ---
// === STATE UNTUK TEMA GELAP/TERANG ===
  const [isLightMode, setIsLightMode] = useState(false);
  // === FITUR AUTO-REDIRECT TAB ===
  useEffect(() => {
    if (visibleTabs && visibleTabs.length > 0 && !visibleTabs.includes(activeTab)) {
      // Jika tab yang diakses laporan_guru tapi belum ada di visibleTabs, kita izinkan lewat shortcut sidebar bawah
      if (activeTab !== 'laporan_guru') {
        actions.setActiveTab(visibleTabs[0]);
      }
    }
  }, [activeTab, visibleTabs, actions]);

  const canSeeStats = visibleTabs.includes('overview');

  return (
    <main className={`app-shell ${isLightMode ? 'light-theme' : ''}`}>
      <style>{`
        @media (max-width: 768px) {
          .app-shell { display: flex !important; flex-direction: column !important; height: 100vh; overflow: hidden; }
          .sidebar { position: sticky; top: 0; z-index: 100; width: 100% !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.1); padding: 12px 16px !important; border-radius: 0 !important; }
          .sidebar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
          .hide-on-mobile { display: none !important; }
          .nav-stack { display: flex !important; flex-direction: row !important; overflow-x: auto !important; gap: 8px; padding-bottom: 4px; margin: 0 !important; }
          .nav-stack::-webkit-scrollbar { display: none; }
          .nav-stack { -ms-overflow-style: none; scrollbar-width: none; }
          .nav-stack .tab { white-space: nowrap; padding: 8px 16px; border-radius: 20px; text-align: center; flex-shrink: 0; }
          .sidebar-actions { display: none !important; }
          .mobile-actions { display: flex !important; gap: 8px; }
          .content-area { flex: 1; overflow-y: auto; padding: 12px !important; }
          .topbar h1 { font-size: 18px !important; }
          .topbar p { display: none !important; }
          .compact-stats { display: flex !important; flex-direction: row !important; overflow-x: auto !important; gap: 10px; padding-bottom: 10px; margin-bottom: 10px; }
          .compact-stats > div { flex: 0 0 140px !important; padding: 12px !important; }
        }
      `}</style>

      <aside className="sidebar glass-card">
        <div className="sidebar-header">
          <div>
            <div className="eyebrow">Bimbel Pro</div>
            <h1 className="sidebar-title">Final Stable</h1>
            <p className="text-muted hide-on-mobile">{user.nama}<br />{user.email}</p>
          </div>
          {/* === TOMBOL LOGOUT KHUSUS MOBILE === */}
          <div className="mobile-actions" style={{ display: 'none' }}>
            <button 
              className="btn btn-danger btn-small" 
              onClick={actions.logout} 
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px' }}
            >
              🚪 Keluar
            </button>
          </div>
        </div>

        <div className="nav-stack">
          {/* === KATEGORI UTAMA === */}
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', padding: '10px 10px 5px 10px', marginTop: '5px' }}>Utama</div>
          
          {visibleTabs.includes('overview') && <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => actions.setActiveTab('overview')}>📊 Dashboard</button>}
          {visibleTabs.includes('kasir') && <button className={`tab ${activeTab === 'kasir' ? 'active' : ''}`} onClick={() => actions.setActiveTab('kasir')}>🧾 Kasir</button>}

          {/* === KATEGORI AKADEMIK === */}
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', padding: '10px 10px 5px 10px', marginTop: '10px' }}>Akademik</div>
          
          {visibleTabs.includes('siswa') && <button className={`tab ${activeTab === 'siswa' ? 'active' : ''}`} onClick={() => actions.setActiveTab('siswa')}>👨‍🎓 Data Siswa</button>}
          {visibleTabs.includes('jadwal') && <button className={`tab ${activeTab === 'jadwal' ? 'active' : ''}`} onClick={() => actions.setActiveTab('jadwal')}>📅 Jadwal Guru</button>}
          {visibleTabs.includes('perkembangan') && <button className={`tab ${activeTab === 'perkembangan' ? 'active' : ''}`} onClick={() => actions.setActiveTab('perkembangan')}>📝 Input Laporan</button>}
          {visibleTabs.includes('absensi_siswa') && <button className={`tab ${activeTab === 'absensi_siswa' ? 'active' : ''}`} onClick={() => actions.setActiveTab('absensi_siswa')}>⏳ Monitor Absen</button>}
          {visibleTabs.includes('laporan_guru') && <button className={`tab ${activeTab === 'laporan_guru' ? 'active' : ''}`} onClick={() => actions.setActiveTab('laporan_guru')}>👨‍🏫 Laporan Guru</button>}
          {visibleTabs.includes('review') && <button className={`tab ${activeTab === 'review' ? 'active' : ''}`} onClick={() => actions.setActiveTab('review')}>⭐ Penilaian Guru</button>}
        

          {/* === KATEGORI KEUANGAN === */}
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', padding: '10px 10px 5px 10px', marginTop: '10px' }}>Keuangan</div>
          
          {visibleTabs.includes('laporan') && <button className={`tab ${activeTab === 'laporan' ? 'active' : ''}`} onClick={() => actions.setActiveTab('laporan')}>💰 Pemasukan</button>}
          {visibleTabs.includes('pengeluaran') && <button className={`tab ${activeTab === 'pengeluaran' ? 'active' : ''}`} onClick={() => actions.setActiveTab('pengeluaran')}>💸 Pengeluaran</button>}
          {visibleTabs.includes('payroll') && <button className={`tab ${activeTab === 'payroll' ? 'active' : ''}`} onClick={() => actions.setActiveTab('payroll')}>🧧 Gaji & Bonus</button>}

          {/* === KATEGORI PENGATURAN === */}
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', padding: '10px 10px 5px 10px', marginTop: '10px' }}>Sistem</div>
          
          {visibleTabs.includes('karyawan') && <button className={`tab ${activeTab === 'karyawan' ? 'active' : ''}`} onClick={() => actions.setActiveTab('karyawan')}>👥 Karyawan</button>}
          {visibleTabs.includes('users') && <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => actions.setActiveTab('users')}>🔑 Akun & User</button>}
          {visibleTabs.includes('cabang') && <button className={`tab ${activeTab === 'cabang' ? 'active' : ''}`} onClick={() => actions.setActiveTab('cabang')}>🏢 Cabang</button>}
          {visibleTabs.includes('program') && <button className={`tab ${activeTab === 'program' ? 'active' : ''}`} onClick={() => actions.setActiveTab('program')}>📚 Program Belajar</button>}
          {visibleTabs.includes('inventory') && <button className={`tab ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => actions.setActiveTab('inventory')}>📦 Inventaris</button>}
          {visibleTabs.includes('permissions') && <button className={`tab ${activeTab === 'permissions' ? 'active' : ''}`} onClick={() => actions.setActiveTab('permissions')}>🛡️ Hak Akses</button>}
          {visibleTabs.includes('maintenance') && <button className={`tab ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => actions.setActiveTab('maintenance')}>🛠️ Maintenance</button>}
          {visibleTabs.includes('download') && <button className={`tab ${activeTab === 'download' ? 'active' : ''}`} onClick={() => actions.setActiveTab('download')}>⬇️ Download Data</button>}

        </div>

        <div className="btn-row column sidebar-actions">
          <button className="btn btn-secondary" onClick={actions.loadAllData}>{loadingData ? 'Refreshing...' : 'Refresh data'}</button>
          <button className="btn btn-danger" onClick={actions.logout}>Logout</button>
        </div>
      </aside>

      <section className="content-area">
        <div className="glass-card topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <div className="eyebrow">{user.akses}</div>
            <h1 className="hero-title">Operasional premium {state.selectedBranch?.nama ? `• ${state.selectedBranch.nama}` : '• Semua cabang'}</h1>
            <p className="text-muted">Dashboard modern untuk cabang, kasir, absensi, inventory, payroll, dan laporan keuangan.</p>
          </div>
          
          {/* === TOMBOL SAKLAR TEMA === */}
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsLightMode(!isLightMode)}
            style={{ 
              borderRadius: '50px', 
              padding: '10px 16px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              border: isLightMode ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.2)'
            }}
          >
            {isLightMode ? '🌙 Mode Gelap' : '☀️ Mode Terang'}
          </button>
        </div>
        
        {canSeeStats && (
          <div className="grid grid-3 compact-stats">
            <StatCard label="Siswa" value={stats.siswa} />
            <StatCard label="Karyawan" value={stats.pegawai} />
            <StatCard label="Net bulan ini (Laba)" value={formatRupiah(overview.labaBulanan)} />
          </div>
        )}

        {message ? <Banner>{message}</Banner> : null}
        {errorMsg ? <Banner warning>{errorMsg}</Banner> : null}

        {/* BAGIAN YANG DIUPDATE */}
{/* === AREA KONTEN TAB === */}
        {activeTab === 'overview' && (
          <OverviewTab 
            overview={overview} 
            financeSummary={financeSummary} 
            selectedBranch={state.selectedBranch} 
            employeeBarcodeIn={state.employeeBarcodeIn} 
            employeeBarcodeOut={state.employeeBarcodeOut} 
            pembayaran={state.pembayaranTampil} 
            pengeluaran={state.pengeluaranTampil} 
            siswa={state.siswaTampil} 
            perkembangan={state.perkembanganTampil}
          />
        )}

        {/* JADWAL (Sudah dilengkapi data siswa & branches agar tidak crash) */}
        {activeTab === 'jadwal' && (
          <JadwalTab 
            siswa={state.siswaTampil} 
            users={state.usersTampil} 
            branches={state.branches} 
            perkembangan={state.perkembanganTampil}            
          />
        )}

        {activeTab === 'cabang' && <CabangTab branchForm={state.branchForm} setBranchForm={actions.setBranchForm} branches={state.branches} onSubmit={actions.submitBranch} onReset={actions.setBranchForm} onEdit={actions.startEditBranch} onDelete={actions.deleteBranch} />}
        
        {activeTab === 'program' && <ProgramTab programForm={state.programForm} setProgramForm={actions.setProgramForm} programs={state.programs} onSubmit={actions.submitProgram} onReset={actions.setProgramForm} onEdit={actions.startEditProgram} onDelete={actions.deleteProgram} />}
        
        {activeTab === 'users' && <UsersTab userForm={state.userForm} setUserForm={actions.setUserForm} users={state.usersTampil} branches={state.branches} programs={state.programs} onSubmit={actions.submitUser} onReset={actions.setUserForm} onEdit={actions.startEditUser} onDelete={actions.deleteUser} />}
        
        {activeTab === 'permissions' && <PermissionsTab users={state.usersTampil} permissionUserId={state.permissionUserId} setPermissionUserId={actions.setPermissionUserId} permissionDraft={state.permissionDraft} onTogglePermission={actions.togglePermissionDraft} onSavePermissions={actions.savePermissions} onSelectAllPermissions={actions.selectAllPermissions} onResetPermissions={actions.resetPermissionDraft} />}

        {/* SISWA (Sudah ditambah props Periode & Download sesuai request Mas) */}
        {activeTab === 'siswa' && (
          <SiswaTab 
            user={state.user} 
            siswaForm={state.siswaForm} 
            setSiswaForm={actions.setSiswaForm} 
            siswaTampil={state.siswaTampil} 
            programs={state.programs} 
            guruOptions={state.guruOptions} 
            branches={state.branches} 
            onGenerateBarcode={actions.generateStudentBarcodeAction} 
            onSubmit={actions.submitSiswa} 
            onReset={actions.setSiswaForm} 
            onEdit={actions.startEditSiswa} 
            onDelete={actions.deleteSiswa} 
            onPrintBarcode={actions.printStudentBarcode} 
            searchSiswa={state.searchSiswa} 
            setSearchSiswa={actions.setSearchSiswa}
            exportDateFrom={state.exportDateFrom}
            setExportDateFrom={actions.setExportDateFrom}
            exportDateTo={state.exportDateTo}
            setExportDateTo={actions.setExportDateTo}
            handleDownload={actions.handleDownload}
            onSendManualReminder={actions.sendManualReminderWA}
            perkembanganTampil={state.perkembanganTampil}
            transaksiTampil={state.transaksiTampil} // <--- TAMBAHKAN BARIS INI
          />
        )}
        
        {/* ... (Tab kasir, perkembangan, dll ke bawah tetap sama) ... */}
        {activeTab === 'kasir' && <KasirTab branches={state.branches} selectedBranchId={state.selectedBranchId} setSelectedBranchId={actions.setSelectedBranchId} siswaOptions={state.siswaTampil} selectedStudent={state.selectedStudent} kasirForm={state.kasirForm} setKasirForm={actions.setKasirForm} studentScanInfo={state.studentScanInfo} scanStudentActive={state.scanStudentActive} setScanStudentActive={actions.setScanStudentActive} studentScanText={state.studentScanText} onSelectStudent={actions.selectStudentById} onSubmitKasir={actions.submitKasir} onPrintReceiptDesktop={actions.printThermalReceiptDesktop} onPrintReceiptAndroid={actions.printThermalReceiptAndroid} onSendReceiptWA={actions.sendThermalReceiptWA} inventoryTampil={state.inventoryTampil} showReceiptPopup={state.showReceiptPopup} setShowReceiptPopup={actions.setShowReceiptPopup} lastReceipt={state.lastReceipt} />}
        
        {activeTab === 'perkembangan' && <PerkembanganTab user={state.user} perkembanganForm={state.perkembanganForm} setPerkembanganForm={actions.setPerkembanganForm} siswaTampil={state.siswaTampil} guruOptions={state.guruOptions} perkembanganHistory={state.perkembanganHistory} selectedProgressStudent={state.selectedProgressStudent} progressInputMode={state.progressInputMode} setProgressInputMode={actions.setProgressInputMode} scanStudentActive={state.scanStudentActive} setScanStudentActive={actions.setScanStudentActive} studentScanInfo={state.studentScanInfo} onSelectProgressStudent={actions.selectProgressStudentById} onSubmit={actions.submitPerkembangan} onSendPerkembanganWA={actions.sendPerkembanganWA} perkembanganTampil={state.perkembanganTampil} onDeletePerkembangan={actions.deletePerkembangan} />}
        {activeTab === 'karyawan' && <KaryawanTab currentUser={state.user} employeeMode={state.employeeMode} setEmployeeMode={actions.setEmployeeMode} scanEmployeeActive={state.scanEmployeeActive} setScanEmployeeActive={actions.setScanEmployeeActive} employeeScanInfo={state.employeeScanInfo} employeeScanText={state.employeeScanText} absensiKaryawan={state.absensiKaryawanTampil} employeeBarcodeIn={state.employeeBarcodeIn} employeeBarcodeOut={state.employeeBarcodeOut} employeeManualForm={state.employeeManualForm} setEmployeeManualForm={actions.setEmployeeManualForm} users={state.usersTampil} onSubmitManual={actions.submitEmployeeManualAttendance} />}
        {activeTab === 'review' && <ReviewsTab reviewForm={state.reviewForm} setReviewForm={actions.setReviewForm} users={state.usersTampil} reviews={state.reviewsTampil} onAddItem={actions.addReviewItem} onChangeItem={actions.changeReviewItem} onRemoveItem={actions.removeReviewItem} onSubmitReview={actions.submitReview} onPrintReview={actions.printEmployeeReview} />}
        {activeTab === 'pengeluaran' && <PengeluaranTab pengeluaranForm={state.pengeluaranForm} setPengeluaranForm={actions.setPengeluaranForm} pengeluaran={state.pengeluaranTampil} branches={state.branches} onSubmit={actions.submitPengeluaran} onEdit={actions.startEditPengeluaran} onDelete={actions.deletePengeluaran} onReset={actions.setPengeluaranForm} />}
        {activeTab === 'inventory' && <InventoryTab inventoryForm={state.inventoryForm} setInventoryForm={actions.setInventoryForm} inventory={state.inventoryTampil} branches={state.branches} onSubmit={actions.submitInventory} onEdit={actions.startEditInventory} onDelete={actions.deleteInventory} />}
        
        {activeTab === 'payroll' && (
          <PayrollTab 
            payrollRows={state.payrollRows} bonusForm={state.bonusForm} setBonusForm={actions.setBonusForm} 
            users={state.usersTampil} bonusManual={state.bonusManualTampil} onSubmitBonus={actions.submitBonus} 
            onCatatGaji={actions.catatPengeluaranGaji} branches={state.branches} payrollMonth={state.payrollMonth} 
            setPayrollMonth={actions.setPayrollMonth} payrollYear={state.payrollYear} setPayrollYear={actions.setPayrollYear} 
            openSmartWA={actions.openSmartWA} actions={actions}
          />
        )}
        
        {activeTab === 'laporan' && (
          <LaporanTab 
            financeSummary={financeSummary} pembayaran={state.pembayaranTampil} branches={state.branches} 
            selectedBranchId={state.selectedBranchId} setSelectedBranchId={actions.setSelectedBranchId} 
            searchTransaksi={state.searchTransaksi} setSearchTransaksi={actions.setSearchTransaksi} 
            onDeleteTransaksi={actions.deleteTransaksi} editTransaksiForm={state.editTransaksiForm} 
            setEditTransaksiForm={actions.setEditTransaksiForm} onSubmitEditTransaksi={actions.submitEditTransaksi} 
            onStartEditTransaksi={actions.startEditTransaksi} pengeluaran={state.pengeluaranTampil}
            onSendWA={actions.sendHistoryTransactionWA}
            canSeeStats={canSeeStats} /* <--- INI KUNCI YANG KETINGGALAN */
          />
        )}

        {/* TAB LAPORAN GURU BARU */}
        {activeTab === 'laporan_guru' && (
          <LaporanGuruTab 
            users={state.usersTampil} 
            perkembanganTampil={state.perkembanganTampil} 
            siswaTampil={state.siswaTampil}
            absensiSiswa={state.absensiSiswaTampil} 
          />
        )}
        {activeTab === 'absensi_siswa' && (
          <AbsensiSiswaTab 
            siswaTampil={state.siswaTampil}
            perkembanganTampil={state.perkembanganTampil}
            openSmartWA={actions.openSmartWA}
          />
        )}
        {activeTab === 'download' && <DownloadTab exportType={state.exportType} setExportType={actions.setExportType} exportDateFrom={state.exportDateFrom} exportDateTo={state.exportDateTo} setExportDateFrom={actions.setExportDateFrom} setExportDateTo={actions.setExportDateTo} onQuickRange={actions.setQuickExportRange} onDownload={actions.handleDownload} selectedBranch={state.selectedBranch} />}
        {activeTab === 'maintenance' && <MaintenanceTab pembayaran={state.pembayaranTampil} perkembangan={state.perkembanganTampil} onTriggerArchive={actions.triggerManualArchive} />}
       
        {state.deleteConfirm.show && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div className="glass-card" style={{ width: '90%', maxWidth: '400px', padding: '30px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', animation: 'fadeIn 0.2s ease-out' }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>🗑️</div>
              <h2 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>Konfirmasi Hapus</h2>
              <p className="text-muted" style={{ marginBottom: '25px', fontSize: '14px' }}>
                Apakah Anda yakin ingin menghapus <b style={{ color: '#ef4444' }}>{state.deleteConfirm.label}</b>?
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-danger" onClick={actions.confirmDelete} style={{ flex: 1, padding: '12px' }}>Ya, Hapus</button>
                <button className="btn btn-secondary" onClick={() => actions.setDeleteConfirm({ show: false, table: '', id: '', label: '' })} style={{ flex: 1, padding: '12px' }}>Batal</button>
              </div>
            </div>
          </div>
        )}

        {state.archiveState.show && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999 }}>
            <div className="glass-card" style={{ width: '90%', maxWidth: '400px', padding: '30px', textAlign: 'center', border: `1px solid ${state.archiveState.forced ? '#ef4444' : '#eab308'}`, animation: 'fadeIn 0.2s ease-out' }}>
              <h2 style={{ color: state.archiveState.forced ? '#ef4444' : '#eab308' }}>Otorisasi Required</h2>
              <input 
                type="password" placeholder="Password..." 
                value={state.archiveState.password}
                onChange={(e) => actions.setArchiveState(prev => ({ ...prev, password: e.target.value }))}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', margin: '20px 0', background: 'rgba(255,255,255,0.1)', color: 'white' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary" onClick={actions.executeArchive} disabled={state.archiveState.loading} style={{ flex: 1 }}>📦 Eksekusi</button>
                {!state.archiveState.forced && <button className="btn btn-secondary" onClick={() => actions.setArchiveState({ show: false, forced: false, password: '', loading: false, months: 6 })} style={{ flex: 1 }}>Batal</button>}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
