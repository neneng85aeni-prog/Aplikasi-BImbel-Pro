'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import {
  EMPLOYEE_GLOBAL_IN, EMPLOYEE_GLOBAL_OUT, INITIAL_BONUS_FORM, INITIAL_BRANCH_FORM,
  INITIAL_EMPLOYEE_MANUAL_FORM, INITIAL_KASIR_FORM, INITIAL_PERKEMBANGAN_FORM,
  INITIAL_PROGRAM_FORM, INITIAL_REVIEW_FORM, INITIAL_SISWA_FORM, INITIAL_STUDENT_ATTENDANCE_FORM,
  INITIAL_USER_FORM, INITIAL_AVAILABILITY, INITIAL_PENGELUARAN_FORM, INITIAL_INVENTORY_FORM, TODAY, allowedTabs, defaultPermissionsByRole, normalizePermissions,
} from '../lib/constants'
import { formatMonthYear, formatRupiah, generateStudentBarcode, formatTanggal } from '../lib/format'
import { loginWithRpc } from '../lib/auth'
import {
  fetchAllData, removeById, saveBonus, saveEmployeeAttendance, saveEmployeeManualAttendance,
  saveKasirTransaction, savePerkembangan, saveReview, saveStudentAttendance,
  saveUserPermissions, upsertBranch, upsertProgram, upsertSiswa, upsertUserViaRpc,
  updatePembayaran, savePengeluaran, updatePengeluaran, upsertInventory, updateInventoryStock,
  toNull // <--- WAJIB TAMBAHKAN INI ✨
} from '../lib/data'
import { validateBonusForm, validateBranchForm, validateEmployeeManualForm, validatePerkembanganForm, validateProgramForm, validateReviewForm, validateSiswaForm, validateStudentAttendanceForm, validateUserForm } from '../lib/validation'
import { clearSession, readSession, saveSession } from '../lib/session'
import { downloadCsv, exportRows } from '../lib/export'
import { buildFinanceSummary, computeOverview, computePayroll, filterByUserBranch } from '../lib/reporting'
import { printBarcodeCard } from '../components/ui/BarcodePreview'
import QRCode from 'qrcode'

function normalizeUserPayload(row) {
  if (!row) return row
  return { ...row, menu_permissions: normalizePermissions(row.menu_permissions, row.akses) }
}

