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
import { OrangtuaPortalTab } from './tabs/OrangtuaPortalTab'

export function Dashboard({ state, actions }) {
  const { user, activeTab, message, errorMsg, loadingData, visibleTabs, stats, overview, financeSummary } = state
  
  // === STATE UNTUK TEMA & MENU HP ===
  const [isLightMode, setIsLightMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // === STATE LOKAL FILTER CABANG ===
  // Khusus untuk mencegah pilihan "Semua cabang" terpental balik
  // jika state parent masih menyimpan branch_id lama.
  const [localSelectedBranchId, setLocalSelectedBranchId] = useState('');

  // === FITUR AUTO-REDIRECT TAB ===
  useEffect(() => {
    if (visibleTabs && visibleTabs.length > 0 && !visibleTabs.includes(activeTab)) {
      actions.setActiveTab(visibleTabs[0]);
    }
  }, [activeTab, visibleTabs, actions]);

  const canSeeStats = visibleTabs.includes('overview');

  // Fungsi helper: Ubah tab dan otomatis TUTUP menu hamburger di HP
  const handleTabClick = (tabName) => {
    actions.setActiveTab(tabName);
    setIsMobileMenuOpen(false); 
  };

  // ========================================================
  // FILTER CABANG GLOBAL
  // Semua data yang dikirim ke tab akan melewati filter ini.
  // Dibuat defensif agar tidak merusak data lama yang belum punya branch_id.
  // ========================================================
  const branches = Array.isArray(state.branches) ? state.branches : [];
  const normalizeKey = (value) => String(value ?? '').trim().toLowerCase();

  // ========================================================
  // AKSES FILTER CABANG
  // MASTER/ADMIN boleh memilih "Semua cabang".
  // User cabang biasa tetap dikunci ke branch_id miliknya.
  // ========================================================
  const userAccess = normalizeKey(user?.akses);
  const isParentPortalUser = ['orangtua', 'ortu', 'parent', 'wali'].includes(userAccess);
  const canAccessAllBranches =
    userAccess.includes('master') ||
    userAccess.includes('admin') ||
    userAccess.includes('owner') ||
    userAccess.includes('super');

  const getFirstFilledValue = (source, fieldNames) => {
    if (!source || typeof source !== 'object') return '';
    for (const field of fieldNames) {
      const value = source[field];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return String(value).trim();
      }
    }
    return '';
  };

  const userBranchId = getFirstFilledValue(user, [
    'branch_id', 'cabang_id', 'id_cabang', 'branchId', 'cabangId', 'idCabang'
  ]);

  const userBranchKeys = new Set(
    [userBranchId, user?.branch?.id, user?.branch?.nama, user?.cabang?.id, user?.cabang?.nama]
      .filter(Boolean)
      .map(normalizeKey)
  );

  const branchesForSelector = canAccessAllBranches
    ? branches
    : branches.filter((branch) => {
        if (userBranchKeys.size === 0) return true;
        return [branch?.id, branch?.nama, branch?.kode]
          .filter(Boolean)
          .some((value) => userBranchKeys.has(normalizeKey(value)));
      });

  // Jika user bukan master/admin, paksa filter ke cabangnya.
  useEffect(() => {
    if (!canAccessAllBranches && userBranchId && localSelectedBranchId !== userBranchId) {
      setLocalSelectedBranchId(userBranchId);
      if (typeof actions.setSelectedBranchId === 'function') {
        actions.setSelectedBranchId(userBranchId);
      }
    }
  }, [canAccessAllBranches, userBranchId, localSelectedBranchId, actions]);

  // Untuk master/admin, value kosong = Semua cabang.
  // Sengaja memakai localSelectedBranchId, bukan state.selectedBranchId,
  // agar tidak dipaksa balik oleh parent state.
  const selectedBranchId = canAccessAllBranches
    ? (localSelectedBranchId || '')
    : (localSelectedBranchId || userBranchId || state.selectedBranchId || '');

  const isAllBranches = canAccessAllBranches && (!selectedBranchId || selectedBranchId === 'all' || selectedBranchId === 'semua');
  const selectedBranchFromList = branches.find((branch) => String(branch.id) === String(selectedBranchId));
  const selectedBranchForDashboard = isAllBranches ? null : (selectedBranchFromList || state.selectedBranch || null);

  const selectedBranchKeys = new Set(
    [selectedBranchId, selectedBranchForDashboard?.id, selectedBranchForDashboard?.nama, selectedBranchForDashboard?.kode]
      .filter(Boolean)
      .map(normalizeKey)
  );

  const branchFieldNames = [
    'branch_id', 'cabang_id', 'id_cabang', 'branchId', 'cabangId', 'idCabang',
    'branch', 'cabang', 'branch_code', 'kode_cabang', 'branchCode', 'kodeCabang',
    'nama_cabang', 'branch_name', 'branchName', 'cabang_nama'
  ];

  const studentIdFieldNames = ['siswa_id', 'id_siswa', 'student_id', 'siswaId', 'idSiswa', 'studentId'];
  const userIdFieldNames = ['user_id', 'id_user', 'employee_id', 'karyawan_id', 'guru_id', 'pegawai_id', 'userId', 'employeeId', 'karyawanId', 'guruId'];

  const collectValues = (item, fieldNames, nestedNames = []) => {
    const values = [];
    if (!item || typeof item !== 'object') return values;

    fieldNames.forEach((field) => {
      const value = item[field];
      if (value === undefined || value === null || value === '') return;

      if (typeof value === 'object') {
        ['id', 'nama', 'kode', 'name', 'code'].forEach((nestedField) => {
          if (value?.[nestedField] !== undefined && value?.[nestedField] !== null && value?.[nestedField] !== '') {
            values.push(value[nestedField]);
          }
        });
      } else {
        values.push(value);
      }
    });

    nestedNames.forEach((nestedName) => {
      const nestedValue = item[nestedName];
      if (!nestedValue || typeof nestedValue !== 'object') return;
      fieldNames.forEach((field) => {
        if (nestedValue?.[field] !== undefined && nestedValue?.[field] !== null && nestedValue?.[field] !== '') {
          values.push(nestedValue[field]);
        }
      });
      ['id', 'nama', 'kode', 'name', 'code'].forEach((field) => {
        if (nestedValue?.[field] !== undefined && nestedValue?.[field] !== null && nestedValue?.[field] !== '') {
          values.push(nestedValue[field]);
        }
      });
    });

    return values;
  };

  const collectBranchValues = (item) => collectValues(item, branchFieldNames, ['branch', 'cabang', 'siswa', 'student', 'user', 'guru', 'karyawan']);
  const collectStudentIds = (item) => collectValues(item, studentIdFieldNames, ['siswa', 'student']);
  const collectUserIds = (item) => collectValues(item, userIdFieldNames, ['user', 'guru', 'karyawan', 'pegawai']);

  const hasSelectedBranch = (item) => {
    if (isAllBranches) return true;
    const branchValues = collectBranchValues(item);
    if (branchValues.length === 0) return true;
    return branchValues.some((value) => selectedBranchKeys.has(normalizeKey(value)));
  };

  const filterByBranch = (rows) => {
    if (!Array.isArray(rows) || isAllBranches) return rows;
    return rows.filter(hasSelectedBranch);
  };

  const filteredSiswaTampil = filterByBranch(state.siswaTampil);
  const filteredUsersTampil = filterByBranch(state.usersTampil);
  const filteredBranches = isAllBranches ? branches : branches.filter((branch) => selectedBranchKeys.has(normalizeKey(branch.id)) || selectedBranchKeys.has(normalizeKey(branch.nama)) || selectedBranchKeys.has(normalizeKey(branch.kode)));
  const filteredPrograms = filterByBranch(state.programs);
  const filteredGuruOptions = filterByBranch(state.guruOptions);

  const selectedStudentIds = new Set((Array.isArray(filteredSiswaTampil) ? filteredSiswaTampil : []).flatMap((siswa) => [siswa?.id, siswa?.siswa_id, siswa?.student_id]).filter(Boolean).map(normalizeKey));
  const selectedUserIds = new Set((Array.isArray(filteredUsersTampil) ? filteredUsersTampil : []).flatMap((userItem) => [userItem?.id, userItem?.user_id, userItem?.employee_id, userItem?.guru_id, userItem?.karyawan_id]).filter(Boolean).map(normalizeKey));

  const filterByBranchOrRelation = (rows) => {
    if (!Array.isArray(rows) || isAllBranches) return rows;

    return rows.filter((item) => {
      const branchValues = collectBranchValues(item);
      if (branchValues.length > 0) {
        return branchValues.some((value) => selectedBranchKeys.has(normalizeKey(value)));
      }

      const studentValues = collectStudentIds(item);
      if (studentValues.length > 0) {
        return studentValues.some((value) => selectedStudentIds.has(normalizeKey(value)));
      }

      const userValues = collectUserIds(item);
      if (userValues.length > 0) {
        return userValues.some((value) => selectedUserIds.has(normalizeKey(value)));
      }

      // Data lama/global yang belum punya relasi cabang tetap ditampilkan agar fitur lama tidak hilang.
      return true;
    });
  };

  const filteredPerkembanganTampil = filterByBranchOrRelation(state.perkembanganTampil);
  const filteredPerkembanganHistory = filterByBranchOrRelation(state.perkembanganHistory);
  const filteredPembayaranTampil = filterByBranchOrRelation(state.pembayaranTampil);
  const filteredTransaksiTampil = filterByBranchOrRelation(state.transaksiTampil);
  const filteredPengeluaranTampil = filterByBranchOrRelation(state.pengeluaranTampil);
  const filteredInventoryTampil = filterByBranchOrRelation(state.inventoryTampil);
  const filteredAbsensiSiswaTampil = filterByBranchOrRelation(state.absensiSiswaTampil);
  const filteredAbsensiKaryawanTampil = filterByBranchOrRelation(state.absensiKaryawanTampil);
  const filteredReviewsTampil = filterByBranchOrRelation(state.reviewsTampil);
  const filteredPayrollRows = filterByBranchOrRelation(state.payrollRows);
  const filteredBonusManualTampil = filterByBranchOrRelation(state.bonusManualTampil);

  const displayedStats = {
    ...stats,
    siswa: Array.isArray(filteredSiswaTampil) ? filteredSiswaTampil.length : stats.siswa,
    pegawai: Array.isArray(filteredUsersTampil) ? filteredUsersTampil.length : stats.pegawai,
  };

  const handleBranchChange = (event) => {
    const nextBranchId = event.target.value || '';

    // User cabang biasa tetap terkunci ke cabangnya.
    if (!canAccessAllBranches && userBranchId) {
      setLocalSelectedBranchId(userBranchId);
      if (typeof actions.setSelectedBranchId === 'function') {
        actions.setSelectedBranchId(userBranchId);
      }
      return;
    }

    // Master/Admin boleh memilih kosong = Semua cabang.
    setLocalSelectedBranchId(nextBranchId);

    // Penting: saat memilih Semua cabang, jangan panggil parent dengan string kosong,
    // karena di beberapa App parent kosong bisa dipaksa balik ke user.branch_id.
    // Filter Dashboard tetap memakai localSelectedBranchId di atas.
    if (nextBranchId && typeof actions.setSelectedBranchId === 'function') {
      actions.setSelectedBranchId(nextBranchId);
    }
  };

  // ========================================================
  // TAMPILAN KHUSUS ORANG TUA
  // Jangan tampilkan menu admin seperti Pengingat Absen/Hari Libur.
  // Orang tua langsung melihat data siswa dari barcode.
  // ========================================================
  if (isParentPortalUser || user?.login_method === 'barcode_siswa' || user?.parent_siswa_id) {
    return (
      <main className={`app-shell ${isLightMode ? 'light-theme' : ''}`}>
        <style>{`
          @media (max-width: 768px) {
            .parent-portal-shell { padding: 12px !important; }
            .parent-portal-topbar { flex-direction: column !important; align-items: flex-start !important; }
          }
        `}</style>

        <section className="content-area parent-portal-shell" style={{ width: '100%', maxWidth: '1180px', margin: '0 auto' }}>
          <div className="glass-card parent-portal-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px', flexWrap: 'wrap' }}>
            <div>
              <div className="eyebrow">Portal Orang Tua</div>
              <h1 className="hero-title">Informasi Belajar Anak</h1>
              <p className="text-muted">
                Data perkembangan, jadwal, kehadiran, dan pembayaran siswa berdasarkan barcode yang discan.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => setIsLightMode(!isLightMode)} style={{ borderRadius: '50px' }}>
                {isLightMode ? '🌙 Mode Gelap' : '☀️ Mode Terang'}
              </button>
              <button className="btn btn-danger" onClick={actions.logout}>Logout</button>
            </div>
          </div>

          {message ? <Banner>{message}</Banner> : null}
          {errorMsg ? <Banner warning>{errorMsg}</Banner> : null}

          <OrangtuaPortalTab
            user={state.user}
            siswa={state.siswaTampil || state.siswa || []}
            perkembangan={state.perkembanganTampil || state.perkembangan || []}
            absensiSiswa={state.absensiSiswaTampil || state.absensiSiswa || []}
            pembayaran={state.pembayaranTampil || state.pembayaran || []}
            branches={state.branches || []}
          />
        </section>
      </main>
    )
  }

  return (
    <main className={`app-shell ${isLightMode ? 'light-theme' : ''}`}>
      <style>{`
        /* Sembunyikan actions mobile di layar desktop (laptop) */
        .mobile-actions { display: none; }
        
        @media (max-width: 768px) {
          /* 1. RESET BASE & PERKECIL UKURAN FONT PROPORSIONAL */
          body, html { 
            overflow-x: hidden !important; width: 100%; margin: 0; padding: 0; 
            font-size: 13px !important; 
          }
          .app-shell { display: block !important; min-height: 100vh; width: 100%; overflow-x: hidden !important; }
          
          h1 { font-size: 16px !important; }
          h2 { font-size: 14px !important; margin-bottom: 8px !important; }
          p, span, div, label { font-size: 12px !important; }
          input, select, textarea, button { 
            font-size: 12px !important; padding: 8px 10px !important; 
            max-width: 100% !important; box-sizing: border-box !important; 
          }

          /* 2. HEADER MENEMPEL DI ATAS (Lebih Ramping) */
          .sidebar { 
            position: sticky; top: 0; z-index: 999; width: 100% !important; 
            box-sizing: border-box; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.1); 
            padding: 10px 15px !important; border-radius: 0 !important; 
            background: ${isLightMode ? '#ffffff' : '#1e293b'}; 
          }
          
          .sidebar-header { display: flex; justify-content: space-between; align-items: center; width: 100%; margin: 0 !important; }
          .sidebar-title { font-size: 15px !important; margin: 0 !important; }
          .hide-on-mobile { display: none !important; }
          .sidebar-actions { display: none !important; }
          .mobile-actions { display: flex !important; gap: 8px; align-items: center; }
          
          /* 3. MENU HP - SCROLL KE SAMPING */
          .sidebar,
          .sidebar.glass-card {
            overflow: visible !important;
          }

          .mobile-actions {
            position: relative !important;
            z-index: 1002 !important;
          }

          .nav-stack { 
            position: relative !important;
            top: auto !important;
            left: auto !important;
            right: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;

            background: transparent !important;

            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            gap: 8px !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            -webkit-overflow-scrolling: touch !important;
            scroll-snap-type: x proximity !important;

            padding: 10px 0 4px 0 !important;
            margin: 10px 0 0 0 !important; 
            box-sizing: border-box !important;
            z-index: 1001 !important;

            border-top: 1px solid rgba(255,255,255,0.1);
            scrollbar-width: thin;
          }

          .nav-stack.mobile-closed {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }

          .nav-stack:not(.mobile-closed) {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
          }

          /* Judul kategori disembunyikan di HP supaya menu menjadi satu baris scroll samping */
          .nav-stack > div {
            display: none !important;
          }

          .nav-stack .tab {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex: 0 0 auto !important;
            width: auto !important;
            min-width: max-content !important;
            min-height: 40px !important;
            white-space: nowrap !important;
            text-align: center !important;
            padding: 10px 13px !important;
            border-radius: 999px !important;
            margin: 0 !important;
            font-size: 12px !important;
            scroll-snap-align: start !important;
            color: ${isLightMode ? '#0f172a' : '#f8fafc'} !important;
            background: ${isLightMode ? '#ffffff' : 'rgba(15,23,42,0.85)'} !important;
            border: 1px solid rgba(148,163,184,0.25) !important;
          }
          
          /* 4. AREA KONTEN UTAMA (DI-CENTER) */
          .content-area { 
            padding: 12px 15px !important; /* Padding seimbang kiri-kanan */
            width: 100% !important; /* Ganti dari 100vw jadi 100% */
            box-sizing: border-box !important; 
            display: block !important; overflow-x: hidden !important;
            margin: 0 auto !important; /* Memaksa rata tengah otomatis */
          }
          
          .topbar { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; width: 100%; box-sizing: border-box; padding: 12px !important;}
          .topbar h1 { font-size: 14px !important; line-height: 1.4; white-space: normal; }
          .topbar p { display: none !important; }
          
          .compact-stats { display: flex !important; flex-direction: column !important; gap: 10px; margin-bottom: 12px; width: 100%; }
          .compact-stats > div { width: 100% !important; padding: 12px !important; box-sizing: border-box; margin: 0 auto !important; }

          /* ======================================================== */
          /* 5. FIX LAYOUT KASIR & LAPORAN */
          /* ======================================================== */
          .content-area div[style*="grid-template-columns"],
          .content-area div[style*="display: grid"],
          .content-area .grid {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            gap: 12px !important;
            margin: 0 auto !important; /* Center grid children */
          }

          /* ======================================================== */
          /* 6. KARTU & TABEL TOUCH SCROLLING (DI-CENTER) */
          /* ======================================================== */
          .glass-card {
            width: 100% !important; max-width: 100% !important; box-sizing: border-box !important;
            margin: 0 auto 12px auto !important; /* KUNCI RATA TENGAH UNTUK SETIAP PANEL */
            padding: 15px !important;
            overflow-x: auto !important; -webkit-overflow-scrolling: touch;
          }
          
          .content-area table {
            display: block !important; width: 100% !important; min-width: 100% !important;
            white-space: nowrap !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch;
          }
          th, td { padding: 8px !important; font-size: 11px !important; }
        }
      `}</style>

      <aside className="sidebar glass-card">
        <div className="sidebar-header">
          <div>
            <div className="eyebrow">Bimbel Pro</div>
            <h1 className="sidebar-title" style={{ margin: 0 }}>Final Stable</h1>
            <p className="text-muted hide-on-mobile">{user.nama}<br />{user.email}</p>
          </div>
          
          {/* === TOMBOL MENU & LOGOUT KHUSUS HP === */}
          <div className="mobile-actions">
            <button 
              className="btn btn-secondary btn-small"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{ padding: '6px 12px', fontSize: '14px', borderRadius: '6px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              {isMobileMenuOpen ? '✖ Tutup' : '☰ Menu'}
            </button>
            <button 
              className="btn btn-danger btn-small" 
              onClick={actions.logout} 
              style={{ padding: '6px 12px', borderRadius: '6px' }}
            >
              🚪 Keluar
            </button>
          </div>
        </div>

        <div className={`nav-stack ${!isMobileMenuOpen ? 'mobile-closed' : ''}`}>
          
          {/* === KATEGORI UTAMA === */}
          {(visibleTabs.includes('overview') || visibleTabs.includes('kasir')) && (
            <>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', padding: '10px 10px 5px 10px', marginTop: '5px' }}>Utama</div>
              {visibleTabs.includes('overview') && <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => handleTabClick('overview')}>📊 Dashboard</button>}
              {visibleTabs.includes('kasir') && <button className={`tab ${activeTab === 'kasir' ? 'active' : ''}`} onClick={() => handleTabClick('kasir')}>🧾 Kasir</button>}
            </>
          )}

          {/* === KATEGORI AKADEMIK === */}
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', padding: '10px 10px 5px 10px', marginTop: '10px' }}>Akademik</div>
          {visibleTabs.includes('siswa') && <button className={`tab ${activeTab === 'siswa' ? 'active' : ''}`} onClick={() => handleTabClick('siswa')}>👨‍🎓 Data Siswa</button>}
          {visibleTabs.includes('portal_orangtua') && <button className={`tab ${activeTab === 'portal_orangtua' ? 'active' : ''}`} onClick={() => handleTabClick('portal_orangtua')}>👨‍👩‍👧 Portal Orang Tua</button>}
          {visibleTabs.includes('jadwal') && <button className={`tab ${activeTab === 'jadwal' ? 'active' : ''}`} onClick={() => handleTabClick('jadwal')}>📅 Jadwal Guru</button>}
          {visibleTabs.includes('perkembangan') && <button className={`tab ${activeTab === 'perkembangan' ? 'active' : ''}`} onClick={() => handleTabClick('perkembangan')}>📝 Input Laporan</button>}
          {visibleTabs.includes('absensi_siswa') && <button className={`tab ${activeTab === 'absensi_siswa' ? 'active' : ''}`} onClick={() => handleTabClick('absensi_siswa')}>⏳ Monitor Absen</button>}
          {visibleTabs.includes('pengingat_absen') && <button className={`tab ${activeTab === 'pengingat_absen' ? 'active' : ''}`} onClick={() => handleTabClick('pengingat_absen')}>🔔 Pengingat Absen</button>}
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
          {visibleTabs.includes('hari_libur') && <button className={`tab ${activeTab === 'hari_libur' ? 'active' : ''}`} onClick={() => handleTabClick('hari_libur')}>🗓️ Hari Libur</button>}
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
            <h1 className="hero-title">Operasional premium {selectedBranchForDashboard?.nama ? `• ${selectedBranchForDashboard.nama}` : '• Semua cabang'}</h1>
            <p className="text-muted">Dashboard modern untuk cabang, kasir, absensi, inventory, payroll, dan laporan keuangan.</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {/* === FILTER CABANG GLOBAL === */}
            {!isParentPortalUser && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '210px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Filter Cabang Global
              </label>
              <select
                value={selectedBranchId}
                onChange={handleBranchChange}
                disabled={!canAccessAllBranches && Boolean(userBranchId)}
                style={{
                  width: '100%',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  border: isLightMode ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.18)',
                  background: isLightMode ? '#ffffff' : 'rgba(15,23,42,0.85)',
                  color: isLightMode ? '#0f172a' : '#f8fafc',
                  outline: 'none'
                }}
              >
                <option value="">Semua cabang</option>
                {branchesForSelector.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.nama || branch.kode || branch.id}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Berlaku untuk semua menu</span>
            </div>
            )}

            {/* === TOMBOL SAKLAR TEMA === */}
            <button 
              className="btn btn-secondary" 
              onClick={() => setIsLightMode(!isLightMode)}
              style={{ 
                borderRadius: '50px', 
                padding: '8px 14px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                border: isLightMode ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.2)'
              }}
            >
              {isLightMode ? '🌙 Mode Gelap' : '☀️ Mode Terang'}
            </button>
          </div>
        </div>
        
        {canSeeStats && (
          <div className="grid grid-3 compact-stats">
            <StatCard label="Siswa" value={displayedStats.siswa} />
            <StatCard label="Karyawan" value={displayedStats.pegawai} />
            <StatCard label="Net bulan ini (Laba)" value={formatRupiah(overview.labaBulanan)} />
          </div>
        )}

        {message ? <Banner>{message}</Banner> : null}
        {errorMsg ? <Banner warning>{errorMsg}</Banner> : null}

        {/* === AREA KONTEN TAB === */}
        {activeTab === 'overview' && (
          <OverviewTab overview={overview} financeSummary={financeSummary} selectedBranch={selectedBranchForDashboard} employeeBarcodeIn={state.employeeBarcodeIn} employeeBarcodeOut={state.employeeBarcodeOut} pembayaran={filteredPembayaranTampil} pengeluaran={filteredPengeluaranTampil} siswa={filteredSiswaTampil} perkembangan={filteredPerkembanganTampil}/>
        )}
        {activeTab === 'jadwal' && <JadwalTab siswa={filteredSiswaTampil} users={filteredUsersTampil} branches={branches} perkembangan={filteredPerkembanganTampil} />}
        {activeTab === 'cabang' && <CabangTab branchForm={state.branchForm} setBranchForm={actions.setBranchForm} branches={filteredBranches} onSubmit={actions.submitBranch} onReset={actions.setBranchForm} onEdit={actions.startEditBranch} onDelete={actions.deleteBranch} />}
        {activeTab === 'program' && <ProgramTab programForm={state.programForm} setProgramForm={actions.setProgramForm} programs={filteredPrograms} onSubmit={actions.submitProgram} onReset={actions.setProgramForm} onEdit={actions.startEditProgram} onDelete={actions.deleteProgram} />}
        {activeTab === 'users' && <UsersTab userForm={state.userForm} setUserForm={actions.setUserForm} users={filteredUsersTampil} branches={branches} programs={filteredPrograms} onSubmit={actions.submitUser} onReset={actions.setUserForm} onEdit={actions.startEditUser} onDelete={actions.deleteUser} />}
        {activeTab === 'permissions' && <PermissionsTab users={filteredUsersTampil} permissionUserId={state.permissionUserId} setPermissionUserId={actions.setPermissionUserId} permissionDraft={state.permissionDraft} onTogglePermission={actions.togglePermissionDraft} onSavePermissions={actions.savePermissions} onSelectAllPermissions={actions.selectAllPermissions} onResetPermissions={actions.resetPermissionDraft} />}
        
        {activeTab === 'siswa' && (
          <SiswaTab user={state.user} siswaForm={state.siswaForm} setSiswaForm={actions.setSiswaForm} siswaTampil={filteredSiswaTampil} programs={filteredPrograms} guruOptions={filteredGuruOptions} branches={branches} onGenerateBarcode={actions.generateStudentBarcodeAction} onSubmit={actions.submitSiswa} onReset={actions.setSiswaForm} onEdit={actions.startEditSiswa} onDelete={actions.deleteSiswa} onPrintBarcode={actions.printStudentBarcode} searchSiswa={state.searchSiswa} setSearchSiswa={actions.setSearchSiswa} exportDateFrom={state.exportDateFrom} setExportDateFrom={actions.setExportDateFrom} exportDateTo={state.exportDateTo} setExportDateTo={actions.setExportDateTo} handleDownload={actions.handleDownload} onSendManualReminder={actions.sendManualReminderWA} perkembanganTampil={filteredPerkembanganTampil} transaksiTampil={filteredTransaksiTampil} />
        )}
        
        {activeTab === 'kasir' && <KasirTab branches={branches} selectedBranchId={selectedBranchId} setSelectedBranchId={actions.setSelectedBranchId} siswaOptions={filteredSiswaTampil} selectedStudent={state.selectedStudent} kasirForm={state.kasirForm} setKasirForm={actions.setKasirForm} studentScanInfo={state.studentScanInfo} scanStudentActive={state.scanStudentActive} setScanStudentActive={actions.setScanStudentActive} studentScanText={state.studentScanText} onSelectStudent={actions.selectStudentById} onSubmitKasir={actions.submitKasir} onPrintReceiptDesktop={actions.printThermalReceiptDesktop} onPrintReceiptAndroid={actions.printThermalReceiptAndroid} onSendReceiptWA={actions.sendThermalReceiptWA} inventoryTampil={filteredInventoryTampil} showReceiptPopup={state.showReceiptPopup} setShowReceiptPopup={actions.setShowReceiptPopup} lastReceipt={state.lastReceipt} />}
        {activeTab === 'perkembangan' && <PerkembanganTab user={state.user} perkembanganForm={state.perkembanganForm} setPerkembanganForm={actions.setPerkembanganForm} siswaTampil={filteredSiswaTampil} guruOptions={filteredGuruOptions} perkembanganHistory={filteredPerkembanganHistory} selectedProgressStudent={state.selectedProgressStudent} progressInputMode={state.progressInputMode} setProgressInputMode={actions.setProgressInputMode} scanStudentActive={state.scanStudentActive} setScanStudentActive={actions.setScanStudentActive} studentScanInfo={state.studentScanInfo} onSelectProgressStudent={actions.selectProgressStudentById} onSubmit={actions.submitPerkembangan} onSendPerkembanganWA={actions.sendPerkembanganWA} perkembanganTampil={filteredPerkembanganTampil} onDeletePerkembangan={actions.deletePerkembangan} />}
        {activeTab === 'karyawan' && <KaryawanTab currentUser={state.user} employeeMode={state.employeeMode} setEmployeeMode={actions.setEmployeeMode} scanEmployeeActive={state.scanEmployeeActive} setScanEmployeeActive={actions.setScanEmployeeActive} employeeScanInfo={state.employeeScanInfo} employeeScanText={state.employeeScanText} absensiKaryawan={filteredAbsensiKaryawanTampil} employeeBarcodeIn={state.employeeBarcodeIn} employeeBarcodeOut={state.employeeBarcodeOut} employeeManualForm={state.employeeManualForm} setEmployeeManualForm={actions.setEmployeeManualForm} users={filteredUsersTampil} onSubmitManual={actions.submitEmployeeManualAttendance} />}
        {activeTab === 'review' && <ReviewsTab reviewForm={state.reviewForm} setReviewForm={actions.setReviewForm} users={filteredUsersTampil} reviews={filteredReviewsTampil} onAddItem={actions.addReviewItem} onChangeItem={actions.changeReviewItem} onRemoveItem={actions.removeReviewItem} onSubmitReview={actions.submitReview} onPrintReview={actions.printEmployeeReview} />}
        {activeTab === 'pengeluaran' && <PengeluaranTab pengeluaranForm={state.pengeluaranForm} setPengeluaranForm={actions.setPengeluaranForm} pengeluaran={filteredPengeluaranTampil} branches={branches} onSubmit={actions.submitPengeluaran} onEdit={actions.startEditPengeluaran} onDelete={actions.deletePengeluaran} onReset={actions.setPengeluaranForm} />}
        {activeTab === 'inventory' && <InventoryTab inventoryForm={state.inventoryForm} setInventoryForm={actions.setInventoryForm} inventory={filteredInventoryTampil} branches={branches} onSubmit={actions.submitInventory} onEdit={actions.startEditInventory} onDelete={actions.deleteInventory} />}
        {activeTab === 'payroll' && <PayrollTab payrollRows={filteredPayrollRows} bonusForm={state.bonusForm} setBonusForm={actions.setBonusForm} users={filteredUsersTampil} bonusManual={filteredBonusManualTampil} onSubmitBonus={actions.submitBonus} onCatatGaji={actions.catatPengeluaranGaji} branches={branches} payrollMonth={state.payrollMonth} setPayrollMonth={actions.setPayrollMonth} payrollYear={state.payrollYear} setPayrollYear={actions.setPayrollYear} openSmartWA={actions.openSmartWA} actions={actions} />}
        {activeTab === 'laporan' && <LaporanTab financeSummary={financeSummary} pembayaran={filteredPembayaranTampil} branches={branches} selectedBranchId={selectedBranchId} setSelectedBranchId={actions.setSelectedBranchId} searchTransaksi={state.searchTransaksi} setSearchTransaksi={actions.setSearchTransaksi} onDeleteTransaksi={actions.deleteTransaksi} editTransaksiForm={state.editTransaksiForm} setEditTransaksiForm={actions.setEditTransaksiForm} onSubmitEditTransaksi={actions.submitEditTransaksi} onStartEditTransaksi={actions.startEditTransaksi} pengeluaran={filteredPengeluaranTampil} onSendWA={actions.sendHistoryTransactionWA} canSeeStats={canSeeStats} />}
        {activeTab === 'laporan_guru' && <LaporanGuruTab users={filteredUsersTampil} perkembanganTampil={filteredPerkembanganTampil} siswaTampil={filteredSiswaTampil} absensiSiswa={filteredAbsensiSiswaTampil} />}
        {activeTab === 'absensi_siswa' && <AbsensiSiswaTab siswaTampil={filteredSiswaTampil} perkembanganTampil={filteredPerkembanganTampil} openSmartWA={actions.openSmartWA} />}
        {activeTab === 'pengingat_absen' && <PengingatAbsenTab siswa={filteredSiswaTampil} perkembangan={filteredPerkembanganTampil} />}
        {activeTab === 'download' && <DownloadTab exportType={state.exportType} setExportType={actions.setExportType} exportDateFrom={state.exportDateFrom} exportDateTo={state.exportDateTo} setExportDateFrom={actions.setExportDateFrom} setExportDateTo={actions.setExportDateTo} onQuickRange={actions.setQuickExportRange} onDownload={actions.handleDownload} selectedBranch={selectedBranchForDashboard} />}
        {activeTab === 'maintenance' && <MaintenanceTab pembayaran={filteredPembayaranTampil} perkembangan={filteredPerkembanganTampil} onTriggerArchive={actions.triggerManualArchive} />}
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
