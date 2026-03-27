'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import {
  EMPLOYEE_GLOBAL_IN, EMPLOYEE_GLOBAL_OUT, INITIAL_BONUS_FORM, INITIAL_BRANCH_FORM,
  INITIAL_EMPLOYEE_MANUAL_FORM, INITIAL_KASIR_FORM, INITIAL_PERKEMBANGAN_FORM,
  INITIAL_PROGRAM_FORM, INITIAL_REVIEW_FORM, INITIAL_SISWA_FORM, INITIAL_STUDENT_ATTENDANCE_FORM,
  INITIAL_USER_FORM, INITIAL_PENGELUARAN_FORM, INITIAL_INVENTORY_FORM, TODAY, allowedTabs, defaultPermissionsByRole, normalizePermissions,
} from '../lib/constants'
import { formatMonthYear, formatRupiah, generateStudentBarcode, formatTanggal } from '../lib/format'
import { loginWithRpc } from '../lib/auth'
import {
  fetchAllData, removeById, saveBonus, saveEmployeeAttendance, saveEmployeeManualAttendance,
  saveKasirTransaction, savePerkembangan, saveReview, saveStudentAttendance,
  saveUserPermissions, upsertBranch, upsertProgram, upsertSiswa, upsertUserViaRpc,
  updatePembayaran, savePengeluaran, updatePengeluaran, upsertInventory, updateInventoryStock
} from '../lib/data'
import { validateBonusForm, validateBranchForm, validateEmployeeManualForm, validateKasirForm, validatePerkembanganForm, validateProgramForm, validateReviewForm, validateSiswaForm, validateStudentAttendanceForm, validateUserForm } from '../lib/validation'
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

  const guruOptions = useMemo(() => usersTampil.filter((item) => item.akses === 'guru'), [usersTampil])
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
    if (!
