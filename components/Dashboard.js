import { useEffect } from 'react'
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
import { KasirTab } from './tabs/KasirTab'
import { PerkembanganTab } from './tabs/PerkembanganTab'
import { KaryawanTab } from './tabs/KaryawanTab'
import { ReviewsTab } from './tabs/ReviewsTab'
import { LaporanTab } from './tabs/LaporanTab'
import { PayrollTab } from './tabs/PayrollTab'
import { DownloadTab } from './tabs/DownloadTab'
import { PengeluaranTab } from './tabs/PengeluaranTab'
import { InventoryTab } from './tabs/InventoryTab'
import { MaintenanceTab } from './tabs/MaintenanceTab'

export function Dashboard({ state, actions }) {
  const { user, activeTab, message, errorMsg, loadingData, visibleTabs, stats, overview, financeSummary } = state

  // === FITUR AUTO-REDIRECT TAB ===
  // Jika tab yang sedang aktif saat ini TIDAK ADA di daftar izin tab user, 
  // langsung lempar user ke tab urutan pertama yang mereka miliki aksesnya.
  useEffect(() => {
    if (visibleTabs && visibleTabs.length > 0 && !visibleTabs.includes(activeTab)) {
      actions.setActiveTab(visibleTabs[0]);
    }
  }, [activeTab, visibleTabs, actions]);

  // Cek apakah user punya izin melihat Overview untuk memunculkan Kartu Statistik
  const canSeeStats = visibleTabs.includes('overview');

  return (
    <main className="app-shell">
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
          
          /* KODE BARU: CARD STATISTIK JADI KE SAMPING DAN KECIL DI HP */
          .compact-stats {
            display: flex !important;
            flex-direction: row !important;
            overflow-x: auto !important;
            gap: 10px;
            padding-bottom: 10px;
            margin-bottom: 10px;
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .compact-stats::-webkit-scrollbar {
            display: none;
          }
          .compact-stats > div {
            flex: 0 0 140px !important; 
            padding: 12px !important;
          }
          .compact-stats h3, .compact-stats span, .compact-stats div.text-muted {
            font-size: 12px !important; 
          }
          .compact-stats p, .compact-stats div.text-2xl, .compact-stats b {
            font-size: 16px !important; 
          }
        }
        @media (min-width: 769px) {
          .mobile-actions { display: none !important; }
        }
      `}</style>

      <aside className="sidebar glass-card">
        <div className="sidebar-header">
          <div>
            <div className="eyebrow">Bimbel Pro</div>
            <h1 className="sidebar-title">Final Stable</h1>
            <p className="text-muted hide-on-mobile">{user.nama}<br />{user.email}</p>
          </div>
          <div className="mobile-actions">
            <button className="btn btn-secondary btn-small" onClick={actions.loadAllData}>↻</button>
            <button className="btn btn-danger btn-small" onClick={actions.logout}>Logout</button>
          </div>
        </div>

        <div className="nav-stack">
          {visibleTabs.map((tab) => <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => actions.setActiveTab(tab)}>{TAB_LABELS[tab] || tab}</button>)}
        </div>

        <div className="btn-row column sidebar-actions">
          <button className="btn btn-secondary" onClick={actions.loadAllData}>{loadingData ? 'Refreshing...' : 'Refresh data'}</button>
          <button className="btn btn-danger" onClick={actions.logout}>Logout</button>
        </div>
      </aside>

      <section className="content-area">
        <div className="glass-card topbar">
          <div>
            <div className="eyebrow">{user.akses}</div>
            <h1 className="hero-title">Operasional premium {state.selectedBranch?.nama ? `• ${state.selectedBranch.nama}` : '• Semua cabang'}</h1>
            <p className="text-muted">Dashboard modern untuk cabang, kasir, absensi, inventory, payroll, dan laporan keuangan.</p>
          </div>
        </div>
        
        {/* SEMBUNYIKAN STATS JIKA BUKAN MASTER/ADMIN/YANG PUNYA AKSES OVERVIEW */}
        {canSeeStats && (
          <div className="grid grid-3 compact-stats">
            <StatCard label="Siswa" value={stats.siswa} />
            <StatCard label="Karyawan" value={stats.pegawai} />
            <StatCard label="Net bulan ini (Laba)" value={formatRupiah(overview.labaBulanan)} />
          </div>
        )}

        {message ? <Banner>{message}</Banner> : null}
        {errorMsg ? <Banner warning>{errorMsg}</Banner> : null}

        {activeTab === 'overview' && <OverviewTab overview={overview} financeSummary={financeSummary} selectedBranch={state.selectedBranch} employeeBarcodeIn={state.employeeBarcodeIn} employeeBarcodeOut={state.employeeBarcodeOut} />}
        {activeTab === 'cabang' && <CabangTab branchForm={state.branchForm} setBranchForm={actions.setBranchForm} branches={state.branches} onSubmit={actions.submitBranch} onReset={actions.setBranchForm} onEdit={actions.startEditBranch} onDelete={actions.deleteBranch} />}
        {activeTab === 'program' && <ProgramTab programForm={state.programForm} setProgramForm={actions.setProgramForm} programs={state.programs} onSubmit={actions.submitProgram} onReset={actions.setProgramForm} onEdit={actions.startEditProgram} onDelete={actions.deleteProgram} />}
        {activeTab === 'users' && <UsersTab userForm={state.userForm} setUserForm={actions.setUserForm} users={state.usersTampil} branches={state.branches} onSubmit={actions.submitUser} onReset={actions.setUserForm} onEdit={actions.startEditUser} onDelete={actions.deleteUser} />}
        {activeTab === 'permissions' && <PermissionsTab users={state.usersTampil} permissionUserId={state.permissionUserId} setPermissionUserId={actions.setPermissionUserId} permissionDraft={state.permissionDraft} onTogglePermission={actions.togglePermissionDraft} onSavePermissions={actions.savePermissions} onSelectAllPermissions={actions.selectAllPermissions} onResetPermissions={actions.resetPermissionDraft} />}
        {activeTab === 'siswa' && <SiswaTab user={state.user} siswaForm={state.siswaForm} setSiswaForm={actions.setSiswaForm} siswaTampil={state.siswaTampil} programs={state.programs} guruOptions={state.guruOptions} branches={state.branches} onGenerateBarcode={actions.generateStudentBarcodeAction} onSubmit={actions.submitSiswa} onReset={actions.setSiswaForm} onEdit={actions.startEditSiswa} onDelete={actions.deleteSiswa} onPrintBarcode={actions.printStudentBarcode} perkembanganForm={state.perkembanganForm} setPerkembanganForm={actions.setPerkembanganForm} onSubmitPerkembangan={actions.submitPerkembangan} searchSiswa={state.searchSiswa} setSearchSiswa={actions.setSearchSiswa} />}
        
        {activeTab === 'kasir' && <KasirTab branches={state.branches} selectedBranchId={state.selectedBranchId} setSelectedBranchId={actions.setSelectedBranchId} siswaOptions={state.siswaTampil} selectedStudent={state.selectedStudent} kasirForm={state.kasirForm} setKasirForm={actions.setKasirForm} studentScanInfo={state.studentScanInfo} scanStudentActive={state.scanStudentActive} setScanStudentActive={actions.setScanStudentActive} studentScanText={state.studentScanText} onSelectStudent={actions.selectStudentById} onSubmitKasir={actions.submitKasir} onPrintReceiptDesktop={actions.printThermalReceiptDesktop} onPrintReceiptAndroid={actions.printThermalReceiptAndroid} onSendReceiptWA={actions.sendThermalReceiptWA} inventoryTampil={state.inventoryTampil} showReceiptPopup={state.showReceiptPopup} setShowReceiptPopup={actions.setShowReceiptPopup} lastReceipt={state.lastReceipt} />}
        
        {activeTab === 'perkembangan' && <PerkembanganTab user={state.user} perkembanganForm={state.perkembanganForm} setPerkembanganForm={actions.setPerkembanganForm} siswaTampil={state.siswaTampil} guruOptions={state.guruOptions} perkembanganHistory={state.perkembanganHistory} selectedProgressStudent={state.selectedProgressStudent} progressInputMode={state.progressInputMode} setProgressInputMode={actions.setProgressInputMode} scanStudentActive={state.scanStudentActive} setScanStudentActive={actions.setScanStudentActive} studentScanInfo={state.studentScanInfo} onSelectProgressStudent={actions.selectProgressStudentById} onSubmit={actions.submitPerkembangan} onSendPerkembanganWA={actions.sendPerkembanganWA} perkembanganTampil={state.perkembanganTampil} />}
        {activeTab === 'karyawan' && <KaryawanTab currentUser={state.user} employeeMode={state.employeeMode} setEmployeeMode={actions.setEmployeeMode} scanEmployeeActive={state.scanEmployeeActive} setScanEmployeeActive={actions.setScanEmployeeActive} employeeScanInfo={state.employeeScanInfo} employeeScanText={state.employeeScanText} absensiKaryawan={state.absensiKaryawanTampil} employeeBarcodeIn={state.employeeBarcodeIn} employeeBarcodeOut={state.employeeBarcodeOut} employeeManualForm={state.employeeManualForm} setEmployeeManualForm={actions.setEmployeeManualForm} users={state.usersTampil} onSubmitManual={actions.submitEmployeeManualAttendance} />}
        {activeTab === 'review' && <ReviewsTab reviewForm={state.reviewForm} setReviewForm={actions.setReviewForm} users={state.usersTampil} reviews={state.reviewsTampil} onAddItem={actions.addReviewItem} onChangeItem={actions.changeReviewItem} onRemoveItem={actions.removeReviewItem} onSubmitReview={actions.submitReview} onPrintReview={actions.printEmployeeReview} />}
        {activeTab === 'pengeluaran' && <PengeluaranTab pengeluaranForm={state.pengeluaranForm} setPengeluaranForm={actions.setPengeluaranForm} pengeluaran={state.pengeluaranTampil} branches={state.branches} onSubmit={actions.submitPengeluaran} onEdit={actions.startEditPengeluaran} onDelete={actions.deletePengeluaran} onReset={actions.setPengeluaranForm} />}
        
        {/* INVENTORY TAB FIX */}
        {activeTab === 'inventory' && <InventoryTab inventoryForm={state.inventoryForm} setInventoryForm={actions.setInventoryForm} inventory={state.inventoryTampil} branches={state.branches} onSubmit={actions.submitInventory} onEdit={actions.startEditInventory} onDelete={actions.deleteInventory} />}
        
        {activeTab === 'payroll' && (
          <PayrollTab 
            payrollRows={state.payrollRows} 
            bonusForm={state.bonusForm} 
            setBonusForm={actions.setBonusForm} 
            users={state.usersTampil} 
            bonusManual={state.bonusManualTampil} 
            onSubmitBonus={actions.submitBonus} 
            onCatatGaji={actions.catatPengeluaranGaji} 
            branches={state.branches} 
            payrollMonth={state.payrollMonth} 
            setPayrollMonth={actions.setPayrollMonth} 
            payrollYear={state.payrollYear} 
            setPayrollYear={actions.setPayrollYear} 
            openSmartWA={actions.openSmartWA} 
            actions={actions}
          />
        )}
        
        {activeTab === 'laporan' && (
          <LaporanTab 
            financeSummary={financeSummary} 
            pembayaran={state.pembayaranTampil} 
            branches={state.branches} 
            selectedBranchId={state.selectedBranchId} 
            setSelectedBranchId={actions.setSelectedBranchId} 
            searchTransaksi={state.searchTransaksi} 
            setSearchTransaksi={actions.setSearchTransaksi} 
            onDeleteTransaksi={actions.deleteTransaksi} 
            editTransaksiForm={state.editTransaksiForm} 
            setEditTransaksiForm={actions.setEditTransaksiForm} 
            onSubmitEditTransaksi={actions.submitEditTransaksi} 
            onStartEditTransaksi={actions.startEditTransaksi} 
          />
        )}
        
        {activeTab === 'download' && <DownloadTab exportType={state.exportType} setExportType={actions.setExportType} exportDateFrom={state.exportDateFrom} exportDateTo={state.exportDateTo} setExportDateFrom={actions.setExportDateFrom} setExportDateTo={actions.setExportDateTo} onQuickRange={actions.setQuickExportRange} onDownload={actions.handleDownload} selectedBranch={state.selectedBranch} />}
        
        {/* === TAB MAINTENANCE BARU === */}
        {activeTab === 'maintenance' && <MaintenanceTab pembayaran={state.pembayaranTampil} perkembangan={state.perkembanganTampil} onTriggerArchive={actions.triggerManualArchive} />}
       
        {/* MODAL KONFIRMASI HAPUS GLOBAL */}
        {state.deleteConfirm.show && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div className="glass-card" style={{ width: '90%', maxWidth: '400px', padding: '30px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', animation: 'fadeIn 0.2s ease-out' }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>🗑️</div>
              <h2 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>Konfirmasi Hapus</h2>
              <p className="text-muted" style={{ marginBottom: '25px', fontSize: '14px' }}>
                Apakah Anda yakin ingin menghapus <b style={{ color: '#ef4444' }}>{state.deleteConfirm.label}</b>? Data yang dihapus tidak dapat dikembalikan.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-danger" onClick={actions.confirmDelete} style={{ flex: 1, padding: '12px' }}>Ya, Hapus</button>
                <button className="btn btn-secondary" onClick={() => actions.setDeleteConfirm({ show: false, table: '', id: '', label: '' })} style={{ flex: 1, padding: '12px' }}>Batal</button>
              </div>
            </div>
          </div>
        )}

        {/* === MODAL INPUT PASSWORD UNTUK ARSIP & HAPUS MASAL === */}
        {state.archiveState.show && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999 }}>
            <div className="glass-card" style={{ width: '90%', maxWidth: '400px', padding: '30px', textAlign: 'center', border: `1px solid ${state.archiveState.forced ? '#ef4444' : '#eab308'}`, animation: 'fadeIn 0.2s ease-out' }}>
              <div style={{ fontSize: '50px', marginBottom: '15px' }}>{state.archiveState.forced ? '🚨' : '🔒'}</div>
              <h2 style={{ margin: '0 0 10px 0', color: state.archiveState.forced ? '#ef4444' : '#eab308' }}>
                {state.archiveState.forced ? 'Wajib Bersihkan Database!' : 'Otorisasi Required'}
              </h2>
              
              <p style={{ color: '#f8fafc', marginBottom: '20px', fontSize: '14px', lineHeight: '1.5' }}>
                {state.archiveState.forced 
                  ? 'Kapasitas database menumpuk! Anda diwajibkan melakukan Backup & Bersihkan (Batas 6 Bulan) sebelum bisa menggunakan aplikasi.' 
                  : `Sistem akan mem-backup riwayat Transaksi & Perkembangan lama (${state.archiveState.months} Bulan) ke Excel, lalu MENGHAPUSNYA permanen dari server.`}
                <br/><br/>Masukkan <b>Password Akun Anda</b> untuk mengeksekusi:
              </p>

              <input 
                type="password" 
                placeholder="Masukkan Password..." 
                value={state.archiveState.password}
                onChange={(e) => actions.setArchiveState(prev => ({ ...prev, password: e.target.value }))}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', letterSpacing: '2px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
              />

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={actions.executeArchive} 
                  disabled={state.archiveState.loading}
                  style={{ flex: 1, padding: '12px', background: '#eab308', borderColor: '#eab308', color: '#000', fontWeight: 'bold' }}
                >
                  {state.archiveState.loading ? 'Memproses...' : '📦 Eksekusi'}
                </button>
                
                {!state.archiveState.forced && (
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => actions.setArchiveState({ show: false, forced: false, password: '', loading: false, months: 6 })} 
                    style={{ flex: 1, padding: '12px' }}
                  >
                    Batal
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