export function useBimbelApp() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loadingLogin, setLoadingLogin] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [message, setMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loadingData, setLoadingData] = useState(false)

  const [branches, setBranches] = useState([])
  const [programs, setPrograms] = useState([])
  const [users, setUsers] = useState([])
  const [siswa, setSiswa] = useState([])
  const [pembayaran, setPembayaran] = useState([])
  const [absensiSiswa, setAbsensiSiswa] = useState([])
  const [perkembangan, setPerkembangan] = useState([])
  const [absensiKaryawan, setAbsensiKaryawan] = useState([])
  const [bonusManual, setBonusManual] = useState([])
  const [reviews, setReviews] = useState([])
  const [pengeluaran, setPengeluaran] = useState([])
  const [inventory, setInventory] = useState([])

  const [branchForm, setBranchForm] = useState(INITIAL_BRANCH_FORM)
  const [programForm, setProgramForm] = useState(INITIAL_PROGRAM_FORM)
  const [userForm, setUserForm] = useState(INITIAL_USER_FORM)
  const [siswaForm, setSiswaForm] = useState(INITIAL_SISWA_FORM)
  const [perkembanganForm, setPerkembanganForm] = useState(INITIAL_PERKEMBANGAN_FORM)
  const [kasirForm, setKasirForm] = useState(INITIAL_KASIR_FORM)
  const [bonusForm, setBonusForm] = useState(INITIAL_BONUS_FORM)
  const [employeeManualForm, setEmployeeManualForm] = useState(INITIAL_EMPLOYEE_MANUAL_FORM)
  const [studentAttendanceForm, setStudentAttendanceForm] = useState(INITIAL_STUDENT_ATTENDANCE_FORM)
  const [reviewForm, setReviewForm] = useState(INITIAL_REVIEW_FORM)
  const [pengeluaranForm, setPengeluaranForm] = useState(INITIAL_PENGELUARAN_FORM)
  const [inventoryForm, setInventoryForm] = useState(INITIAL_INVENTORY_FORM)

  const [permissionUserId, setPermissionUserId] = useState('')
  const [permissionDraft, setPermissionDraft] = useState([])
  const [scanStudentActive, setScanStudentActive] = useState(false)
  const [scanEmployeeActive, setScanEmployeeActive] = useState(false)
  const [employeeMode, setEmployeeMode] = useState('datang')
  const [studentScanText, setStudentScanText] = useState('')
  const [employeeScanText, setEmployeeScanText] = useState('')
  const [studentScanInfo, setStudentScanInfo] = useState('Belum ada hasil scan siswa.')
  const [employeeScanInfo, setEmployeeScanInfo] = useState('Belum ada hasil scan karyawan.')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedProgressStudent, setSelectedProgressStudent] = useState(null)
  const [exportType, setExportType] = useState('siswa')
  const [exportDateFrom, setExportDateFrom] = useState('')
  const [exportDateTo, setExportDateTo] = useState('')
  const [progressInputMode, setProgressInputMode] = useState('scan')
  const [lastReceipt, setLastReceipt] = useState(null)
  const [searchSiswa, setSearchSiswa] = useState('')
  const [searchTransaksi, setSearchTransaksi] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1)
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear())

  const [showReceiptPopup, setShowReceiptPopup] = useState(false)
  const [editTransaksiForm, setEditTransaksiForm] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, table: '', id: '', label: '' })
  
  const [archiveState, setArchiveState] = useState({ show: false, forced: false, password: '', loading: false, months: 6 })

  const studentScannerRef = useRef(null)
  const employeeScannerRef = useRef(null)

  const visibleTabs = useMemo(() => allowedTabs(user?.akses, user?.menu_permissions), [user])
  const selectedBranch = useMemo(() => branches.find((item) => item.id === selectedBranchId) || branches.find((item) => item.id === user?.branch_id) || branches[0] || null, [branches, selectedBranchId, user])
  const employeeBarcodeIn = selectedBranch?.employee_barcode_in || EMPLOYEE_GLOBAL_IN
  const employeeBarcodeOut = selectedBranch?.employee_barcode_out || EMPLOYEE_GLOBAL_OUT

  const usersTampil = useMemo(() => filterByUserBranch(users, user), [users, user])
  const siswaScoped = useMemo(() => filterByUserBranch(siswa, user), [siswa, user])
  const pembayaranScoped = useMemo(() => filterByUserBranch(pembayaran, user, 'branch_id'), [pembayaran, user])
  const absensiSiswaScoped = useMemo(() => filterByUserBranch(absensiSiswa, user, 'branch_id'), [absensiSiswa, user])
  const perkembanganScoped = useMemo(() => filterByUserBranch(perkembangan, user, 'branch_id'), [perkembangan, user])
  const absensiKaryawanScoped = useMemo(() => filterByUserBranch(absensiKaryawan, user, 'branch_id'), [absensiKaryawan, user])
  const bonusManualScoped = useMemo(() => filterByUserBranch(bonusManual, user, 'branch_id'), [bonusManual, user])
  const reviewsScoped = useMemo(() => filterByUserBranch(reviews, user, 'branch_id'), [reviews, user])
  const pengeluaranScoped = useMemo(() => filterByUserBranch(pengeluaran, user, 'branch_id'), [pengeluaran, user])
  const inventoryScoped = useMemo(() => filterByUserBranch(inventory, user, 'branch_id'), [inventory, user])

  const siswaTampil = useMemo(() => {
    let rows = siswaScoped
    if (selectedBranchId) rows = rows.filter((item) => item.branch_id === selectedBranchId)
    if (user?.akses === 'guru') rows = rows.filter((item) => item.guru_id === user.id || !item.guru_id)
    if (searchSiswa) {
      const q = searchSiswa.toLowerCase()
      rows = rows.filter(item => item.nama?.toLowerCase().includes(q) || item.no_hp?.includes(q))
    }
    return rows
  }, [siswaScoped, selectedBranchId, user, searchSiswa])

  const pembayaranTampil = useMemo(() => {
    let rows = selectedBranchId ? pembayaranScoped.filter((item) => item.branch_id === selectedBranchId) : pembayaranScoped;
    if (searchTransaksi) {
      const q = searchTransaksi.toLowerCase()
      rows = rows.filter(item => item.siswa?.nama?.toLowerCase().includes(q) || item.programs?.nama?.toLowerCase().includes(q) || item.keterangan?.toLowerCase().includes(q))
    }
    return rows;
  }, [pembayaranScoped, selectedBranchId, searchTransaksi])

  const perkembanganTampil = useMemo(() => selectedBranchId ? perkembanganScoped.filter((item) => item.siswa?.branch_id === selectedBranchId || item.users?.branch_id === selectedBranchId) : perkembanganScoped, [perkembanganScoped, selectedBranchId])
  const absensiKaryawanTampil = useMemo(() => selectedBranchId ? absensiKaryawanScoped.filter((item) => item.users?.branch_id === selectedBranchId) : absensiKaryawanScoped, [absensiKaryawanScoped, selectedBranchId])
  const bonusManualTampil = useMemo(() => selectedBranchId ? bonusManualScoped.filter((item) => item.branch_id === selectedBranchId) : bonusManualScoped, [bonusManualScoped, selectedBranchId])
  const absensiSiswaTampil = useMemo(() => selectedBranchId ? absensiSiswaScoped.filter((item) => item.branch_id === selectedBranchId) : absensiSiswaScoped, [absensiSiswaScoped, selectedBranchId])
  const reviewsTampil = useMemo(() => selectedBranchId ? reviewsScoped.filter((item) => item.branch_id === selectedBranchId) : reviewsScoped, [reviewsScoped, selectedBranchId])
  const pengeluaranTampil = useMemo(() => selectedBranchId ? pengeluaranScoped.filter((item) => item.branch_id === selectedBranchId) : pengeluaranScoped, [pengeluaranScoped, selectedBranchId])
  const inventoryTampil = useMemo(() => selectedBranchId ? inventoryScoped.filter((item) => item.branch_id === selectedBranchId) : inventoryScoped, [inventoryScoped, selectedBranchId])

  const perkembanganHistory = useMemo(() => {
    if (!perkembanganForm.siswa_id) return []
    return perkembanganTampil.filter((item) => item.siswa_id === perkembanganForm.siswa_id).sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal))).slice(0, 5)
  }, [perkembanganTampil, perkembanganForm.siswa_id])

  const guruOptions = useMemo(() => 
  usersTampil.filter((item) => item.akses && item.akses.toLowerCase().trim() === 'guru'), 
[usersTampil])
  const targetPayrollDate = useMemo(() => new Date(payrollYear, payrollMonth - 1, 1), [payrollMonth, payrollYear])
  const payrollRows = useMemo(() => computePayroll({ users: usersTampil, absensiSiswa: absensiSiswaTampil, absensiKaryawan: absensiKaryawanTampil, bonusManual: bonusManualTampil, targetDate: targetPayrollDate }), [usersTampil, absensiSiswaTampil, absensiKaryawanTampil, bonusManualTampil, targetPayrollDate])
  const overview = useMemo(() => computeOverview({ pembayaran: pembayaranTampil, pengeluaran: pengeluaranTampil, siswa: siswaTampil, users: usersTampil, branches: selectedBranchId ? branches.filter((b) => b.id === selectedBranchId) : branches, payrollRows }), [pembayaranTampil, pengeluaranTampil, siswaTampil, usersTampil, branches, selectedBranchId, payrollRows])
  const financeSummary = useMemo(() => buildFinanceSummary(pembayaranTampil, pengeluaranTampil, payrollRows, bonusManualTampil, selectedBranchId ? branches.filter((b) => b.id === selectedBranchId) : branches), [pembayaranTampil, pengeluaranTampil, payrollRows, bonusManualTampil, branches, selectedBranchId])
  const stats = useMemo(() => ({ siswa: siswaTampil.length, pegawai: usersTampil.length, program: programs.length, pemasukan: pembayaranTampil.reduce((sum, item) => sum + Number(item.nominal || 0), 0) }), [siswaTampil, usersTampil, programs, pembayaranTampil])

  useEffect(() => { const cachedUser = readSession(); if (cachedUser) setUser(normalizeUserPayload(cachedUser)) }, [])
  useEffect(() => { if (user) loadAllData() }, [user])
  useEffect(() => { if (user?.branch_id && !selectedBranchId) setSelectedBranchId(user.branch_id) }, [user, selectedBranchId])

  useEffect(() => {
    if (!permissionUserId) return setPermissionDraft([])
    const selected = usersTampil.find((item) => item.id === permissionUserId)
    setPermissionDraft(normalizePermissions(selected?.menu_permissions, selected?.akses))
  }, [permissionUserId, usersTampil])

  useEffect(() => {
    if (!perkembanganForm.siswa_id) return setSelectedProgressStudent(null)
    const selected = siswaTampil.find((item) => item.id === perkembanganForm.siswa_id) || null
    setSelectedProgressStudent(selected)
  }, [perkembanganForm.siswa_id, siswaTampil])

  useEffect(() => {
    const hasMaintenanceAccess = user?.menu_permissions?.includes('maintenance') || user?.akses === 'master';
    if (hasMaintenanceAccess && (pembayaran.length > 0 || perkembanganTampil.length > 0)) {
      const now = new Date();
      const cutoff = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      const cutoffDate = cutoff.toISOString().slice(0, 10);
      if (pembayaran.filter(item => item.tanggal && item.tanggal < cutoffDate).length > 0 || perkembanganTampil.filter(item => item.tanggal && item.tanggal < cutoffDate).length > 0) {
        setArchiveState(prev => ({ ...prev, show: true, forced: true, months: 6 }))
      } else {
        setArchiveState(prev => ({ ...prev, show: false, forced: false }))
      }
    }
  }, [pembayaran, perkembanganTampil, user])

  useEffect(() => {
    if (!scanStudentActive) return undefined
    const scanner = new Html5QrcodeScanner('reader-siswa', { qrbox: { width: 220, height: 220 }, fps: 5, rememberLastUsedCamera: true }, false)
    studentScannerRef.current = scanner
    scanner.render(async (decodedText) => {
      setStudentScanText(decodedText)
      if (activeTab === 'perkembangan') await prosesScanPerkembangan(decodedText)
      else await prosesScanSiswa(decodedText)
      setScanStudentActive(false)
    }, () => {})
    return () => { scanner.clear().catch(() => {}); studentScannerRef.current = null }
  }, [scanStudentActive, activeTab, user, siswaTampil, perkembanganForm])

  useEffect(() => {
    if (!scanEmployeeActive) return undefined
    const scanner = new Html5QrcodeScanner('reader-karyawan', { qrbox: { width: 220, height: 220 }, fps: 5, rememberLastUsedCamera: true }, false)
    employeeScannerRef.current = scanner
    scanner.render(async (decodedText) => {
      setEmployeeScanText(decodedText)
      await prosesScanKaryawan(decodedText)
      setScanEmployeeActive(false)
    }, () => {})
    return () => { scanner.clear().catch(() => {}); employeeScannerRef.current = null }
  }, [scanEmployeeActive, employeeMode, user, employeeBarcodeIn, employeeBarcodeOut])

  async function loadAllData() {
    try {
      setLoadingData(true); setErrorMsg('')
      const data = await fetchAllData()
      setBranches(data.branches); setPrograms(data.programs); setUsers((data.users || []).map(normalizeUserPayload)); setSiswa(data.siswa); setPembayaran(data.pembayaran); setAbsensiSiswa(data.absensiSiswa); setPerkembangan(data.perkembangan); setAbsensiKaryawan(data.absensiKaryawan); setBonusManual(data.bonusManual); setReviews(data.reviews); setPengeluaran(data.pengeluaran || []); setInventory(data.inventory || [])
    } catch (error) { setErrorMsg(error.message || 'Gagal mengambil data.') } finally { setLoadingData(false) }
  }

  async function login() {
    setLoadingLogin(true); setLoginError('')
    try {
      const loggedInUser = normalizeUserPayload(await loginWithRpc(email, password))
      setUser(loggedInUser); saveSession(loggedInUser); setMessage(`Login berhasil sebagai ${loggedInUser.akses}.`)
    } catch (error) { setLoginError(error.message || 'Login gagal.') } finally { setLoadingLogin(false) }
  }

  function logout() { setUser(null); setEmail(''); setPassword(''); setActiveTab('overview'); clearSession(); setMessage('Logout berhasil.') }

  async function submitBranch(event) { event.preventDefault(); try { const res = await upsertBranch(validateBranchForm(branchForm), branchForm.id); if (res.error) throw res.error; setBranchForm(INITIAL_BRANCH_FORM); setMessage('Cabang disimpan.'); await loadAllData() } catch (error) { setErrorMsg(error.message) } }
  async function submitProgram(event) { event.preventDefault(); try { const res = await upsertProgram(validateProgramForm(programForm), programForm.id); if (res.error) throw res.error; setProgramForm(INITIAL_PROGRAM_FORM); setMessage('Program disimpan.'); await loadAllData() } catch (error) { setErrorMsg(error.message) } }
  async function submitUser(event) { 
    event.preventDefault(); 
    try { 
      const payload = validateUserForm({ 
        ...userForm, 
        menu_permissions: userForm.menu_permissions?.length ? userForm.menu_permissions : defaultPermissionsByRole(userForm.akses),
        // === TAMBAHKAN DUA BARIS INI ===
        availability: userForm.availability,
        programs_can_handle: userForm.programs_can_handle
        // ==============================
      
      }); 
      const res = await upsertUserViaRpc(payload, userForm.id); 
      if (res.error) throw res.error; 
      
      setUserForm(INITIAL_USER_FORM); 
      setMessage('Karyawan disimpan.'); 
      await loadAllData(); 
    } catch (error) { 
      setErrorMsg(error.message); 
    } 
  } 
  function generateStudentBarcodeAction() { const branchCode = branches.find((item) => item.id === siswaForm.branch_id)?.kode || selectedBranch?.kode || 'PUSAT'; setSiswaForm((prev) => ({ ...prev, kode_qr: generateStudentBarcode({ nama: prev.nama, kelas: prev.kelas, branchCode }) })) }
  // KODE BARU (SUDAH ADA PEMBERSIH NOMOR HP)
