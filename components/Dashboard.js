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

export function Dashboard({ state, actions }) {
  const { user, activeTab, message, errorMsg, loadingData, visibleTabs, stats, overview, financeSummary } = state
  return (
    <main className="app-shell">
      <aside className="sidebar glass-card">
        <div>
          <div className="eyebrow">Bimbel Pro</div>
          <h1 className="sidebar-title">Final Stable</h1>
          <p className="text-muted">{user.nama}<br />{user.email}</p>
        </div>
        <div className="nav-stack">
          {visibleTabs.map((tab) => <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => actions.setActiveTab(tab)}>{TAB_LABELS[tab] || tab}</button>)}
        </div>
        <div className="btn-row column"><button className="btn btn-secondary" onClick={actions.loadAllData}>{loadingData ? 'Refreshing...' : 'Refresh data'}</button><button className="btn btn-danger" onClick={actions.logout}>Logout</button></div>
      </aside>
      <section className="content-area">
        <div className="glass-card topbar">
          <div>
            <div className="eyebrow">{user.akses}</div>
            <h1 className="hero-title">Operasional premium {state.selectedBranch?.nama ? `• ${state.selectedBranch.nama}` : '• Semua cabang'}</h1>
            <p className="text-muted">Dashboard modern untuk cabang, kasir, absensi, perkembangan, payroll, penilaian karyawan, dan laporan keuangan.</p>
          </div>
          <div className="grid grid-3 compact-stats">
            <StatCard label="Siswa" value={stats.siswa} />
            <StatCard label="Karyawan" value={stats.pegawai} />
            <StatCard label="Net bulan ini" value={formatRupiah(overview.labaBulanan)} />
          </div>
        </div>
        {message ? <Banner>{message}</Banner> : null}
        {errorMsg ? <Banner warning>{errorMsg}</Banner> : null}
        {activeTab === 'overview' && <OverviewTab overview={overview} financeSummary={financeSummary} selectedBranch={state.selectedBranch} employeeBarcodeIn={state.employeeBarcodeIn} employeeBarcodeOut={state.employeeBarcodeOut} />}
        {activeTab === 'cabang' && <CabangTab branchForm={state.branchForm} setBranchForm={actions.setBranchForm} branches={state.branches} onSubmit={actions.submitBranch} onReset={actions.setBranchForm} onEdit={actions.startEditBranch} onDelete={actions.deleteBranch} />}
        {activeTab === 'program' && <ProgramTab programForm={state.programForm} setProgramForm={actions.setProgramForm} programs={state.programs} onSubmit={actions.submitProgram} onReset={actions.setProgramForm} onEdit={actions.startEditProgram} onDelete={actions.deleteProgram} />}
        {activeTab === 'users' && <UsersTab userForm={state.userForm} setUserForm={actions.setUserForm} users={state.usersTampil} branches={state.branches} onSubmit={actions.submitUser} onReset={actions.setUserForm} onEdit={actions.startEditUser} onDelete={actions.deleteUser} />}
        {activeTab === 'permissions' && <PermissionsTab users={state.usersTampil} permissionUserId={state.permissionUserId} setPermissionUserId={actions.setPermissionUserId} permissionDraft={state.permissionDraft} onTogglePermission={actions.togglePermissionDraft} onSavePermissions={actions.savePermissions} onSelectAllPermissions={actions.selectAllPermissions} onResetPermissions={actions.resetPermissionDraft} />}
        {activeTab === 'siswa' && <SiswaTab user={state.user} siswaForm={state.siswaForm} setSiswaForm={actions.setSiswaForm} siswaTampil={state.siswaTampil} programs={state.programs} guruOptions={state.guruOptions} branches={state.branches} onGenerateBarcode={actions.generateStudentBarcodeAction} onSubmit={actions.submitSiswa} onReset={actions.setSiswaForm} onEdit={actions.startEditSiswa} onDelete={actions.deleteSiswa} onPrintBarcode={actions.printStudentBarcode} perkembanganForm={state.perkembanganForm} setPerkembanganForm={actions.setPerkembanganForm} onSubmitPerkembangan={actions.submitPerkembangan} />}
        {activeTab === 'kasir' && (
            <KasirTab 
              branches={state.branches} 
              selectedBranchId={state.selectedBranchId} 
              setSelectedBranchId={actions.setSelectedBranchId} 
              siswaOptions={state.siswaTampil} 
              selectedStudent={state.selectedStudent} 
              kasirForm={state.kasirForm} 
              setKasirForm={actions.setKasirForm} 
              studentScanInfo={state.studentScanInfo} 
              scanStudentActive={state.scanStudentActive} 
              setScanStudentActive={actions.setScanStudentActive} 
              studentScanText={state.studentScanText} 
              onSelectStudent={actions.selectStudentById} 
              onSubmitKasir={actions.submitKasir} 
              onPrintReceiptDesktop={actions.printThermalReceiptDesktop} 
              onPrintReceiptAndroid={actions.printThermalReceiptAndroid} 
              programs={state.programs} 
            />
          )}
        {activeTab === 'perkembangan' && <PerkembanganTab user={state.user} perkembanganForm={state.perkembanganForm} setPerkembanganForm={actions.setPerkembanganForm} siswaTampil={state.siswaTampil} guruOptions={state.guruOptions} perkembanganHistory={state.perkembanganHistory} selectedProgressStudent={state.selectedProgressStudent} progressInputMode={state.progressInputMode} setProgressInputMode={actions.setProgressInputMode} scanStudentActive={state.scanStudentActive} setScanStudentActive={actions.setScanStudentActive} studentScanInfo={state.studentScanInfo} onSelectProgressStudent={actions.selectProgressStudentById} onSubmit={actions.submitPerkembangan} />}
        {activeTab === 'karyawan' && <KaryawanTab currentUser={state.user} employeeMode={state.employeeMode} setEmployeeMode={actions.setEmployeeMode} scanEmployeeActive={state.scanEmployeeActive} setScanEmployeeActive={actions.setScanEmployeeActive} employeeScanInfo={state.employeeScanInfo} employeeScanText={state.employeeScanText} absensiKaryawan={state.absensiKaryawanTampil} employeeBarcodeIn={state.employeeBarcodeIn} employeeBarcodeOut={state.employeeBarcodeOut} employeeManualForm={state.employeeManualForm} setEmployeeManualForm={actions.setEmployeeManualForm} users={state.usersTampil} onSubmitManual={actions.submitEmployeeManualAttendance} />}
        {activeTab === 'review' && <ReviewsTab reviewForm={state.reviewForm} setReviewForm={actions.setReviewForm} users={state.usersTampil} reviews={state.reviewsTampil} onAddItem={actions.addReviewItem} onChangeItem={actions.changeReviewItem} onRemoveItem={actions.removeReviewItem} onSubmitReview={actions.submitReview} onPrintReview={actions.printEmployeeReview} />}
        {activeTab === 'laporan' && <LaporanTab financeSummary={financeSummary} pembayaran={state.pembayaranTampil} branches={state.branches} selectedBranchId={state.selectedBranchId} setSelectedBranchId={actions.setSelectedBranchId} payrollRows={state.payrollRows} bonusManual={state.bonusManualTampil} />}
        {activeTab === 'payroll' && <PayrollTab payrollRows={state.payrollRows} bonusForm={state.bonusForm} setBonusForm={actions.setBonusForm} users={state.usersTampil} bonusManual={state.bonusManualTampil} onSubmitBonus={actions.submitBonus} />}
        {activeTab === 'download' && <DownloadTab exportType={state.exportType} setExportType={actions.setExportType} exportDateFrom={state.exportDateFrom} exportDateTo={state.exportDateTo} setExportDateFrom={actions.setExportDateFrom} setExportDateTo={actions.setExportDateTo} onQuickRange={actions.setQuickExportRange} onDownload={actions.handleDownload} selectedBranch={state.selectedBranch} />}
      </section>
    </main>
  )
}
