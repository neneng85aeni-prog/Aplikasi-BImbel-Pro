import { useEffect, useState } from 'react'
import { Banner } from './ui/Banner'
import { StatCard } from './ui/StatCard'
import { TAB_LABELS } from '../lib/constants'
import { formatRupiah } from '../lib/format'
import { HariLiburTab } from './tabs/HariLiburTab'
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
import { PengingatAbsenTab } from './tabs/PengingatAbsenTab'
import { MaintenanceTab } from './tabs/MaintenanceTab'

export function Dashboard({ state, actions }) {
  const { user, activeTab, message, errorMsg, loadingData, visibleTabs, stats, overview, financeSummary } = state
  
  // === STATE UNTUK TEMA & MENU HP ===
  const [isLightMode, setIsLightMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // === FITUR AUTO-REDIRECT TAB ===
  useEffect(() => {
    if (visibleTabs && visibleTabs.length > 0 && !visibleTabs.includes(activeTab)) {
      if (activeTab !== 'laporan_guru' && activeTab !== 'hari_libur' && activeTab !== 'pengingat_absen') {
        actions.setActiveTab(visibleTabs[0]);
      }
    }
  }, [activeTab, visibleTabs, actions]);

  const canSeeStats = visibleTabs.includes('overview');

  // Fungsi helper: Ubah tab dan otomatis TUTUP menu hamburger di HP
  const handleTabClick = (tabName) => {
    actions.setActiveTab(tabName);
    setIsMobileMenuOpen(false); 
  };

  return (
    <main className={`app-shell ${isLightMode ? 'light-theme' : ''}`}>
      <style>{`
        /* Sembunyikan actions mobile di layar desktop (laptop) */
        .mobile-actions { display: none; }
        
        @media (max-width: 768px) {
          /* 1. Kembalikan fungsi scroll alami layar HP */
          body, html { overflow-x: hidden !important; width: 100%; margin: 0; padding: 0; }
          .app-shell { 
            display: block !important; 
            min-height: 100vh; width: 100vw; 
          }
          
          /* 2. Jadikan sidebar sebagai Header Atas yang menempel (Sticky) */
          .sidebar { 
            position: sticky; top: 0; z-index: 999; width: 100% !important; 
            box-sizing: border-box; border-right: none !important; 
            border-bottom: 1px solid rgba(255,255,255,0.1); 
            padding: 12px 16px !important; border-radius: 0 !important; 
            background: ${isLightMode ? '#ffffff' : '#1e293b'}; 
          }
          
          .sidebar-header { display: flex; justify-content: space-between; align-items: center; width: 100%; }
          .hide-on-mobile { display: none !important; }
          .sidebar-actions { display: none !important; }
          .mobile-actions { display: flex !important; gap: 8px; align-items: center; }
          
          /* 3. Menu berubah jadi Dropdown Mengambang */
          .nav-stack { 
            position: absolute; top: 100%; left: 0; width: 100%; 
            background: ${isLightMode ? '#ffffff' : '#1e293b'}; 
            display: flex !important; flex-direction: column !important; 
            max-height: calc(100vh - 60px); overflow-y: auto !important; 
            gap: 5px; padding: 15px; margin: 0 !important; 
            box-shadow: 0 15px 25px rgba(0,0,0,0.6); border-bottom: 2px solid #334155;
            box-sizing: border-box; z-index: 1000;
          }
          .nav-stack.mobile-closed { display: none !important; }
          .nav-stack .tab { width: 100%; text-align: left; padding: 12px 16px; border-radius: 8px; }
          
          /* 4. Area Konten Utama bebas di-scroll dari atas ke bawah */
          .content-area { 
            padding: 15px !important; width: 100%; box-sizing: border-box; 
            display: block !important; overflow-x: hidden !important;
          }
          
          .topbar { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; width: 100%; }
          .topbar h1 { font-size: 16px !important; line-height: 1.4; white-space: normal; }
          .topbar p { display: none !important; }
          
          .compact-stats { 
            display: flex !important; flex-direction: column !important; 
            gap: 12px; padding-bottom: 10px; margin-bottom: 10px; width: 100%; 
          }
          .compact-stats > div { width: 100% !important; padding: 15px !important; box-sizing: border-box; }

          /* ======================================================== */
          /* KUNCI PERBAIKAN MENU KASIR & PERKEMBANGAN (HP ONLY)     */
          /* ======================================================== */

          /* A. Hancurkan layout 2 kolom di Kasir. Paksa menyusun ke bawah! */
          .content-area div[style*="grid-template-columns"] {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            gap: 15px !important;
          }

          /* B. Jika menu dibungkus dengan flex biasa, pastikan dia melipat (wrap) ke bawah */
          .content-area > div > div[style*="display: flex"] {
            flex-wrap: wrap !important;
          }
          
          /* C. Mencegah Kartu meluber (Terpotong di menu Perkembangan) */
          .glass-card {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            margin-left: 0 !important; 
            margin-right: 0 !important;
            overflow-x: hidden !important; /* Tutup luapan */
          }

          /* D. Jinakkan input, select, dan tombol agar tidak mendorong kartu */
          input, select, textarea, button {
            max-width: 100% !important;
            box-sizing: border-box !important;
          }

          /* E. Tabel Data panjang bisa di-geser ke samping di dalam kotaknya saja */
          .content-area div[style*="overflow-x: auto"],
          .content-area table {
            max-width: 100% !important;
            display: block !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch; /* Kelancaran scroll di iPhone */
          }
        }
      `}</style>

      <aside className="sidebar glass-card">
        <div className="sidebar-header">
          <div>
            <div className="eyebrow">Bimbel Pro</div>
            <h1 className="sidebar-title" style={{ margin: 0, fontSize: '18px' }}>Final Stable</h1>
            <p className="text-muted hide-on-mobile">{user.nama}<br />{user.email}</p>
          </div>
          
          {/* === TOMBOL MENU & LOGOUT KHUSUS HP === */}
          <div className="mobile-actions">
            <button 
              className="btn btn-secondary btn-small"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{ padding: '6px 12px', fontSize: '16px', borderRadius: '6px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              {isMobileMenuOpen ? '✖ Tutup' : '☰ Menu'}
            </button>
            <button 
              className="btn btn-danger btn-small" 
              onClick={actions.logout} 
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px' }}
            >
              🚪 Keluar
            </button>
          </div>
        </div>

        <div className={`nav-stack ${!isMobileMenuOpen ? 'mobile-closed' : ''}`}>
          
          {/* === KATEGORI UTAMA === */}
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', padding: '10px 10px 5px 10px', marginTop: '5px' }}>Utama</div>
          {visibleTabs.includes('overview') && <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => handleTabClick('overview')}>📊 Dashboard</button>}
          {visibleTabs.includes('kasir') && <button className={`tab ${activeTab === 'kasir' ? 'active' : ''}`} onClick={() => handleTabClick('kasir')}>🧾 Kasir</button>}

          {/* === KATEGORI AKADEMIK === */}
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', padding: '10px 10px 5px 10px', marginTop: '10px' }}>Akademik</div>
          {visibleTabs.includes('siswa') && <button className={`tab ${activeTab === 'siswa' ? 'active' : ''}`} onClick={() => handleTabClick('siswa')}>👨‍🎓 Data Siswa</button>}
          {visibleTabs.includes('jadwal') && <button className={`tab ${activeTab === 'jadwal' ? 'active' : ''}`} onClick={() => handleTabClick('jadwal')}>📅 Jadwal Guru</button>}
          {visibleTabs.includes('perkembangan') && <button className={`tab ${activeTab === 'perkembangan' ? 'active' : ''}`} onClick={() => handleTabClick('perkembangan')}>📝 Input Laporan</button>}
          {visibleTabs.includes('absensi_siswa') && <button className={`tab ${activeTab === 'absensi_siswa' ? 'active' : ''}`} onClick={() => handleTabClick('absensi_siswa')}>⏳ Monitor Absen</button>}
          <button className={`tab ${activeTab === 'pengingat_absen' ? 'active' : ''}`} onClick={() => handleTabClick('pengingat_absen')}>🔔 Pengingat Absen</button>
          {visibleTabs.includes('laporan_guru') && <button className={`tab ${activeTab === 'laporan_guru' ? 'active' : ''}`} onClick={() => handleTabClick('laporan_guru')}>👨‍🏫 Laporan Guru</button>}
          {visibleTabs.includes('review') && <button className={`tab ${activeTab === 'review' ? 'active' : ''}`} onClick={() => handleTabClick('review')}>⭐ Penilaian Guru</button>}
        
          {/* === KATEGORI KEUANGAN === */}
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', padding: '10px 10px 5px 10px', marginTop: '10px' }}>Keuangan</div>
          {visibleTabs.includes('laporan') && <button className={`tab ${activeTab === 'laporan' ? 'active' : ''}`} onClick={() => handleTabClick('laporan')}>💰 Pemasukan</button>}
          {visibleTabs.includes('pengeluaran') && <button className={`tab ${activeTab === 'pengeluaran' ? 'active' : ''}`} onClick={() => handleTabClick('pengeluaran')}>💸 Pengeluaran</button>}
          {visibleTabs.includes('payroll') && <button className={`tab ${activeTab === 'payroll' ? 'active' : ''}`} onClick={() => handleTabClick('payroll')}>🧧 Gaji & Bonus</button>}

          {/* === KATEGORI PENGATURAN === */}
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', padding: '10px 10px 5px 10px', marginTop: '10px' }}>Sistem</div>
          {visibleTabs.includes('karyawan') && <button className={`tab ${activeTab === 'karyawan' ? 'active' : ''}`} onClick={() => handleTabClick('karyawan')}>👥 Karyawan</button>}
          {visibleTabs.includes('users') && <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => handleTabClick('users')}>🔑 Akun & User</button>}
          {visibleTabs.includes('cabang') && <button className={`tab ${activeTab === 'cabang' ? 'active' : ''}`} onClick={() => handleTabClick('cabang')}>🏢 Cabang</button>}
          {visibleTabs.includes('program') && <button className={`tab ${activeTab === 'program' ? 'active' : ''}`} onClick={() => handleTabClick('program')}>📚 Program Belajar</button>}
          {visibleTabs.includes('inventory') && <button className={`tab ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => handleTabClick('inventory')}>📦 Inventaris</button>}
          {visibleTabs.includes('permissions') && <button className={`tab ${activeTab === 'permissions' ? 'active' : ''}`} onClick={() => handleTabClick('permissions')}>🛡️ Hak Akses</button>}
          {visibleTabs.includes('maintenance') && <button className={`tab ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => handleTabClick('maintenance')}>🛠️ Maintenance</button>}
          <button className={`tab ${activeTab === 'hari_libur' ? 'active' : ''}`} onClick={() => handleTabClick('hari_libur')}>🗓️ Hari Libur</button>
          {visibleTabs.includes('download') && <button className={`tab ${activeTab === 'download' ? 'active' : ''}`} onClick={() => handleTabClick('download')}>⬇️ Download Data</button>}
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

        {/* === AREA KONTEN TAB === */}
        {activeTab === 'overview' && (
          <OverviewTab overview={overview} financeSummary={financeSummary} selectedBranch={state.selectedBranch} employeeBarcodeIn={state.employeeBarcodeIn} employeeBarcodeOut={state.employeeBarcodeOut} pembayaran={state.pembayaranTampil} pengeluaran={state.pengeluaranTampil} siswa={state.siswaTampil} perkembangan={state.perkembanganTampil}/>
        )}
        {activeTab === 'jadwal' && <JadwalTab siswa={state.siswaTampil} users={state.usersTampil} branches={state.branches} perkembangan={state.perkembanganTampil} />}
        {activeTab === 'cabang' && <CabangTab branchForm={state.branchForm} setBranchForm={actions.setBranchForm} branches={state.branches} onSubmit={actions.submitBranch} onReset={actions.setBranchForm} onEdit={actions.startEditBranch} onDelete={actions.deleteBranch} />}
        {activeTab === 'program' && <ProgramTab programForm={state.programForm} setProgramForm={actions.setProgramForm} programs={state.programs} onSubmit={actions.submitProgram} onReset={actions.setProgramForm} onEdit={actions.startEditProgram} onDelete={actions.deleteProgram} />}
        {activeTab === 'users' && <UsersTab userForm={state.userForm} setUserForm={actions.setUserForm} users={state.usersTampil} branches={state.branches} programs={state.programs} onSubmit={actions.submitUser} onReset={actions.setUserForm} onEdit={actions.startEditUser} onDelete={actions.deleteUser} />}
        {activeTab === 'permissions' && <PermissionsTab users={state.usersTampil} permissionUserId={state.permissionUserId} setPermissionUserId={actions.setPermissionUserId} permissionDraft={state.permissionDraft} onTogglePermission={actions.togglePermissionDraft} onSavePermissions={actions.savePermissions} onSelectAllPermissions={actions.selectAllPermissions} onResetPermissions={actions.resetPermissionDraft} />}
        
        {activeTab === 'siswa' && (
          <SiswaTab user={state.user} siswaForm={state.siswaForm} setSiswaForm={actions.setSiswaForm} siswaTampil={state.siswaTampil} programs={state.programs} guruOptions={state.guruOptions} branches={state.branches} onGenerateBarcode={actions.generateStudentBarcodeAction} onSubmit={actions.submitSiswa} onReset={actions.setSiswaForm} onEdit={actions.startEditSiswa} onDelete={actions.deleteSiswa} onPrintBarcode={actions.printStudentBarcode} searchSiswa={state.searchSiswa} setSearchSiswa={actions.setSearchSiswa} exportDateFrom={state.exportDateFrom} setExportDateFrom={actions.setExportDateFrom} exportDateTo={state.exportDateTo} setExportDateTo={actions.setExportDateTo} handleDownload={actions.handleDownload} onSendManualReminder={actions.sendManualReminderWA} perkembanganTampil={state.perkembanganTampil} transaksiTampil={state.transaksiTampil} />
        )}
        
        {activeTab === 'kasir' && <KasirTab branches={state.branches} selectedBranchId={state.selectedBranchId} setSelectedBranchId={actions.setSelectedBranchId} siswaOptions={state.siswaTampil} selectedStudent={state.selectedStudent} kasirForm={state.kasirForm} setKasirForm={actions.setKasirForm} studentScanInfo={state.studentScanInfo} scanStudentActive={state.scanStudentActive} setScanStudentActive={actions.setScanStudentActive} studentScanText={state.studentScanText} onSelectStudent={actions.selectStudentById} onSubmitKasir={actions.submitKasir} onPrintReceiptDesktop={actions.printThermalReceiptDesktop} onPrintReceiptAndroid={actions.printThermalReceiptAndroid} onSendReceiptWA={actions.sendThermalReceiptWA} inventoryTampil={state.inventoryTampil} showReceiptPopup={state.showReceiptPopup} setShowReceiptPopup={actions.setShowReceiptPopup} lastReceipt={state.lastReceipt} />}
        {activeTab === 'perkembangan' && <PerkembanganTab user={state.user} perkembanganForm={state.perkembanganForm} setPerkembanganForm={actions.setPerkembanganForm} siswaTampil={state.siswaTampil} guruOptions={state.guruOptions} perkembanganHistory={state.perkembanganHistory} selectedProgressStudent={state.selectedProgressStudent} progressInputMode={state.progressInputMode} setProgressInputMode={actions.setProgressInputMode} scanStudentActive={state.scanStudentActive} setScanStudentActive={actions.setScanStudentActive} studentScanInfo={state.studentScanInfo} onSelectProgressStudent={actions.selectProgressStudentById} onSubmit={actions.submitPerkembangan} onSendPerkembanganWA={actions.sendPerkembanganWA} perkembanganTampil={state.perkembanganTampil} onDeletePerkembangan={actions.deletePerkembangan} />}
        {activeTab === 'karyawan' && <KaryawanTab currentUser={state.user} employeeMode={state.employeeMode} setEmployeeMode={actions.setEmployeeMode} scanEmployeeActive={state.scanEmployeeActive} setScanEmployeeActive={actions.setScanEmployeeActive} employeeScanInfo={state.employeeScanInfo} employeeScanText={state.employeeScanText} absensiKaryawan={state.absensiKaryawanTampil} employeeBarcodeIn={state.employeeBarcodeIn} employeeBarcodeOut={state.employeeBarcodeOut} employeeManualForm={state.employeeManualForm} setEmployeeManualForm={actions.setEmployeeManualForm} users={state.usersTampil} onSubmitManual={actions.submitEmployeeManualAttendance} />}
        {activeTab === 'review' && <ReviewsTab reviewForm={state.reviewForm} setReviewForm={actions.setReviewForm} users={state.usersTampil} reviews={state.reviewsTampil} onAddItem={actions.addReviewItem} onChangeItem={actions.changeReviewItem} onRemoveItem={actions.removeReviewItem} onSubmitReview={actions.submitReview} onPrintReview={actions.printEmployeeReview} />}
        {activeTab === 'pengeluaran' && <PengeluaranTab pengeluaranForm={state.pengeluaranForm} setPengeluaranForm={actions.setPengeluaranForm} pengeluaran={state.pengeluaranTampil} branches={state.branches} onSubmit={actions.submitPengeluaran} onEdit={actions.startEditPengeluaran} onDelete={actions.deletePengeluaran} onReset={actions.setPengeluaranForm} />}
        {activeTab === 'inventory' && <InventoryTab inventoryForm={state.inventoryForm} setInventoryForm={actions.setInventoryForm} inventory={state.inventoryTampil} branches={state.branches} onSubmit={actions.submitInventory} onEdit={actions.startEditInventory} onDelete={actions.deleteInventory} />}
        {activeTab === 'payroll' && <PayrollTab payrollRows={state.payrollRows} bonusForm={state.bonusForm} setBonusForm={actions.setBonusForm} users={state.usersTampil} bonusManual={state.bonusManualTampil} onSubmitBonus={actions.submitBonus} onCatatGaji={actions.catatPengeluaranGaji} branches={state.branches} payrollMonth={state.payrollMonth} setPayrollMonth={actions.setPayrollMonth} payrollYear={state.payrollYear} setPayrollYear={actions.setPayrollYear} openSmartWA={actions.openSmartWA} actions={actions} />}
        {activeTab === 'laporan' && <LaporanTab financeSummary={financeSummary} pembayaran={state.pembayaranTampil} branches={state.branches} selectedBranchId={state.selectedBranchId} setSelectedBranchId={actions.setSelectedBranchId} searchTransaksi={state.searchTransaksi} setSearchTransaksi={actions.setSearchTransaksi} onDeleteTransaksi={actions.deleteTransaksi} editTransaksiForm={state.editTransaksiForm} setEditTransaksiForm={actions.setEditTransaksiForm} onSubmitEditTransaksi={actions.submitEditTransaksi} onStartEditTransaksi={actions.startEditTransaksi} pengeluaran={state.pengeluaranTampil} onSendWA={actions.sendHistoryTransactionWA} canSeeStats={canSeeStats} />}
        {activeTab === 'laporan_guru' && <LaporanGuruTab users={state.usersTampil} perkembanganTampil={state.perkembanganTampil} siswaTampil={state.siswaTampil} absensiSiswa={state.absensiSiswaTampil} />}
        {activeTab === 'absensi_siswa' && <AbsensiSiswaTab siswaTampil={state.siswaTampil} perkembanganTampil={state.perkembanganTampil} openSmartWA={actions.openSmartWA} />}
        {activeTab === 'pengingat_absen' && <PengingatAbsenTab siswa={state.siswaTampil} perkembangan={state.perkembanganTampil} />}
        {activeTab === 'download' && <DownloadTab exportType={state.exportType} setExportType={actions.setExportType} exportDateFrom={state.exportDateFrom} exportDateTo={state.exportDateTo} setExportDateFrom={actions.setExportDateFrom} setExportDateTo={actions.setExportDateTo} onQuickRange={actions.setQuickExportRange} onDownload={actions.handleDownload} selectedBranch={state.selectedBranch} />}
        {activeTab === 'maintenance' && <MaintenanceTab pembayaran={state.pembayaranTampil} perkembangan={state.perkembanganTampil} onTriggerArchive={actions.triggerManualArchive} />}
        {activeTab === 'hari_libur' && <HariLiburTab />}    
        
        {/* === POPUPS (Delete & Archive) === */}
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