// KODE BARU (SUDAH ADA PEMBERSIH NOMOR HP, TANPA ALERT GANGGUAN)
  async function submitSiswa(event) { 
    event.preventDefault(); 
    try { 
      // 1. Bersihkan nomor HP dulu
      let cleanedHp = String(siswaForm.no_hp || '').replace(/\s+/g, '').replace(/-/g, '').replace(/\./g, '');
      if (cleanedHp.startsWith('0')) {
        cleanedHp = '+62' + cleanedHp.slice(1);
      } else if (cleanedHp.startsWith('62') && !cleanedHp.startsWith('+62')) {
        cleanedHp = '+' + cleanedHp;
      }

      // 2. Terapkan nomor HP yang bersih dan urus Barcode
      const enriched = {
        ...siswaForm,
        no_hp: cleanedHp,
        kode_qr: siswaForm.kode_qr ? siswaForm.kode_qr : generateStudentBarcode({ nama: siswaForm.nama, kelas: siswaForm.kelas, branchCode: branches.find((item) => item.id === siswaForm.branch_id)?.kode })
      }; 
      
      // 3. Simpan ke Supabase
      const res = await upsertSiswa(validateSiswaForm(enriched), siswaForm.id); 
      if (res.error) throw res.error; 
      
      setSiswaForm(INITIAL_SISWA_FORM); 
      setMessage('Siswa disimpan.'); 
      await loadAllData();
      
    } catch (error) { 
      setErrorMsg(error.message);
    } 
  }
  
  const deleteBranch = (id, label) => setDeleteConfirm({ show: true, table: 'branches', id, label })
  const deleteProgram = (id, label) => setDeleteConfirm({ show: true, table: 'programs', id, label })
  const deleteUser = (id, label) => setDeleteConfirm({ show: true, table: 'users', id, label })
  const deleteSiswa = (id, label) => setDeleteConfirm({ show: true, table: 'siswa', id, label })
  const deleteTransaksi = (id, label) => setDeleteConfirm({ show: true, table: 'pembayaran', id, label })
  const deletePengeluaran = (id, label) => setDeleteConfirm({ show: true, table: 'pengeluaran', id, label })
  const deleteInventory = (id, label) => setDeleteConfirm({ show: true, table: 'inventory', id, label })

  async function confirmDelete() {
    const { table, id, label } = deleteConfirm;
    try {
      if (table === 'pembayaran') {
        const trx = pembayaranTampil.find((t) => t.id === id);
        if (trx && trx.keterangan) {
          for (const inv of inventoryTampil) {
            const escapedName = inv.nama.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedName + '\\s*\\((\\d+)x\\)');
            const match = trx.keterangan.match(regex);
            if (match && match[1]) { await updateInventoryStock(inv.id, inv.stok + parseInt(match[1], 10)) }
          }
        }
      }
      
      const { error } = await removeById(table, id);
      if (error) throw error;
      
      setMessage(`Data ${label} berhasil dihapus.`);
      await loadAllData();
    } catch (error) { 
      setErrorMsg(error.message);
    } finally {
      setDeleteConfirm({ show: false, table: '', id: '', label: '' });
    }
  }

  function triggerManualArchive(months = 6) { setArchiveState({ show: true, forced: false, password: '', loading: false, months: months }) }
  function downloadBlobFile(blob, fileName) { const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = fileName; document.body.appendChild(link); link.click(); document.body.removeChild(link) }

  async function executeArchive() {
    if (!archiveState.password) return setErrorMsg('Password wajib diisi!')
    setArchiveState(prev => ({ ...prev, loading: true }))
    try {
      await loginWithRpc(user.email, archiveState.password)
      const now = new Date(); const bufferMonths = archiveState.months || 6; const cutoff = new Date(now.getFullYear(), now.getMonth() - bufferMonths, 1); const cutoffDate = cutoff.toISOString().slice(0, 10);
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"]; const fileLabel = `Sblm_${monthNames[cutoff.getMonth()]}_${cutoff.getFullYear()}`;
      const oldTrans = pembayaranTampil.filter(item => item.tanggal && item.tanggal < cutoffDate); const oldPerk = perkembanganTampil.filter(item => item.tanggal && item.tanggal < cutoffDate);
      if (oldTrans.length === 0 && oldPerk.length === 0) { setArchiveState({ show: false, forced: false, password: '', loading: false, months: 6 }); return setMessage(`Aman! Tidak ada data usang sebelum ${formatTanggal(cutoffDate)}.`) }
      if (oldTrans.length > 0) { const rowsT = oldTrans.map(item => [ item.tanggal, `"${item.siswa?.nama || '-'}"`, `"${item.keterangan || item.programs?.nama || '-'}"`, item.nominal, item.metode_bayar || 'cash', item.status || 'lunas' ].join(',')); const csvContentT = ['Tanggal,Siswa,Keterangan,Nominal,Metode,Status', ...rowsT].join('\n'); const blobT = new Blob([csvContentT], { type: 'text/csv;charset=utf-8;' }); downloadBlobFile(blobT, `Backup_Transaksi_${fileLabel}.csv`); }
      await new Promise(res => setTimeout(res, 500));
      if (oldPerk.length > 0) { const rowsP = oldPerk.map(item => [ item.tanggal, `"${item.siswa?.nama || '-'}"`, `"${item.users?.nama || '-'}"`, `"${(item.catatan || '').replace(/"/g, '""')}"` ].join(',')); const csvContentP = ['Tanggal,Siswa,Guru,Catatan', ...rowsP].join('\n'); const blobP = new Blob([csvContentP], { type: 'text/csv;charset=utf-8;' }); downloadBlobFile(blobP, `Backup_Perkembangan_${fileLabel}.csv`); }
      setMessage('Memproses penghapusan data dari sistem...')
      const delPromisesTrans = oldTrans.map(item => removeById('pembayaran', item.id)); const delPromisesPerk = oldPerk.map(item => removeById('perkembangan', item.id)); await Promise.all([...delPromisesTrans, ...delPromisesPerk])
      setMessage(`${oldTrans.length} Transaksi & ${oldPerk.length} Laporan Perkembangan (${bufferMonths} Bulan) berhasil dibersihkan!`)
      setArchiveState({ show: false, forced: false, password: '', loading: false, months: 6 }); await loadAllData()
    } catch (error) { const displayError = (error.message === 'Login gagal.' || error.message.includes('Invalid login')) ? 'Password Anda salah!' : error.message; setErrorMsg(displayError); setArchiveState(prev => ({ ...prev, loading: false })) }
  }

  function startEditTransaksi(item) { setEditTransaksiForm({ id: item.id, nominal: item.nominal, keterangan: item.keterangan || (item.programs ? item.programs.nama : ''), }) }
  async function submitEditTransaksi(event) { event.preventDefault(); try { const { error } = await updatePembayaran(editTransaksiForm.id, { nominal: Number(editTransaksiForm.nominal), keterangan: editTransaksiForm.keterangan }); if (error) throw error; setEditTransaksiForm(null); setMessage('Transaksi diupdate.'); await loadAllData() } catch (error) { setErrorMsg(error.message) } }
  async function submitPengeluaran(event) { event.preventDefault(); try { if (!pengeluaranForm.kategori || !pengeluaranForm.nominal) throw new Error('Kategori dan nominal wajib diisi.'); const payload = { tanggal: pengeluaranForm.tanggal, kategori: pengeluaranForm.kategori, keterangan: pengeluaranForm.keterangan, nominal: Number(pengeluaranForm.nominal), branch_id: pengeluaranForm.branch_id || null, user_id: user?.id }; let res; if (pengeluaranForm.id) { res = await updatePengeluaran(pengeluaranForm.id, payload) } else { res = await savePengeluaran(payload) } if (res.error) throw res.error; setPengeluaranForm(INITIAL_PENGELUARAN_FORM); setMessage('Pengeluaran disimpan.'); await loadAllData() } catch (error) { setErrorMsg(error.message) } }
  function startEditPengeluaran(item) { setPengeluaranForm({ id: item.id, tanggal: item.tanggal, kategori: item.kategori, keterangan: item.keterangan || '', nominal: item.nominal, branch_id: item.branch_id || '' }); setActiveTab('pengeluaran') }
  async function catatPengeluaranGaji(keterangan, nominal, branch_id) { try { const payload = { tanggal: TODAY(), kategori: 'Gaji Karyawan', keterangan, nominal: Number(nominal), branch_id: branch_id || null, user_id: user?.id }; const res = await savePengeluaran(payload); if (res.error) throw res.error; setMessage(`Slip gaji dibuat & Pengeluaran tercatat.`); await loadAllData() } catch (error) { setErrorMsg(error.message) } }
  async function submitInventory(event) { event.preventDefault(); try { const payload = { nama: inventoryForm.nama, harga: Number(inventoryForm.harga), stok: Number(inventoryForm.stok), branch_id: inventoryForm.branch_id || null }; const res = await upsertInventory(payload, inventoryForm.id); if (res.error) throw res.error; setInventoryForm(INITIAL_INVENTORY_FORM); setMessage('Barang disimpan.'); await loadAllData() } catch (error) { setErrorMsg(error.message) } }
  function startEditInventory(item) { setInventoryForm({ id: item.id, nama: item.nama, harga: item.harga, stok: item.stok, branch_id: item.branch_id || '' }); setActiveTab('inventory') }
  function printStudentBarcode(item) { const isAndroid = /Android/i.test(navigator.userAgent); if (isAndroid) { QRCode.toDataURL(item.kode_qr || item.id, { margin: 1, width: 300 }).then((url) => { const link = document.createElement('a'); link.href = url; link.download = `${item.nama}-barcode.png`; link.click(); alert('QR disimpan.') }); return } printBarcodeCard({ title: `Barcode ${item.nama}`, subtitle: `${item.branches?.nama || '-'} • ${item.kelas || ''}`, value: item.kode_qr || item.id }) }
  function buildStudentInfo(matched) { return { ...matched, nominal: matched.programs?.nominal || 0, guruNama: matched.users?.nama || '-', programNama: matched.programs?.nama || '-' } }



