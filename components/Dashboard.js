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
          
          /* 3. MENU HP - LAYAR PENUH (FULL OVERLAY) ANTI BUG */
          .nav-stack { 
            position: fixed; top: 55px; left: 0; width: 100%; height: calc(100vh - 55px);
            background: ${isLightMode ? '#f8fafc' : '#0f172a'}; 
            display: flex !important; flex-direction: column !important; 
            overflow-y: auto !important; overflow-x: hidden !important;
            padding: 15px 20px 100px 20px !important; margin: 0 !important; 
            box-sizing: border-box; z-index: 1000;
          }
          .nav-stack.mobile-closed { display: none !important; }
          .nav-stack .tab { width: 100%; text-align: left; padding: 10px 15px !important; border-radius: 8px; margin-bottom: 5px; font-size: 13px !important; }
          
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
          th, td { padding: 8px !important;