'DISINI DIHAPUS'




  
  async function submitPerkembangan(event) { 
    event.preventDefault(); 
    try { 
      const payload = validatePerkembanganForm(perkembanganForm); 
      const matched = siswaTampil.find((item) => item.id === payload.siswa_id); 
      if (!matched) throw new Error('Siswa tidak ditemukan.'); 
     

      // Pisahkan 'guru_handle_id' agar tidak ikut terkirim ke database
      const { guru_handle_id, ...cleanPayload } = payload;
      
      const res = await savePerkembangan({ 
        ...cleanPayload, 
        guru_id: user?.akses === 'guru' ? user.id : (perkembanganForm.guru_handle_id || matched.guru_id || null) 
      }); 
      
      if (res.error) throw res.error; 
      
      setPerkembanganForm((prev) => ({ 
        ...INITIAL_PERKEMBANGAN_FORM, 
        siswa_id: matched.id, 
        guru_handle_id: user?.akses === 'guru' ? user.id : (prev.guru_handle_id || matched.guru_id || ''), 
        tanggal: TODAY() 
      })); 
      
      setMessage('Perkembangan & kehadiran disimpan.'); 
      await loadAllData();
    } catch (error) { 
      setErrorMsg(error.message);
    } 
  }
  async function prosesScanPerkembangan(decodedText) { 
    try { 
      const matched = siswaTampil.find((item) => item.kode_qr === decodedText || item.id === decodedText); 
      if (!matched) { 
        setSelectedProgressStudent(null); 
        setStudentScanInfo(`QR tidak dikenali`); 
        return; 
      } 
      
      // Update form tanpa panggil ensureStudentSession
      setPerkembanganForm((prev) => ({ 
        ...prev, 
        siswa_id: matched.id, 
        guru_handle_id: user?.akses === 'guru' ? user.id : (matched.guru_id || ''), 
        tanggal: prev.tanggal || TODAY() 
      })); 

      setSelectedProgressStudent(matched);
      setStudentScanInfo(`Siswa ${matched.nama} discan.`); 
      setMessage(`Sesi ${matched.nama} siap diinput.`); 
    } catch (error) { 
      setErrorMsg(error.message);
    } 
  }
  async function prosesScanSiswa(decodedText) { const matched = siswaTampil.find((item) => item.kode_qr === decodedText || item.id === decodedText); if (!matched) { setSelectedStudent(null); setStudentScanInfo(`QR tidak dikenali`); return } const info = buildStudentInfo(matched); setSelectedStudent(info); setKasirForm({ ...INITIAL_KASIR_FORM, cart: [] }); setStudentScanInfo(`Siswa: ${matched.nama}`) }
  async function selectProgressStudentById(id) { 
    try { 
      if (!id) { 
        setSelectedProgressStudent(null); 
        setPerkembanganForm((prev) => ({ ...prev, siswa_id: '' })); 
        return; 
      } 
      const matched = siswaTampil.find((item) => item.id === id); 
      if (!matched) return; 

      const guruHandleId = user?.akses === 'guru' ? user.id : (matched.guru_id || ''); 

      setPerkembanganForm((prev) => ({ 
        ...prev, 
        siswa_id: matched.id, 
        guru_handle_id: guruHandleId, 
        tanggal: prev.tanggal || TODAY() 
      })); 
      
      setSelectedProgressStudent(matched);
      setStudentScanInfo(`Sesi ${matched.nama} siap diinput.`); 
    } catch (error) { 
      setErrorMsg(error.message); 
    } 
  }
  function selectStudentById(id) { if (!id) return setSelectedStudent(null); const matched = siswaTampil.find((item) => item.id === id); if (!matched) return; const info = buildStudentInfo(matched); setSelectedStudent(info); setKasirForm({ ...INITIAL_KASIR_FORM, cart: [] }); setStudentScanInfo(`Siswa: ${matched.nama}`) }
  
  // === SUBMIT KASIR KERANJANG (CART) ===
  async function submitKasir(event) { 
    event.preventDefault(); 
    try { 
      if (!selectedStudent) throw new Error('Pilih siswa dulu.'); 
      const cart = kasirForm.cart || []; 
      if (cart.length === 0) throw new Error('Keranjang belanja masih kosong!'); 
      
      const subtotalCart = cart.reduce((sum, item) => sum + (item.harga * item.qty), 0); 
      
      let diskon = 0;
      if (kasirForm.diskon_tipe === 'persen') {
        diskon = subtotalCart * ((Number(kasirForm.diskon) || 0) / 100);
      } else {
        diskon = Number(kasirForm.diskon) || 0;
      }
      
      const totalBayar = Math.max(0, subtotalCart - diskon); 
      const nominalBayar = Number(kasirForm.nominal_bayar) || 0;

      if (kasirForm.status === 'lunas' && nominalBayar > 0 && nominalBayar < totalBayar) {
        throw new Error(`Uang yang dibayarkan kurang! Tagihan: ${formatRupiah(totalBayar)}`);
      }

      for (const item of cart) { 
        if (item.type === 'barang' && item.inventory_id) { 
          const invItem = inventoryTampil.find(i => i.id === item.inventory_id); 
          if (!invItem) throw new Error(`Barang ${item.nama} tidak ditemukan.`); 
          if (invItem.stok < item.qty) throw new Error(`Stok ${invItem.nama} tidak cukup.`); 
          await updateInventoryStock(invItem.id, invItem.stok - item.qty); 
        } 
      } 
      
      let details = cart.map(item => `${item.nama} (${item.qty}x)`).join(', '); 
      let finalKeterangan = details; 
      if (kasirForm.keterangan) finalKeterangan += ` | Catatan: ${kasirForm.keterangan}`; 
      
      const sppItem = cart.find(i => i.type === 'spp'); 
      const safeProgId = sppItem ? (selectedStudent.program_id || null) : null; 
      
      const res = await saveKasirTransaction({ 
        p_siswa_id: selectedStudent.id, 
        p_program_id: safeProgId, 
        p_kasir_id: user?.id, 
        p_tanggal: TODAY(), 
        p_nominal: totalBayar, 
        p_status: kasirForm.status, 
        p_metode_bayar: kasirForm.metode_bayar, 
        p_keterangan: finalKeterangan 
      }); 
      if (res.error) throw res.error; 
      
      if (kasirForm.status === 'lunas') { 
        setLastReceipt({ 
          nama: selectedStudent.nama, 
          no_hp: selectedStudent.no_hp, 
          cabang: selectedBranch?.nama || '-', 
          cart: [...cart], 
          nominal: totalBayar, 
          subtotal: subtotalCart, 
          diskon: diskon, 
          nominal_bayar: nominalBayar,
          kembalian: nominalBayar > 0 ? nominalBayar - totalBayar : 0,
          metode_bayar: kasirForm.metode_bayar, 
          status: kasirForm.status 
        }); 
        setShowReceiptPopup(true); 
      } 
      
      setMessage('Transaksi berhasil disimpan.'); 
      setSelectedStudent(null); 
      setKasirForm({ status: 'lunas', nominal: '', diskon: '', diskon_tipe: 'nominal', nominal_bayar: '', keterangan: '', metode_bayar: 'cash', program_id: '', jenis_transaksi: 'program', inventory_id: '', cart: [] }); 
      setStudentScanText(''); 
      setStudentScanInfo('Belum scan.'); 
      await loadAllData(); 
    } catch (error) { setErrorMsg(error.message) } 
  }
  
  async function submitStudentAttendance(event) { event.preventDefault(); try { const payload = validateStudentAttendanceForm(studentAttendanceForm); const res = await saveStudentAttendance({ p_siswa_id: payload.siswa_id, p_guru_handle_id: payload.guru_handle_id, p_tanggal: payload.tanggal, p_mode: payload.mode, p_status: payload.status, p_catatan: payload.catatan, p_sumber: 'manual' }); if (res.error) throw res.error; setStudentAttendanceForm(INITIAL_STUDENT_ATTENDANCE_FORM); setMessage('Absensi siswa disimpan.'); await loadAllData() } catch (error) { setErrorMsg(error.message) } }
  async function submitEmployeeManualAttendance(event) { event.preventDefault(); try { const payload = validateEmployeeManualForm(employeeManualForm); const res = await saveEmployeeManualAttendance({ p_user_id: payload.user_id, p_tanggal: payload.tanggal, p_status: payload.status, p_jam_datang: payload.jam_datang || null, p_jam_pulang: payload.jam_pulang || null, p_catatan: payload.catatan }); if (res.error) throw res.error; setEmployeeManualForm(INITIAL_EMPLOYEE_MANUAL_FORM); setMessage('Absensi manual disimpan.'); await loadAllData() } catch (error) { setErrorMsg(error.message) } }
  
  function buildReceiptHtml(data, withAutoPrint = true) { 
    const cartHtml = (data.cart || []).map(c => `<div class="row"><span>${c.nama} (${c.qty}x)</span><span>${formatRupiah(c.harga * c.qty)}</span></div>`).join('');
    const diskonHtml = data.diskon > 0 ? `<div class="row" style="margin-top:5px; border-top:1px dashed #ddd; padding-top:5px"><span class="label">Subtotal:</span><span>${formatRupiah(data.subtotal || 0)}</span></div><div class="row"><span class="label">Diskon:</span><span>-${formatRupiah(data.diskon)}</span></div>` : '';
    
    let bayarHtml = '';
    if (data.nominal_bayar && data.nominal_bayar > 0) {
      bayarHtml = `<div class="line"></div><div class="row"><span class="label">Tunai Bayar:</span><span>${formatRupiah(data.nominal_bayar)}</span></div><div class="row"><span class="label">Kembalian:</span><span>${formatRupiah(data.kembalian || 0)}</span></div>`;
    }

    return `<!doctype html><html><head><meta charset="utf-8"><title>Bukti Bayar</title><meta name="viewport" content="width=device-width, initial-scale=1" /><style>body{font-family:Arial,sans-serif;width:72mm;margin:0 auto;padding:8px;color:#000;background:#fff}.receipt{text-align:left;font-size:12px;line-height:1.4}.center{text-align:center}.line{border-top:1px dashed #000;margin:8px 0}.row{display:flex;justify-content:space-between;gap:8px}.label{font-weight:bold}.big{font-size:15px;font-weight:bold}.help{margin-top:12px;font-size:11px;color:#374151;background:#f8fafc;padding:8px;border-radius:8px}@media print{body{width:72mm}}</style></head><body ${withAutoPrint ? 'onload=\"window.print();window.close()\"' : ''}><div class=\"receipt\"><div class=\"center big\">BIMBEL PRO</div><div class=\"center\">Bukti Pembayaran</div><div class=\"line\"></div><div><span class=\"label\">Tanggal:</span> ${new Date().toLocaleString('id-ID')}</div><div><span class=\"label\">Cabang:</span> ${data.cabang || '-'}</div><div><span class=\"label\">Nama siswa:</span> ${data.nama || '-'}</div><div><span class=\"label\">Metode bayar:</span> ${(data.metode_bayar || 'cash').toUpperCase()}</div><div><span class=\"label\">Status:</span> ${(data.status || 'LUNAS').toUpperCase()}</div><div class=\"line\"></div><div class=\"center\" style=\"margin-bottom:8px\"><b>Rincian Pembelian:</b></div>${cartHtml}${diskonHtml}<div class=\"line\"></div><div class=\"row\"><span class=\"label\">Total Tagihan:</span><span class=\"big\">${formatRupiah(data.nominal || 0)}</span></div>${bayarHtml}<div class=\"line\"></div><div class=\"center\">Terima kasih</div>${withAutoPrint ? '' : '<div class=\"help\"><b>Cara print di Android:</b><br/>1. Buka menu browser<br/>2. Pilih Share atau bagikan ke aplikasi printer bluetooth<br/>3. Jika aplikasi printer mendukung print halaman web/teks, gunakan halaman ini sebagai sumber cetak.</div>'}</div></body></html>` 
  }
  function printThermalReceiptDesktop(receipt) { const data = receipt || lastReceipt; if (!data) return setErrorMsg('Belum ada pembayaran.'); const w = window.open('', '_blank', 'width=420,height=700'); if (!w) return setErrorMsg('Popup diblokir.'); w.document.write(buildReceiptHtml(data, true)); w.document.close() }
  function printThermalReceiptAndroid(receipt) { const data = receipt || lastReceipt; if (!data) return setErrorMsg('Belum ada pembayaran.'); const w = window.open('', '_blank'); if (!w) return setErrorMsg('Popup diblokir.'); w.document.write(buildReceiptHtml(data, false)); w.document.close() }
  function openSmartWA(phone, text) { if (!phone) { alert('Maaf, nomor HP belum tersimpan di sistem.'); return; } let formattedPhone = phone.startsWith('0') ? '62' + phone.substring(1) : phone; formattedPhone = formattedPhone.replace(/\D/g, ''); const encodedText = encodeURIComponent(text); const waLink = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`; window.open(waLink, '_blank'); }
  function sendThermalReceiptWA() { const data = lastReceipt; if (!data) return setErrorMsg('Belum ada transaksi terakhir untuk dikirim.'); let text = `*BIMBEL PRO - BUKTI PEMBAYARAN*\n\nTanggal: ${new Date().toLocaleString('id-ID')}\nCabang: ${data.cabang || '-'}\nNama Siswa: ${data.nama || '-'}\nMetode Bayar: ${(data.metode_bayar || 'cash').toUpperCase()}\nStatus: ${(data.status || 'LUNAS').toUpperCase()}\n\n*Rincian Pembelian:*\n`; (data.cart || []).forEach(c => { text += `- ${c.nama} (${c.qty}x): ${formatRupiah(c.harga * c.qty)}\n`; }); if (data.diskon > 0) { text += `\nSubtotal: ${formatRupiah(data.subtotal || 0)}\nDiskon: -${formatRupiah(data.diskon)}\n`; } text += `\n*Total Tagihan: ${formatRupiah(data.nominal || 0)}*\n\nTerima kasih atas kepercayaannya.`; openSmartWA(data.no_hp, text); }
  function sendPerkembanganWA(item) { if (!item) return; let text = `Halo Ayah/Bunda,\nBerikut adalah laporan perkembangan dan kehadiran ananda *${item.siswa?.nama || '-'}* pada ${formatTanggal(item.tanggal)}:\n\n*Catatan Guru:*\n${item.catatan || 'Hadir mengikuti sesi pembelajaran dengan baik.'}\n\nSalam hangat,\nAdmin ${item.siswa?.branches?.nama || 'Bimbel Pro'}`; openSmartWA(item.siswa?.no_hp, text); }
  async function prosesScanKaryawan(decodedText) { try { const validCode = employeeMode === 'datang' ? employeeBarcodeIn : employeeBarcodeOut; if (decodedText !== validCode) { setEmployeeScanInfo(`Barcode ${employeeMode} tidak dikenali.`); return } const res = await saveEmployeeAttendance({ p_user_id: user?.id, p_tanggal: TODAY(), p_mode: employeeMode }); if (res.error) throw res.error; setEmployeeScanInfo(`Scan ${employeeMode} berhasil untuk ${user?.nama}.`); setMessage(`Absensi ${employeeMode} disimpan.`); await loadAllData() } catch (error) { setErrorMsg(error.message) } }
  async function submitBonus(event) { event.preventDefault(); try { const targetUser = usersTampil.find((item) => item.id === bonusForm.user_id); const res = await saveBonus({ user_id: bonusForm.user_id, branch_id: targetUser?.branch_id || null, bonus_date: bonusForm.bonus_date, amount: bonusForm.amount, description: bonusForm.description, created_by: user?.id || null }); if (res.error) throw res.error; setBonusForm(INITIAL_BONUS_FORM); setMessage('Bonus disimpan.'); await loadAllData() } catch (error) { setErrorMsg(error.message) } }
  function addReviewItem() { setReviewForm((prev) => ({ ...prev, items: [...prev.items, { title: '', score: '8', note: '' }] })) }
  function changeReviewItem(index, field, value) { setReviewForm((prev) => ({ ...prev, items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item) })) }
  function removeReviewItem(index) { setReviewForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) })) }
  async function submitReview(event) { event.preventDefault(); try { const res = await saveReview({ ...validateReviewForm(reviewForm), reviewer_id: user?.id || null }); if (res.error) throw res.error; setReviewForm(INITIAL_REVIEW_FORM); setMessage('Review disimpan.'); await loadAllData() } catch (error) { setErrorMsg(error.message) } }
  function printEmployeeReview(review) { const avg = review.items?.length ? (review.items.reduce((sum, item) => sum + Number(item.score || 0), 0) / review.items.length).toFixed(1) : '0.0'; const rows = (review.items || []).map((item, index) => `<tr><td>${index + 1}</td><td>${item.title}</td><td style=\"text-align:center\">${item.score}</td><td>${item.note || '-'}</td></tr>`).join(''); const html = `<!doctype html><html><head><meta charset=\"utf-8\"><title>Penilaian Karyawan</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#0f172a}h1,h2,p{margin:0}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #cbd5e1;padding:10px;font-size:12px;text-align:left}th{background:#f8fafc}.header{display:flex;justify-content:space-between;align-items:flex-start}.muted{color:#475569}.badge{display:inline-block;border:1px solid #cbd5e1;padding:4px 8px;border-radius:999px}.footer{margin-top:24px;font-size:12px;color:#475569}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px}.card{border:1px solid #e2e8f0;border-radius:16px;padding:14px;background:#fff}</style></head><body onload=\"window.print()\"><div class=\"header\"><div><h1>Form Penilaian Karyawan</h1><p class=\"muted\">Periode ${formatMonthYear(review.period_month, review.period_year)}</p></div><div class=\"badge\">Rata-rata ${avg}</div></div><div class=\"summary\"><div class=\"card\"><b>Nama Karyawan</b><div>${review.user?.nama || '-'}</div></div><div class=\"card\"><b>Cabang</b><div>${review.user?.branch_nama || '-'}</div></div><div class=\"card\"><b>Dinilai oleh</b><div>${review.reviewer?.nama || '-'}</div></div></div><table><thead><tr><th>No</th><th>Poin Penilaian</th><th>Nilai</th><th>Catatan</th></tr></thead><tbody>${rows}</tbody></table><div class=\"footer\"><b>Catatan Umum:</b><br />${review.notes || '-'}</div></body></html>`; const w = window.open('', '_blank', 'width=960,height=720'); if (!w) return setErrorMsg('Popup diblokir.'); w.document.write(html); w.document.close() }
  function togglePermissionDraft(menuKey) { setPermissionDraft((prev) => prev.includes(menuKey) ? prev.filter((item) => item !== menuKey) : [...prev, menuKey]) }
  function selectAllPermissions() { setPermissionDraft(visibleTabs.length ? Array.from(new Set([...permissionDraft, ...visibleTabs])) : permissionDraft) }
  function resetPermissionDraft(nextPermissions = []) { setPermissionDraft(nextPermissions) }
  async function savePermissions() { try { if (!permissionUserId) throw new Error('Pilih user.'); const res = await saveUserPermissions(permissionUserId, permissionDraft); if (res.error) throw res.error; if (user?.id === permissionUserId) { const updated = { ...user, menu_permissions: permissionDraft }; setUser(updated); saveSession(updated) } setMessage('Hak akses disimpan.'); await loadAllData() } catch (error) { setErrorMsg(error.message) } }
  function startEditBranch(item) { setBranchForm({ id: item.id, nama: item.nama, kode: item.kode, alamat: item.alamat || '', employee_barcode_in: item.employee_barcode_in || EMPLOYEE_GLOBAL_IN, employee_barcode_out: item.employee_barcode_out || EMPLOYEE_GLOBAL_OUT }); setActiveTab('cabang') }
  function startEditProgram(item) { setProgramForm({ id: item.id, nama: item.nama, deskripsi: item.deskripsi || '', nominal: item.nominal || '' }); setActiveTab('program') }
  function startEditUser(item) { 
    setUserForm({ 
      ...item, 
      password: '', // Kosongkan password saat edit agar tidak menimpa yang lama
      // Tambahkan dua baris ini:
      availability: item.availability || INITIAL_AVAILABILITY, 
      programs_can_handle: item.programs_can_handle || []
    }); 
    setActiveTab('users');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function startEditSiswa(item) { setSiswaForm({ id: item.id, nama: item.nama || '', branch_id: item.branch_id || '', program_id: item.program_id || '', kelas: item.kelas || '', nama_ortu: item.nama_ortu || '', no_hp: item.no_hp || '', alamat: item.alamat || '', kode_qr: item.kode_qr || '', guru_id: item.guru_id || '' }); setActiveTab('siswa') }
  function setQuickExportRange(mode) { const today = TODAY(); if (mode === 'today') { setExportDateFrom(today); setExportDateTo(today); return } if (mode === 'week') { const now = new Date(); const day = now.getDay() || 7; now.setDate(now.getDate() - (day - 1)); setExportDateFrom(now.toISOString().slice(0, 10)); setExportDateTo(today); return } if (mode === 'month') { const now = new Date(); now.setDate(1); setExportDateFrom(now.toISOString().slice(0, 10)); setExportDateTo(today); return } setExportDateFrom(''); setExportDateTo('') }
  function handleDownload() { const rows = exportRows({ exportType, branches, siswa: siswaTampil, users: usersTampil, programs, pembayaran: pembayaranTampil, absensiSiswa: absensiSiswaTampil, absensiKaryawan: absensiKaryawanTampil, perkembangan: perkembanganTampil, payrollRows, dateFrom: exportDateFrom, dateTo: exportDateTo }); if (!rows.length) return setErrorMsg('Tidak ada data.'); downloadCsv(exportType, rows); setMessage(`Data ${exportType} didownload.`) }

  return {
    state: {
      user, email, password, loginError, loadingLogin, activeTab, message, errorMsg, loadingData, branches, programs, users, siswa, pembayaran, absensiSiswa, perkembangan, absensiKaryawan, bonusManual, reviews, pengeluaranTampil, inventoryTampil, branchForm, programForm, userForm, siswaForm, perkembanganForm, kasirForm, bonusForm, employeeManualForm, studentAttendanceForm, reviewForm, pengeluaranForm, inventoryForm, permissionUserId, permissionDraft, scanStudentActive, scanEmployeeActive, employeeMode, studentScanText, employeeScanText, studentScanInfo, employeeScanInfo, selectedStudent, selectedProgressStudent, exportType, exportDateFrom, exportDateTo, lastReceipt, selectedBranchId, selectedBranch, employeeBarcodeIn, employeeBarcodeOut, progressInputMode, guruOptions, visibleTabs, usersTampil, siswaTampil, pembayaranTampil, perkembanganTampil, perkembanganHistory, absensiKaryawanTampil, bonusManualTampil, absensiSiswaTampil, reviewsTampil, overview, financeSummary, payrollRows, stats, searchSiswa, searchTransaksi, payrollMonth, payrollYear, showReceiptPopup, editTransaksiForm, deleteConfirm, archiveState
    },
   actions: {
      setUser, setEmail, setPassword, setActiveTab, setMessage, setErrorMsg, setSelectedBranchId, setBranchForm, setProgramForm, setUserForm, setSiswaForm, setPerkembanganForm, setKasirForm, setBonusForm, setEmployeeManualForm, setStudentAttendanceForm, setReviewForm, setPengeluaranForm, setInventoryForm, setPermissionUserId, setPermissionDraft, setScanStudentActive, setScanEmployeeActive, setEmployeeMode, setExportType, setExportDateFrom, setExportDateTo, setProgressInputMode, setPayrollMonth, setPayrollYear, setShowReceiptPopup, setEditTransaksiForm, submitEditTransaksi, login, logout, loadAllData, setDeleteConfirm, confirmDelete, submitBranch, deleteBranch, submitProgram, deleteProgram, submitUser, deleteUser, submitSiswa, deleteSiswa, submitPengeluaran, deletePengeluaran, submitInventory, deleteInventory,
      deleteBonus: (id, label) => setDeleteConfirm({ show: true, table: 'employee_bonus', id, label }),
      deletePerkembangan: (id, label) => setDeleteConfirm({ show: true, table: 'perkembangan', id, label: `materi ${label}` }),
      submitPerkembangan, submitKasir, submitBonus, submitEmployeeManualAttendance, submitStudentAttendance, submitReview, prosesScanSiswa, prosesScanPerkembangan, prosesScanKaryawan, startEditBranch, startEditProgram, startEditUser, startEditSiswa, startEditPengeluaran, startEditInventory, handleDownload, printThermalReceiptDesktop, printThermalReceiptAndroid, selectStudentById, selectProgressStudentById, generateStudentBarcodeAction, printStudentBarcode, addReviewItem, changeReviewItem, removeReviewItem, printEmployeeReview, togglePermissionDraft, savePermissions, selectAllPermissions, resetPermissionDraft, setQuickExportRange, setSearchSiswa, setSearchTransaksi, deleteTransaksi, catatPengeluaranGaji, sendThermalReceiptWA, sendPerkembanganWA, openSmartWA, startEditTransaksi, setArchiveState, triggerManualArchive, executeArchive
    },
  }
}
